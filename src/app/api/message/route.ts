import { maybeAutoTitleConversation } from "@/lib/conversations";
import { createMessage, getMessages } from "@/lib/messages";
import { withAuth } from "@/lib/withAuth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const PostSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1),
  role: z.enum(["user", "assistant"]),
});

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const conversationId = req.nextUrl.searchParams.get("conversationId");
  if (!conversationId) {
    return NextResponse.json(
      { error: "conversationId is required" },
      { status: 400 }
    );
  }
  const messages = await getMessages(conversationId, userId);
  return NextResponse.json(messages);
});

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = PostSchema.safeParse(rawBody);
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
});
