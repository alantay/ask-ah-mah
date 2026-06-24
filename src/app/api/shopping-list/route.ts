import {
  addShoppingListItems,
  clearBoughtItems,
  getShoppingList,
  removeShoppingListItem,
  setBought,
} from "@/lib/shoppingList";
import { AddShoppingListItemsSchema } from "@/lib/shoppingList/schemas";
import { missingUserId } from "@/lib/http";
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

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return missingUserId();

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
}

export async function POST(req: NextRequest) {
  try {
    const payload = await readJson(req);
    if (!payload) return badRequest("Invalid shopping list payload");

    const { userId, ...rest } = payload;
    if (!userId || typeof userId !== "string") return missingUserId();

    const parsed = AddShoppingListItemsSchema.safeParse(rest);
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
}

export async function PATCH(req: NextRequest) {
  try {
    const payload = await readJson(req);
    if (!payload) return badRequest("Invalid shopping list payload");

    const { userId, id, bought } = payload;
    if (!userId || typeof userId !== "string") return missingUserId();
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
}

export async function DELETE(req: NextRequest) {
  try {
    const payload = await readJson(req);
    if (!payload) return badRequest("Invalid shopping list payload");

    const { userId, id, clearBought } = payload;
    if (!userId || typeof userId !== "string") return missingUserId();

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
}
