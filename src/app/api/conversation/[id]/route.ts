import {
  autoTitleIfNull,
  deleteConversation,
  renameConversation,
} from "@/lib/conversations";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { title, autoTitle } = await req.json();

  if (typeof title === "string") {
    if (autoTitle) {
      const conversation = await autoTitleIfNull(id, title);
      if (!conversation) {
        return new NextResponse(null, { status: 204 });
      }
      return NextResponse.json({ conversation });
    }
    const conversation = await renameConversation(id, title);
    return NextResponse.json({ conversation });
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
  const { id } = await params;
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

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
