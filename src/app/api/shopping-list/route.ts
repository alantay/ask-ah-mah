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

    // `userId` in the body (if any) is ignored — z.object strips unknown keys.
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

/**
 * Toggle a Need-tab row's bought flag.
 *
 * Caller is taken from the session. Body: `{ id: string, bought: boolean }`.
 * Returns `{ success: true, message }` on success. 401s when unauthenticated;
 * 400s on malformed JSON, a non-string `id`, or a non-boolean `bought`; 500s if
 * the service throws. Flips the flag only — never adds the item to the pantry.
 */
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

/**
 * Remove from the Need tab — one row, or all bought rows.
 *
 * Caller is taken from the session. Body: `{ id: string }` deletes a single
 * row; `{ clearBought: true }` bulk-deletes the user's bought rows. Returns
 * `{ success: true, message }` on success. 401s when unauthenticated; 400s on
 * malformed JSON, or when neither `id` nor `clearBought: true` is given; 500s
 * if the service throws.
 */
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
