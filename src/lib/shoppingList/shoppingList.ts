import { prisma } from "@/lib/db";
import { type Aisle } from "./aisle";
import { canonicalShoppingKey } from "./canonicalKey";
import { classifyAisles } from "./classify";
import { AddShoppingListItem } from "./schemas";

/** Rows for a user's Shopping List, oldest-first (build order). */
export async function getShoppingList(userId: string) {
  return prisma.shoppingListItem.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Add items to a user's Shopping List. Each item collapses to its canonical
 * shopping key, so plurals and recipe strings merge onto one row. Re-adding an
 * existing item is a no-op — the update is empty, preserving the display name
 * and bought state of the row already there.
 */
export async function addShoppingListItems(
  items: AddShoppingListItem[],
  userId: string,
) {
  for (const item of items) {
    const key = canonicalShoppingKey(item.name);
    await prisma.shoppingListItem.upsert({
      where: { userId_key: { userId, key } },
      update: {},
      create: {
        userId,
        key,
        name: item.name.trim().replace(/\s+/g, " "),
        category: item.category ?? null,
      },
    });
  }
}

/**
 * Mark a row bought (✓ strike-through) or unbought. Scoped by `userId` via
 * `updateMany` so a row can only be toggled by its owner.
 */
export async function setBought(userId: string, id: string, bought: boolean) {
  await prisma.shoppingListItem.updateMany({
    where: { id, userId },
    data: { bought },
  });
}

/** Hard-delete a single row (✕ changed mind). Scoped by `userId`. */
export async function removeShoppingListItem(userId: string, id: string) {
  await prisma.shoppingListItem.deleteMany({ where: { id, userId } });
}

/** Bulk "clear bought" — remove only the user's bought rows, keep the rest. */
export async function clearBoughtItems(userId: string) {
  await prisma.shoppingListItem.deleteMany({ where: { userId, bought: true } });
}

/**
 * Assign a shopping [Aisle](CONTEXT.md#aisle) to the user's not-yet-categorised
 * rows. Typed-in items arrive with `category: null` (the add path never blocks
 * on the model); this fills them in via {@link classifyAisles} and persists the
 * aisle onto the existing `category` column, scoped by `userId`. Recipe items —
 * which already carry a Pantry-enum category — are left untouched. A no-op when
 * nothing is pending, so the client can call it freely after every load.
 */
export async function classifyPendingAisles(userId: string) {
  const pending = await prisma.shoppingListItem.findMany({
    where: { userId, category: null },
  });
  if (pending.length === 0) return;

  const aisles = await classifyAisles(pending.map((row) => row.name));

  for (const row of pending) {
    const aisle: Aisle = aisles[canonicalShoppingKey(row.name)] ?? "Other";
    await prisma.shoppingListItem.updateMany({
      where: { id: row.id, userId },
      data: { category: aisle },
    });
  }
}
