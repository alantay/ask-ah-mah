import { addInventoryItem, getInventory } from "@/lib/inventory/Inventory";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const inventory = getInventory();
    return NextResponse.json(inventory);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  addInventoryItem(data);

  return NextResponse.json({ success: true, message: "Inventory updated" });
}
