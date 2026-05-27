import {
  getOrCreateEmptyConversation,
  listConversations,
} from "@/lib/conversations";
import { missingUserId } from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return missingUserId();

  const conversations = await listConversations(userId);
  return NextResponse.json({ conversations }); // flat array, ordered by updatedAt desc
}

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) return missingUserId();
  const conversation = await getOrCreateEmptyConversation(userId);
  return NextResponse.json({ conversation });
}
