import { InventoryItem } from '@/lib/inventory/schemas';

export function computePantry(
  keyIngredients: string[],
  inventoryItems: InventoryItem[],
): { have: number; total: number; missing: string[] } {
  const names = inventoryItems.map((i) => i.name.trim().toLowerCase());
  const have = keyIngredients.filter((k) =>
    names.some(
      (n) =>
        n.includes(k.toLowerCase()) || k.toLowerCase().includes(n),
    ),
  ).length;
  const missing = keyIngredients.filter(
    (k) =>
      !names.some(
        (n) =>
          n.includes(k.toLowerCase()) || k.toLowerCase().includes(n),
      ),
  );
  return { have, total: keyIngredients.length, missing };
}
