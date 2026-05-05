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
    await prisma.inventoryItem.upsert({
      where: {
        userId_name_type: { userId, name: item.name, type: item.type },
      },
      update: {
        quantity: item.quantity ?? null,
        unit: item.unit ?? null,
        shelfLife: item.shelfLife,
        lastUpdated: nowIso,
      },
      create: {
        name: item.name,
        type: item.type,
        quantity: item.quantity ?? null,
        unit: item.unit ?? null,
        shelfLife: item.shelfLife,
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
  const itemsNames = itemsNonNormalisedName.map(normalizeName);

  await prisma.inventoryItem.deleteMany({
    where: {
      name: { in: itemsNames },
      userId,
    },
  });
}
