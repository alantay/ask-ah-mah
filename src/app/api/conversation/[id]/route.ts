import {
  autoTitleIfNull,
  deleteConversation,
  renameConversation,
} from "@/lib/conversations";
import { NotFoundError } from "@/lib/errors";
import { withAuthDynamic } from "@/lib/withAuth";
import { NextRequest, NextResponse } from "next/server";

export const PATCH = withAuthDynamic<{ id: string }>(async (req: NextRequest, { userId, params }) => {
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
      if (error instanceof NotFoundError) {
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
});

export const DELETE = withAuthDynamic<{ id: string }>(async (_req, { userId, params }) => {
  const { id } = await params;

  try {
    await deleteConversation(id, userId);
    return new Response(null, { status: 204 });
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
