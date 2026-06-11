import { captureMentionedInventory } from "@/lib/chat/captureInventory";
import { loadConversationContext } from "@/lib/chat/context";
import { chatErrorResponse } from "@/lib/chat/errors";
import { latestUserText } from "@/lib/chat/messageText";
import { buildChatTools } from "@/lib/chat/tools";
import { missingUserId } from "@/lib/http";
import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, stepCountIs, streamText, UIMessage } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { CHAT_SYSTEM_PROMPT } from "./constants";

export async function POST(req: NextRequest) {
  try {
    const { messages, userId, conversationId }: {
      messages: UIMessage[];
      userId: string;
      conversationId: string;
    } = await req.json();

    if (!userId) return missingUserId();
    if (!conversationId) return NextResponse.json({ error: "conversationId is required" }, { status: 400 });

    // Deterministically capture any pantry items the user mentions BEFORE the
    // chat model runs, so a subsequent getInventory call reflects them. Gated
    // by a keyword heuristic; the model's addInventoryItem tool is the fallback
    // for phrasings the gate misses. Failures here are swallowed (non-fatal).
    await captureMentionedInventory(latestUserText(messages), userId);

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
