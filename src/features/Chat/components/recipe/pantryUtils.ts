import { InventoryItem } from '@/lib/inventory/schemas';
import { ingredientMatches } from '@/lib/recipes/matchIngredient';

export function computePantry(
  keyIngredients: string[],
  inventoryItems: InventoryItem[],
): { have: number; total: number; missing: string[] } {
  const names = inventoryItems.map((i) => i.name);
  const have = keyIngredients.filter((k) => ingredientMatches(k, names)).length;
  const missing = keyIngredients.filter((k) => !ingredientMatches(k, names));
  return { have, total: keyIngredients.length, missing };
}
