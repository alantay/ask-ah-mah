import { getMessages } from "@/lib/messages";
import { UIMessage, validateUIMessages } from "ai";

const CONTEXT_WINDOW = 15;

export async function loadConversationContext(
  conversationId: string,
  incoming: UIMessage[]
) {
  const previousMessages = await getMessages(conversationId);

  const uiMessages = previousMessages.slice(-CONTEXT_WINDOW).map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    parts: [{ type: "text" as const, text: msg.content }],
  }));

  return validateUIMessages({
    messages: [...uiMessages.slice(0, -1), ...incoming],
  });
}
