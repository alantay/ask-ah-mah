import { getMessages, messageParts } from "@/lib/messages";
import { UIMessage, validateUIMessages } from "ai";

const CONTEXT_WINDOW = 15;

export async function loadConversationContext(
  conversationId: string,
  incoming: UIMessage[],
  userId: string
) {
  const previousMessages = await getMessages(conversationId, userId);

  const uiMessages = previousMessages.slice(-CONTEXT_WINDOW).map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    parts: messageParts(msg.content, msg.photo),
  }));

  const incomingIds = new Set(incoming.map((message) => message.id));
  const merged: UIMessage[] = [
    ...uiMessages.filter((message) => !incomingIds.has(message.id)),
    ...incoming,
  ].slice(-CONTEXT_WINDOW);
  const visibleIds = new Set(merged.map((message) => message.id));
  if (previousMessages.some((message) => message.photo && !visibleIds.has(message.id))) {
    merged.unshift({
      id: "photo-context-notice",
      role: "system",
      parts: [{ type: "text", text: "Earlier photo attachments are outside this context window. They remain saved in chat history, but you cannot inspect them now. If the user asks about an unavailable photo, ask them to attach it again; do not guess from prior descriptions." }],
    });
  }
  return validateUIMessages({ messages: merged });
}
