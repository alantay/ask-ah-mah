"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSessionContext } from "@/contexts/SessionContext";
import {
  AddInventoryItemSchemaObj,
  RemoveInventoryItemSchemaObj,
} from "@/lib/inventory/schemas";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { z } from "zod";
import { INITIAL_MESSAGE } from "./constants";
import { getRandomThinkingMessage } from "./utils";

const Chat = () => {
  const [input, setInput] = useState("");
  const { userId, isLoading } = useSessionContext();
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        userId: userId || "",
      },
    }),
    onFinish: (options) => {
      const { message } = options;
      let toolCalled = false;

      console.log("message", message);
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
                    .map((i) => i.name)
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
                    .map((i) => i)
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

  // Show loading state while session is loading
  if (isLoading || !userId) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }
  const allMessages = [INITIAL_MESSAGE, ...messages];

  return (
    <div className="flex h-[80dvh] flex-col">
      <Conversation>
        <ConversationContent>
          {
            <div className="space-y-4">
              {allMessages.map((message) => (
                <Message key={message.id} from={message.role}>
                  <MessageContent>
                    {message.parts.map((part, index) =>
                      part.type === "text" ? (
                        <Response key={`${message.id}-${index}`}>
                          {part.text}
                        </Response>
                      ) : null
                    )}
                    {status === "streaming" &&
                      message === messages[messages.length - 1] &&
                      message.role === "assistant" && ( // don't show thinking message for user messages
                        <span className="animate-pulse text-muted-foreground">
                          {getRandomThinkingMessage()}
                        </span>
                      )}
                  </MessageContent>
                  <MessageAvatar
                    src=""
                    name={message.role === "user" ? "🙋‍♀️" : "👵"}
                  />
                </Message>
              ))}
            </div>
          }
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            sendMessage({ text: input });
            setInput("");
          }
        }}
        className="border-t p-4"
      >
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={status !== "ready"}
            placeholder="Ask Ah Mah a question..."
            className="flex-1"
          />
          <Button type="submit" disabled={status !== "ready"}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
