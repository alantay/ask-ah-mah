import { maybeAutoTitleConversation } from "@/lib/conversations";
import { unauthorized } from "@/lib/http";
import { createMessage, getMessages } from "@/lib/messages";
import { getSessionUserId } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

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

  const { conversationId, content, role } = await req.json();
  if (!conversationId || !content || !role) {
    return NextResponse.json(
      { error: "conversationId, content, and role are required" },
      { status: 400 }
    );
  }

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
