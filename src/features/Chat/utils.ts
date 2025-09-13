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

// parts: [
//   {
//     type: "text" as const,
//     text: `**Hello dear!** I'm Ah Mah, your cooking assistant. I'd love to help you discover delicious recipes!

// - **Tell me what ingredients you have:** "I have chicken and rice"
// - **Add items to your kitchenware:** "I have a wok"
// - **Ask for recipe suggestions:** "What can I cook for dinner?"

// ---

// **What would you like to cook today?** 🍳`,
//   },
// ],
