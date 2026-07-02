import {
  addShoppingListItems,
  clearBoughtItems,
  getShoppingList,
  removeShoppingListItem,
  setBought,
} from "@/lib/shoppingList";
import { AddShoppingListItemsSchema } from "@/lib/shoppingList/schemas";
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
    const items = await getShoppingList(userId);
    return NextResponse.json(
      { items },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (error) {
    console.error("Failed to fetch shopping list", error);
    return NextResponse.json(
      { error: "Failed to fetch shopping list" },
      { status: 500 },
    );
  }
});

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const payload = await readJson(req);
    if (!payload) return badRequest("Invalid shopping list payload");

    const parsed = AddShoppingListItemsSchema.safeParse(payload);
    if (!parsed.success) return badRequest("Invalid shopping list payload");

    await addShoppingListItems(parsed.data.items, userId);
    return NextResponse.json({ success: true, message: "Shopping list updated" });
  } catch (error) {
    console.error("Failed to update shopping list", error);
    return NextResponse.json(
      { error: "Failed to update shopping list" },
      { status: 500 },
    );
  }
});

export const PATCH = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const payload = await readJson(req);
    if (!payload) return badRequest("Invalid shopping list payload");

    const { id, bought } = payload;
    if (typeof id !== "string" || typeof bought !== "boolean") {
      return badRequest("id (string) and bought (boolean) are required");
    }

    await setBought(userId, id, bought);
    return NextResponse.json({ success: true, message: "Shopping list updated" });
  } catch (error) {
    console.error("Failed to update shopping list", error);
    return NextResponse.json(
      { error: "Failed to update shopping list" },
      { status: 500 },
    );
  }
});

export const DELETE = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const payload = await readJson(req);
    if (!payload) return badRequest("Invalid shopping list payload");

    const { id, clearBought } = payload;

    if (typeof id === "string") {
      await removeShoppingListItem(userId, id);
    } else if (clearBought === true) {
      await clearBoughtItems(userId);
    } else {
      return badRequest("Provide an item id or clearBought: true");
    }

    return NextResponse.json({ success: true, message: "Shopping list updated" });
  } catch (error) {
    console.error("Failed to update shopping list", error);
    return NextResponse.json(
      { error: "Failed to update shopping list" },
      { status: 500 },
    );
  }
});
