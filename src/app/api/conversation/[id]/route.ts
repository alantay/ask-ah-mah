import {
  autoTitleIfNull,
  deleteConversation,
  renameConversation,
} from "@/lib/conversations";
import { unauthorized } from "@/lib/http";
import { getSessionUserId } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId(req);
  if (!userId) return unauthorized();

  const { id } = await params;
  const { title, autoTitle } = await req.json();

  if (typeof title === "string") {
    try {
      if (autoTitle) {
        const conversation = await autoTitleIfNull(id, title, userId);
        if (!conversation) {
          return new NextResponse(null, { status: 204 });
        }
        return NextResponse.json({ conversation });
      }
      const conversation = await renameConversation(id, title, userId);
      return NextResponse.json({ conversation });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Conversation not found"
      ) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }
      throw error;
    }
  }

  return NextResponse.json(
    { error: "title is required" },
    { status: 400 }
  );
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId(req);
  if (!userId) return unauthorized();

  const { id } = await params;

  try {
    await deleteConversation(id, userId);
    return new Response(null, { status: 204 });
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
