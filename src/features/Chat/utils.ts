import { SavedMessage } from "@/lib/messages/schemas";
import { UIMessage } from "ai";
import { NORMALISED_THINKING_MESSAGES } from "./constants";
import { photoPart } from "@/lib/messages/photo";

export const getRandomNormalisedPhrase = () => {
  return NORMALISED_THINKING_MESSAGES[
    Math.floor(Math.random() * NORMALISED_THINKING_MESSAGES.length)
  ];
};

export const convertToUIMessage = (dbMessage: SavedMessage): UIMessage => {
  return {
    id: dbMessage.id,
    role: dbMessage.role as "user" | "assistant",
    parts: [
      ...(dbMessage.photo ? [photoPart(dbMessage.photo)] : []),
      {
        type: "text",
        text: dbMessage.content,
      },
    ],
  };
};
