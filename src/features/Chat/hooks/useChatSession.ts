"use client";

import { useConversationContext } from "@/contexts/ConversationContext";
import { useSessionContext } from "@/contexts/SessionContext";
import {
  AddInventoryItemSchemaObj,
  RemoveInventoryItemSchemaObj,
} from "@/lib/inventory/schemas";
import { SavedMessage } from "@/lib/messages/schemas";
import { fetcher, upperCaseFirstLetter } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { z } from "zod";
import { INITIAL_MESSAGE } from "../constants";
import { convertToUIMessage } from "../utils";

export function useChatSession() {
  const { userId } = useSessionContext();
  const { activeConversationId, autoTitleActiveConversation } =
    useConversationContext();

  const [submittedAt, setSubmittedAt] = useState<number | null>(null);
  const autoTitledConversations = useRef<Set<string>>(new Set());
  const autoTitlingConversations = useRef<Set<string>>(new Set());

  const { messages, sendMessage, status } = useChat({
    id: activeConversationId ?? undefined,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { userId, conversationId: activeConversationId },
    }),
    onError: (error) => {
      console.error("Chat error:", error);
      if (error.message.includes("503")) {
        toast.error(
          "Sorry lah, Ah Mah's cooking brain is taking a break! Try again in a few minutes."
        );
      } else {
        toast.error("Aiyah, something went wrong! Please try again later.");
      }
    },
    onFinish: async (options) => {
      const { message } = options;

      if (message.role === "assistant") {
        const content = message.parts
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("");
        if (content) await saveMessage("assistant", content);
      }

      message.parts.forEach((part) => {
        if (part.type.startsWith("tool-")) {
          const { input } = part as {
            input:
              | z.infer<typeof AddInventoryItemSchemaObj>
              | z.infer<typeof RemoveInventoryItemSchemaObj>;
          };

          switch (part.type) {
            case "tool-addInventoryItem": {
              const addInput = input as z.infer<typeof AddInventoryItemSchemaObj>;
              toast.success(
                `${addInput.items.map((i) => upperCaseFirstLetter(i.name)).join(", ")} added to inventory!`
              );
              mutate(`/api/inventory?userId=${userId}`);
              break;
            }
            case "tool-removeInventoryItem": {
              const removeInput = input as z.infer<typeof RemoveInventoryItemSchemaObj>;
              toast.success(
                `${removeInput.itemNames.map((i) => upperCaseFirstLetter(i)).join(", ")} removed from inventory!`
              );
              mutate(`/api/inventory?userId=${userId}`);
              break;
            }
          }
        }
      });
    },
  });

  const { data, isLoading: messagesLoading } = useSWR<SavedMessage[]>(
    userId && activeConversationId
      ? `/api/message?conversationId=${activeConversationId}`
      : null,
    fetcher,
    { shouldRetryOnError: true, revalidateOnMount: true }
  );

  const saveMessage = async (role: "user" | "assistant", content: string) => {
    try {
      await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          conversationId: activeConversationId,
          role,
          content,
        }),
      });
      mutate(`/api/message?conversationId=${activeConversationId}`);
    } catch (error) {
      console.error("Failed to save message:", error);
    }
  };

  useEffect(() => {
    if (status !== "submitted") setSubmittedAt(null);
  }, [status]);

  const handleRecipeDetected = useCallback(
    (recipeTitle: string) => {
      if (!activeConversationId) return;
      if (autoTitledConversations.current.has(activeConversationId)) return;
      if (autoTitlingConversations.current.has(activeConversationId)) return;
      autoTitlingConversations.current.add(activeConversationId);
      void autoTitleActiveConversation(recipeTitle).then((success) => {
        autoTitlingConversations.current.delete(activeConversationId!);
        if (success) autoTitledConversations.current.add(activeConversationId!);
      });
    },
    [activeConversationId, autoTitleActiveConversation]
  );

  const savedMessages = (data || []).map(convertToUIMessage);

  const savedMessagesFiltered = savedMessages.filter((savedMsg) => {
    const savedContent = savedMsg.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("");

    return !messages.some((currentMsg) => {
      const currentContent = currentMsg.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("");
      return savedContent === currentContent && savedMsg.role === currentMsg.role;
    });
  });

  const allMessages = [INITIAL_MESSAGE, ...savedMessagesFiltered, ...messages];

  const handleSendMessage = async (message: string) => {
    setSubmittedAt(Date.now());
    await saveMessage("user", message);
    sendMessage({ text: message });
  };

  return {
    userId,
    activeConversationId,
    allMessages,
    status,
    submittedAt,
    messagesLoading,
    handleSendMessage,
    handleRecipeDetected,
  };
}
