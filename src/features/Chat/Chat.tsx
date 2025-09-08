"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import { mutate } from "swr";

type MetadataWithToolCalls = {
  toolCalls?: unknown[]; // or more specific type if you know it
};

const Chat = () => {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    onFinish: (options) => {
      const { message } = options;
      mutate("/api/inventory");

      const metadata = message.metadata as MetadataWithToolCalls;
      // Example: Inspect metadata or parts for tool usage info
      console.log("Full message meta", message.metadata);

      // If toolCalls array is present:
      if (metadata?.toolCalls?.length) {
        console.log("Tools used in this message:", metadata.toolCalls);
      } else {
        console.log("No tools used in this message.");
      }

      // Alternatively inspect parts for tool usage
      message.parts.forEach((part) => {
        if (part.type.startsWith("tool-")) {
          console.log("Tool part detected:", part);
        }
      });
    },
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2">
        {messages.map((message) => (
          <div key={message.id}>
            {message.role === "user" ? "User: " : "AI: "}
            {message.parts.map((part, index) =>
              part.type === "text" ? <span key={index}>{part.text}</span> : null
            )}
          </div>
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
          <input
            className="border solid border-gray-300 rounded-md p-2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={status !== "ready"}
            placeholder="Say something..."
          />
          <button type="submit" disabled={status !== "ready"}>
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
