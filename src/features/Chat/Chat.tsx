"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";

const Chat = () => {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
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
