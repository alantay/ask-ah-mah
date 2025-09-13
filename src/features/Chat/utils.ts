import { THINKING_MESSAGES } from "./constants";

export const getRandomThinkingMessage = () => {
  return THINKING_MESSAGES[
    Math.floor(Math.random() * THINKING_MESSAGES.length)
  ];
};
