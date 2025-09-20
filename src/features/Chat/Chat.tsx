"use client";

import { useSessionContext } from "@/contexts/SessionContext";
import {
  AddInventoryItemSchemaObj,
  RemoveInventoryItemSchemaObj,
} from "@/lib/inventory/schemas";
import { SavedMessage } from "@/lib/messages/schemas";
import { upperCaseFirstLetter } from "@/lib/utils";
import { fetcher } from "@/lib/utils/index";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { z } from "zod";
import { MessageInput } from "./components/MessageInput";
import { MessageList } from "./components/MessageList";
import { INITIAL_MESSAGE, LOADING_MESSAGES } from "./constants";
import { convertToUIMessage, getRandomThinkingMessage } from "./utils";

const Chat = () => {
  const { userId, isLoading } = useSessionContext();

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        userId,
      },
    }),
    onFinish: async (options) => {
      const { message } = options;
      let toolCalled = false;

      // console.log("message", message);

      if (message.role === "assistant") {
        const content = message.parts
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("");
        if (content) {
          await saveMessage("assistant", content);
        }
      }
      // const metadata = message.metadata as MetadataWithToolCalls;
      // Example: Inspect metadata or parts for tool usage info
      // console.log("Full message meta", metadata);

      // If toolCalls array is present:
      // Leaving this here for now. Didn't seem to hit this condition.
      // if (metadata?.toolCalls?.length) {
      //   console.log("Tools used in this message:", metadata.toolCalls);
      // } else {
      //   console.log("No tools used in this message.");
      // }

      message.parts.forEach((part) => {
        if (part.type.startsWith("tool-")) {
          console.log(part.type, " called");
          const { input } = part as {
            input:
              | z.infer<typeof AddInventoryItemSchemaObj>
              | z.infer<typeof RemoveInventoryItemSchemaObj>;
          };

          switch (part.type) {
            case "tool-addInventoryItem":
              {
                const addInput = input as z.infer<
                  typeof AddInventoryItemSchemaObj
                >;

                toast.success(
                  `${addInput.items
                    .map((i) => upperCaseFirstLetter(i.name))
                    .join(", ")} added to inventory!`
                );
                mutate(`/api/inventory?userId=${userId}`);
              }
              break;
            case "tool-removeInventoryItem":
              {
                const removeInput = input as z.infer<
                  typeof RemoveInventoryItemSchemaObj
                >;

                toast.success(
                  `${removeInput.itemNames
                    .map((i) => upperCaseFirstLetter(i))
                    .join(", ")} removed from inventory!`
                );
                mutate(`/api/inventory?userId=${userId}`);
              }
              break;
            case "tool-getInventory":
              // we mutate for other tools
              break;
          }
          toolCalled = true;
        }
      });
      if (!toolCalled) console.log("No tool called");
    },
  });

  const { data, isLoading: messagesLoading } = useSWR<SavedMessage[]>(
    userId ? `/api/message?userId=${userId}` : null,
    fetcher,
    {
      shouldRetryOnError: true,
      revalidateOnMount: true,
    }
  );

  const saveMessage = async (role: "user" | "assistant", content: string) => {
    try {
      await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role, content }),
      });
      mutate(`/api/message?userId=${userId}`);
    } catch (error) {
      console.error("Failed to save message:", error);
    }
  };

  const thinkingMessage = useMemo(() => {
    return getRandomThinkingMessage();
  }, [status === "streaming"]);

  // Show loading state while session is loading
  if (messagesLoading || !userId) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div className="animate-pulse">
          {
            LOADING_MESSAGES[
              Math.floor(Math.random() * LOADING_MESSAGES.length)
            ]
          }
        </div>
      </div>
    );
  }

  const savedMessages = (data || []).map(convertToUIMessage);
  // Only show saved messages if there are no current UI messages (to avoid duplicates)
  const currentMessages = messages.filter((currentMsg) => {
    const currentContent = currentMsg.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("");

    return !savedMessages.some((savedMsg) => {
      const savedContent = savedMsg.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("");

      return (
        savedContent === currentContent && savedMsg.role === currentMsg.role
      );
    });
  });

  const allMessages = [INITIAL_MESSAGE, ...savedMessages, ...currentMessages];

  const handleSendMessage = async (message: string) => {
    await saveMessage("user", message);
    sendMessage({ text: message });
  };

  return (
    <div className="flex flex-col animate-in fade-in  duration-300 h-full">
      <MessageList
        messages={allMessages}
        status={status}
        userId={userId}
        thinkingMessage={thinkingMessage}
      />
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={status !== "ready"}
      />
    </div>
  );
};

export default Chat;
