"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import { mutate } from "swr";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
      console.log("onFinish");
      mutate("/api/inventory");

      const metadata = message.metadata as MetadataWithToolCalls;
      // Example: Inspect metadata or parts for tool usage info
      console.log("Full message meta", message.metadata);

      // If toolCalls array is present:
      // Leaving this here for now. Didn't seem to hit this condition.
      if (metadata?.toolCalls?.length) {
        console.log("Tools used in this message:", metadata.toolCalls);
      } else {
        console.log("No tools used in this message.");
      }

      message.parts.forEach((part) => {
        if (part.type.startsWith("tool-")) {
          console.log("Tool part detected:", part);
        }
      });
    },
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {messages.map((message) => (
          <Card key={message.id}>
            <CardContent className="pt-4">
              <div className="flex gap-2">
                <span className="font-semibold">
                  {message.role === "user" ? "You: " : "Ah Mah: "}
                </span>
                <div>
                  {message.parts.map((part, index) =>
                    part.type === "text" ? <span key={index}>{part.text}</span> : null
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            sendMessage({ text: input });
            setInput("");
          }
        }}
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
