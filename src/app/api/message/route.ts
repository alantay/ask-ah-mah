import { createMessage, getMessages } from "@/lib/messages";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  const messages = await getMessages(userId);
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const { userId, content, role } = await req.json();
  if (!userId || !content || !role) {
    return NextResponse.json(
      { error: "userId, content, and role are required" },
      { status: 400 }
    );
  }
  const message = await createMessage(userId, content, role);
  return NextResponse.json({ message });
}
