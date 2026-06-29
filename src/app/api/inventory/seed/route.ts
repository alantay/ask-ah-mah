import { seedDefaultInventory } from "@/lib/inventory/Inventory";
import { unauthorized } from "@/lib/http";
import { getSessionUserId } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId(request);
    if (!userId) return unauthorized();

    await seedDefaultInventory(userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to seed inventory", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
