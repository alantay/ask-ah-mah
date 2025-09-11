import { prisma } from "@/lib/db";
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

export async function addInventoryItem(
  itemsNonNormalisedName: AddInventoryItem[],
  userId: string
) {
  const items = itemsNonNormalisedName.map((item) => ({
    ...item,
    name: item.name.charAt(0).toUpperCase() + item.name.slice(1).toLowerCase(),
  }));
  const existingItems = await prisma.inventoryItem.findMany({
    where: {
      OR: items.map(({ name, type }) => ({
        name,
        type,
        userId,
      })),
    },
  });
  const nowIso = new Date().toISOString();

  for (const item of items) {
    const existingItem = existingItems.find(
      (ei) =>
        ei.name === item.name && ei.type === item.type && ei.userId === userId
    );
    if (existingItem) {
      await prisma.inventoryItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: item?.quantity || 1,
          unit: item.unit,
          lastUpdated: nowIso,
        },
      });
    } else {
      await prisma.inventoryItem.create({
        data: {
          name: item.name,
          type: item.type,
          quantity: item?.quantity || 1,
          unit: item.unit,
          dateAdded: nowIso,
          lastUpdated: nowIso,
          userId,
        },
      });
    }
  }
}

export async function removeInventoryItem(
  itemsNonNormalisedName: string[],
  userId: string
) {
  const itemsNames = itemsNonNormalisedName.map(
    (item) => item.charAt(0).toUpperCase() + item.slice(1).toLowerCase()
  );

  await prisma.inventoryItem.deleteMany({
    where: {
      name: { in: itemsNames },
      userId,
    },
  });
}
