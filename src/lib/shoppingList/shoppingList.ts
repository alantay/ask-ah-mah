import { prisma } from "@/lib/db";
import { canonicalShoppingKey } from "./canonicalKey";
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
