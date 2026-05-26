import { loadConversationContext } from "@/lib/chat/context";
import { chatErrorResponse } from "@/lib/chat/errors";
import { buildChatTools } from "@/lib/chat/tools";
import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, stepCountIs, streamText, UIMessage } from "ai";
import { NextRequest } from "next/server";
import { CHAT_SYSTEM_PROMPT } from "./constants";

export async function POST(req: NextRequest) {
  try {
    const { messages, userId, conversationId }: {
      messages: UIMessage[];
      userId: string;
      conversationId: string;
    } = await req.json();

    const validatedMessages = await loadConversationContext(conversationId, messages);

    const result = streamText({
      model: openai("gpt-4.1-mini"),
      messages: convertToModelMessages(validatedMessages),
      system: CHAT_SYSTEM_PROMPT,
      stopWhen: [stepCountIs(5)],
      tools: buildChatTools(userId),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    return chatErrorResponse(error);
  }
}
