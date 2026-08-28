import { canonicalKey } from "@/lib/ingredients";
import { prisma } from "@/lib/db";
import { DEFAULT_INVENTORY } from "./defaults";
import { AddInventoryItem } from "./schemas";

export async function getInventory(userId: string) {
  const inventoryItems = await prisma.inventoryItem.findMany({
    where: { userId },
  });
  return {
    kitchenwareInventory: inventoryItems.filter(
      (item) => item.type === "kitchenware"
    ),
    ingredientInventory: inventoryItems.filter(
      (item) => item.type === "ingredient"
    ),
  };
}

function normalizeName(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

export async function addInventoryItem(
  itemsNonNormalisedName: AddInventoryItem[],
  userId: string
) {
  const items = itemsNonNormalisedName.map((item) => ({
    ...item,
    name: normalizeName(item.name),
  }));
  const nowIso = new Date().toISOString();

  for (const item of items) {
    const key = canonicalKey(item.name);

    await prisma.inventoryItem.upsert({
      where: {
        userId_canonicalKey_type: { userId, canonicalKey: key, type: item.type },
      },
      update: {
        // `name` is deliberately absent: the row that is already there keeps
        // its display name (ADR-0029). "Shallots" arriving against a stored
        // "Shallot" refreshes the rest and leaves the name alone.
        canonicalKey: key,
        quantity: item.quantity ?? null,
        unit: item.unit ?? null,
        category: item.category ?? null,
        lastUpdated: nowIso,
      },
      create: {
        name: item.name,
        canonicalKey: key,
        type: item.type,
        quantity: item.quantity ?? null,
        unit: item.unit ?? null,
        category: item.category ?? null,
        dateAdded: nowIso,
        lastUpdated: nowIso,
        userId,
      },
    });
  }
}

export async function seedDefaultInventory(userId: string) {
  const count = await prisma.inventoryItem.count({ where: { userId } });
  if (count > 0) return;
  await addInventoryItem(DEFAULT_INVENTORY, userId);
}

export async function removeInventoryItem(
  itemsNonNormalisedName: string[],
  userId: string
) {
  const keys = itemsNonNormalisedName.map(normalizeName).map(canonicalKey);

  await prisma.inventoryItem.deleteMany({
    where: { userId, canonicalKey: { in: keys } },
  });
}
