import { maybeAutoTitleConversation } from "@/lib/conversations";
import { NotFoundError } from "@/lib/errors";
import { createMessage, getMessages, PhotoSchema } from "@/lib/messages";
import { withAuth } from "@/lib/withAuth";
import { readLimitedText } from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const PostSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1),
  role: z.enum(["user", "assistant"]),
  photo: PhotoSchema.optional(),
}).refine((message) => !message.photo || message.role === "user");

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const conversationId = req.nextUrl.searchParams.get("conversationId");
  if (!conversationId) {
    return NextResponse.json(
      { error: "conversationId is required" },
      { status: 400 }
    );
  }
  // getMessages is owner-scoped: a foreign conversationId returns no messages.
  const messages = await getMessages(conversationId, userId);
  // History queries omit photo bytes and return authenticated image URLs.
  return NextResponse.json(messages);
});

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  let rawBody: unknown;
  try {
    const text = await readLimitedText(req, 1024 * 1024);
    if (text === null) {
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    }
    rawBody = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = PostSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { conversationId, content, role, photo } = parsed.data;

  try {
    const message = await createMessage(conversationId, userId, content, role, photo);

    if (role === "assistant") {
      void maybeAutoTitleConversation(conversationId, userId);
    }

    return NextResponse.json({ message });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }
    throw error;
  }
});
