import type { AddInventoryItem } from "./schemas";

export const DEFAULT_INVENTORY: AddInventoryItem[] = [
  { name: "Salt", type: "ingredient" },
  { name: "Cooking oil", type: "ingredient" },
  { name: "Soy sauce", type: "ingredient" },
  { name: "Wok", type: "kitchenware" },
  { name: "Pot", type: "kitchenware" },
  { name: "Chef's knife", type: "kitchenware" },
];
