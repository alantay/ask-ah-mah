import { seedDefaultInventory } from "@/lib/inventory/Inventory";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { userId } = await request.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  await seedDefaultInventory(userId);
  return NextResponse.json({ ok: true });
}
