import {
  getOrCreateEmptyConversation,
  listConversations,
} from "@/lib/conversations";
import { unauthorized } from "@/lib/http";
import { getSessionUserId } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const userId = await getSessionUserId(req);
  if (!userId) return unauthorized();

  const conversations = await listConversations(userId);
  return NextResponse.json({ conversations }); // flat array, ordered by updatedAt desc
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId(req);
  if (!userId) return unauthorized();
  const conversation = await getOrCreateEmptyConversation(userId);
  return NextResponse.json({ conversation });
}
