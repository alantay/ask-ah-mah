import {
  addInventoryItem,
  getInventory,
  removeInventoryItem,
} from "@/lib/inventory/Inventory";
import { unauthorized } from "@/lib/http";
import { getSessionUserId } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const userId = await getSessionUserId(req);

    if (!userId) return unauthorized();

    const inventory = await getInventory(userId);
    return NextResponse.json(inventory, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Failed to fetch inventory", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId(req);
    if (!userId) return unauthorized();

    const { items } = await req.json();

    await addInventoryItem(items, userId);
    return NextResponse.json({ success: true, message: "Inventory updated" });
  } catch (error) {
    console.error("Failed to update inventory", error);
    return NextResponse.json(
      { error: "Failed to update inventory" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getSessionUserId(req);
    if (!userId) return unauthorized();
    const { itemNames } = await req.json();
    await removeInventoryItem(itemNames, userId);
    return NextResponse.json({ success: true, message: "Inventory updated" });
  } catch (error) {
    console.error("Failed to update inventory", error);
    return NextResponse.json(
      { error: "Failed to update inventory" },
      { status: 500 }
    );
  }
}
