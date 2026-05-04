import { autoTitleConversation } from "@/lib/conversations";
import { createMessage, getMessages } from "@/lib/messages";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const conversationId = req.nextUrl.searchParams.get("conversationId");
  if (!conversationId) {
    return NextResponse.json(
      { error: "conversationId is required" },
      { status: 400 }
    );
  }
  const messages = await getMessages(conversationId);
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const { conversationId, userId, content, role } = await req.json();
  if (!conversationId || !userId || !content || !role) {
    return NextResponse.json(
      { error: "conversationId, userId, content, and role are required" },
      { status: 400 }
    );
  }
  const message = await createMessage(conversationId, userId, content, role);

  // After saving: fire auto-title on the first assistant message in the conversation
  if (role === "assistant") {
    const count = await prisma.message.count({ where: { conversationId } });
    if (count === 2) {
      autoTitleConversation(conversationId).catch(() => {});
    }
  }

  return NextResponse.json({ message });
}
