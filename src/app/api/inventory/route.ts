import {
  addInventoryItem,
  getInventory,
  removeInventoryItem,
} from "@/lib/inventory/Inventory";
import {
  AddInventoryItemSchemaObj,
  RemoveInventoryItemSchemaObj,
} from "@/lib/inventory/schemas";
import { withAuth } from "@/lib/withAuth";
import { NextRequest, NextResponse } from "next/server";

async function readJson(req: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    return (await req.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

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
    const payload = await readJson(req);
    if (!payload) return badRequest("Invalid inventory payload");

    // `userId` in the body (if any) is ignored — z.object strips unknown keys.
    const parsed = AddInventoryItemSchemaObj.safeParse(payload);
    if (!parsed.success) return badRequest("Invalid inventory payload");

    await addInventoryItem(parsed.data.items, userId);
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
    const payload = await readJson(req);
    if (!payload) return badRequest("Invalid inventory payload");

    const parsed = RemoveInventoryItemSchemaObj.safeParse(payload);
    if (!parsed.success) return badRequest("Invalid inventory payload");

    await removeInventoryItem(parsed.data.itemNames, userId);
    return NextResponse.json({ success: true, message: "Inventory updated" });
  } catch (error) {
    console.error("Failed to update inventory", error);
    return NextResponse.json(
      { error: "Failed to update inventory" },
      { status: 500 }
    );
  }
});
