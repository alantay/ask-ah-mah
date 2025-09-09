"use client";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
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
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import { mutate } from "swr";

type MetadataWithToolCalls = {
  toolCalls?: unknown[];
};

const Chat = () => {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    onFinish: (options) => {
      const { message } = options;
      let toolCalled = false;
      console.log("onFinish");

      const metadata = message.metadata as MetadataWithToolCalls;
      // Example: Inspect metadata or parts for tool usage info
      console.log("Full message meta", message.metadata);

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
          mutate("/api/inventory", undefined, { revalidate: true });
          toolCalled = true;
        }
      });
      if (!toolCalled) console.log("No tool called");
    },
  });

  return (
    <div className="flex h-[600px] flex-col">
      <Conversation>
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="Welcome to Ask Ah Mah!"
              description="I'm your friendly cooking assistant. Ask me about recipes, ingredients, or add items to your pantry!"
            />
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <Message key={message.id} from={message.role}>
                  <MessageAvatar
                    src=""
                    name={message.role === "user" ? "🙋‍♀️" : "👵"}
                  />
                  <MessageContent>
                    {message.parts.map((part, index) =>
                      part.type === "text" ? (
                        <Response key={`${message.id}-${index}`}>
                          {part.text}
                        </Response>
                      ) : null
                    )}
                  </MessageContent>
                </Message>
              ))}
            </div>
          )}
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
