import { seedDefaultInventory } from "@/lib/inventory/Inventory";
import { missingUserId } from "@/lib/http";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) return missingUserId();

    await seedDefaultInventory(userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to seed inventory", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
