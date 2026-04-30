import type { AddInventoryItem } from "./schemas";

export const DEFAULT_INVENTORY: AddInventoryItem[] = [
  { name: "Salt", type: "ingredient", shelfLife: "long" },
  { name: "Cooking oil", type: "ingredient", shelfLife: "long" },
  { name: "Soy sauce", type: "ingredient", shelfLife: "long" },
  { name: "Wok", type: "kitchenware", shelfLife: "long" },
  { name: "Pot", type: "kitchenware", shelfLife: "long" },
  { name: "Chef's knife", type: "kitchenware", shelfLife: "long" },
];
