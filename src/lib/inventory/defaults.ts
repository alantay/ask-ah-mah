import type { AddInventoryItem } from "./schemas";

// The assumed staples every kitchen has (CONTEXT.md — Addition). They are
// seeded rather than special-cased in the UI, so "I deleted my salt" can mean
// what it says. Pepper is seeded as two rows, not a bare "Pepper": the matcher
// is coverage, so one generic row would also cover "bell pepper" (#490).
export const DEFAULT_INVENTORY: AddInventoryItem[] = [
  { name: "Salt", type: "ingredient" },
  { name: "Black pepper", type: "ingredient" },
  { name: "White pepper", type: "ingredient" },
  { name: "Cooking oil", type: "ingredient" },
  { name: "Soy sauce", type: "ingredient" },
  { name: "Wok", type: "kitchenware" },
  { name: "Pot", type: "kitchenware" },
  { name: "Chef's knife", type: "kitchenware" },
];
