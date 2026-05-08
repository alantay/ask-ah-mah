import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { guestId } = await req.json();
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !guestId || guestId === session.user.id) {
      return NextResponse.json({ success: false, message: "Invalid session or guestId" });
    }

    const userId = session.user.id;

    // Migrate all data
    await prisma.$transaction([
      prisma.inventoryItem.updateMany({
        where: { userId: guestId },
        data: { userId },
      }),
      prisma.conversation.updateMany({
        where: { userId: guestId },
        data: { userId },
      }),
      prisma.message.updateMany({
        where: { userId: guestId },
        data: { userId },
      }),
      prisma.recipe.updateMany({
        where: { userId: guestId },
        data: { userId },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json({ success: false, error: "Migration failed" }, { status: 500 });
  }
}
