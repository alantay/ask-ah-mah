import {
  archiveConversation,
  renameConversation,
} from "@/lib/conversations";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { title, archived } = await req.json();

  if (typeof title === "string") {
    const conversation = await renameConversation(id, title);
    return NextResponse.json({ conversation });
  }

  if (archived === true) {
    const conversation = await archiveConversation(id);
    return NextResponse.json({ conversation });
  }

  return NextResponse.json(
    { error: "title or archived is required" },
    { status: 400 }
  );
}
