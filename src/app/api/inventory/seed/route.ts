import { seedDefaultInventory } from "@/lib/inventory/Inventory";
import { withAuth } from "@/lib/withAuth";
import { NextResponse } from "next/server";

export const POST = withAuth(async (_req, { userId }) => {
  try {
    await seedDefaultInventory(userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to seed inventory", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
});
