import { captureMentionedInventory } from "@/lib/chat/captureInventory";
import { loadConversationContext } from "@/lib/chat/context";
import { chatErrorResponse } from "@/lib/chat/errors";
import { latestUserText } from "@/lib/chat/messageText";
import { buildChatTools } from "@/lib/chat/tools";
import { missingUserId } from "@/lib/http";
import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  UIMessage,
} from "ai";
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
    const captured = await captureMentionedInventory(latestUserText(messages), userId);

    const validatedMessages = await loadConversationContext(conversationId, messages);

    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        // Tell the client what we captured server-side so it can toast and
        // refresh the pantry — the model never fired a tool for these, so the
        // client's tool-call handler would otherwise miss them.
        if (captured.length > 0) {
          writer.write({
            type: "data-capturedInventory",
            data: { items: captured.map((item) => item.name) },
          });
        }

        const result = streamText({
          model: openai("gpt-4.1-mini"),
          messages: convertToModelMessages(validatedMessages),
          system: CHAT_SYSTEM_PROMPT,
          stopWhen: [stepCountIs(5)],
          tools: buildChatTools(userId),
        });

        writer.merge(result.toUIMessageStream());
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    return chatErrorResponse(error);
  }
}
