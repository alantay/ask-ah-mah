import { seedDefaultInventory } from "@/lib/inventory/Inventory";
import { missingUserId } from "@/lib/http";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { userId } = await request.json();
  if (!userId) return missingUserId();

  await seedDefaultInventory(userId);
  return NextResponse.json({ ok: true });
}
