import {
  getOrCreateEmptyConversation,
  listConversations,
} from "@/lib/conversations";
import { withAuth } from "@/lib/withAuth";
import { NextResponse } from "next/server";

export const GET = withAuth(async (_req, { userId }) => {
  const conversations = await listConversations(userId);
  return NextResponse.json({ conversations }); // flat array, ordered by updatedAt desc
});

export const POST = withAuth(async (_req, { userId }) => {
  const conversation = await getOrCreateEmptyConversation(userId);
  return NextResponse.json({ conversation });
});
