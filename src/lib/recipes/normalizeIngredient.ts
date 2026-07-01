import type { RecipeIngredientModel } from "./schemas";

export function normalizeIngredient(ing: RecipeIngredientModel) {
  const amount =
    ing.amount !== undefined && !Number.isNaN(parseFloat(ing.amount))
      ? parseFloat(ing.amount)
      : undefined;
  return { name: ing.name, category: ing.category ?? "Misc", amount, unit: ing.unit, note: ing.note };
}
