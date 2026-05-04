import {
  createConversation,
  listConversations,
} from "@/lib/conversations";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  const conversations = await listConversations(userId);
  return NextResponse.json({ conversations });
}

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  const conversation = await createConversation(userId);
  return NextResponse.json({ conversation });
}
