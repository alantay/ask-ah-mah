import { canonicalTipKey } from "./canonicalKey";

export interface ShoppingListItem {
  name: string;
  amount?: string;
  unit?: string;
}

/**
 * Build the plain-text shopping list that gets copied to the clipboard.
 * Each line is "<amount> <unit> <name>" (parts omitted when absent), with
 * Ah Mah's picking tip appended after " — " when one exists for the item.
 */
export function formatShoppingList(
  items: ShoppingListItem[],
  tips: Record<string, string>,
): string {
  return items
    .map((item) => {
      const lead = item.amount
        ? `${item.amount}${item.unit ? ` ${item.unit}` : ""} ${item.name}`
        : item.name;
      const tip = tips[canonicalTipKey(item.name)];
      return tip ? `${lead} — ${tip}` : lead;
    })
    .join("\n");
}
