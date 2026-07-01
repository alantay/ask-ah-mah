import { maybeAutoTitleConversation } from "@/lib/conversations";
import { unauthorized } from "@/lib/http";
import { createMessage, getMessages } from "@/lib/messages";
import { getSessionUserId } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const PostSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1),
  role: z.enum(["user", "assistant"]),
});

export async function GET(req: NextRequest) {
  const userId = await getSessionUserId(req);
  if (!userId) return unauthorized();

  const conversationId = req.nextUrl.searchParams.get("conversationId");
  if (!conversationId) {
    return NextResponse.json(
      { error: "conversationId is required" },
      { status: 400 }
    );
  }
  // getMessages is owner-scoped: a foreign conversationId returns no messages.
  const messages = await getMessages(conversationId, userId);
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId(req);
  if (!userId) return unauthorized();

  const parsed = PostSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { conversationId, content, role } = parsed.data;

  try {
    const message = await createMessage(conversationId, userId, content, role);

    if (role === "assistant") {
      void maybeAutoTitleConversation(conversationId);
    }

    return NextResponse.json({ message });
  } catch (error) {
    if (error instanceof Error && error.message === "Conversation not found") {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }
    throw error;
  }
}
