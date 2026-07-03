import { captureMentionedInventory } from "@/lib/chat/captureInventory";
import { loadConversationContext } from "@/lib/chat/context";
import { chatErrorResponse } from "@/lib/chat/errors";
import { latestUserText } from "@/lib/chat/messageText";
import { buildChatTools } from "@/lib/chat/tools";
import { withAuth } from "@/lib/withAuth";
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
import { z } from "zod";
import { CHAT_SYSTEM_PROMPT } from "./constants";

const UIMessageSchema = z
  .object({ id: z.string(), role: z.string(), parts: z.array(z.unknown()) })
  .passthrough();

const PostSchema = z.object({
  conversationId: z.string().min(1).max(100),
  messages: z.array(UIMessageSchema).max(100),
});

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const body = PostSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const { conversationId, messages: rawMessages } = body.data;
    const messages = rawMessages as unknown as UIMessage[];

    // Deterministically capture any pantry items the user mentions BEFORE the
    // chat model runs, so a subsequent getInventory call reflects them. Gated
    // by a keyword heuristic; the model's addInventoryItem tool is the fallback
    // for phrasings the gate misses. Failures here are swallowed (non-fatal).
    const captured = await captureMentionedInventory(latestUserText(messages), userId);

    const validatedMessages = await loadConversationContext(
      conversationId,
      messages,
      userId
    );

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

        // Tell the model what we already captured this turn so it doesn't
        // redundantly call addInventoryItem for the same items (the client
        // also dedupes, but this avoids a wasted tool step + upsert).
        const captureNote =
          captured.length > 0
            ? `\n\n# Already added this turn\nThese items are ALREADY in the pantry (just added for you): ${captured
                .map((item) => item.name)
                .join(", ")}. Do NOT call addInventoryItem for them again — acknowledge naturally and continue.`
            : "";

        const result = streamText({
          model: openai("gpt-5-mini"),
          messages: convertToModelMessages(validatedMessages),
          system: CHAT_SYSTEM_PROMPT + captureNote,
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
});
