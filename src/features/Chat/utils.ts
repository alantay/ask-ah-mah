import { SavedMessage } from "@/lib/messages/schemas";
import { UIMessage } from "ai";
import { THINKING_MESSAGES } from "./constants";

export const getRandomThinkingMessage = () => {
  return THINKING_MESSAGES[
    Math.floor(Math.random() * THINKING_MESSAGES.length)
  ];
};

export const convertToUIMessage = (dbMessage: SavedMessage): UIMessage => {
  return {
    id: dbMessage.id,
    role: dbMessage.role as "user" | "assistant",
    parts: [
      {
        type: "text",
        text: dbMessage.content,
      },
    ],
  };
};
