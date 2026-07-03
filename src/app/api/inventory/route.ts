import {
  addInventoryItem,
  getInventory,
  removeInventoryItem,
} from "@/lib/inventory/Inventory";
import { withAuth } from "@/lib/withAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAuth(async (_req, { userId }) => {
  try {
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
});

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
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
});

export const DELETE = withAuth(async (req: NextRequest, { userId }) => {
  try {
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
});
