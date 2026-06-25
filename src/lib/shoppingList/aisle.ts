// The Shopping List groups by Aisle — a small, fixed *shopping* taxonomy
// ("where do I find this at the shop"), deliberately distinct from the Pantry's
// *storage* category enum. See CONTEXT.md#aisle and ADR-0016.

export const AISLE_ORDER = [
  "Produce",
  "Meat & Seafood",
  "Rice & Noodles",
  "Sauces & Seasoning",
  "Other",
] as const;

export type Aisle = (typeof AISLE_ORDER)[number];

const AISLE_SET: ReadonlySet<string> = new Set(AISLE_ORDER);

// Bridge from the Pantry's storage category enum to a shopping aisle, so a
// recipe item that already knows its category needs no model call to find its
// aisle. Keyed lowercase for case-insensitive matching.
const CATEGORY_TO_AISLE: Readonly<Record<string, Aisle>> = {
  vegetable: "Produce",
  protein: "Meat & Seafood",
  carbs: "Rice & Noodles",
  condiments: "Sauces & Seasoning",
  spice: "Sauces & Seasoning",
  misc: "Other",
};

/**
 * Resolve a stored `category` to its Aisle. Handles both vocabularies the
 * column can hold: a Pantry-enum value (from the recipe on-ramp) maps via
 * {@link CATEGORY_TO_AISLE}; an already-aisle value (from classification)
 * passes through. A null/unknown value falls to `Other` — which is also where a
 * not-yet-classified typed-in item rests until the model answers.
 */
export function toAisle(category?: string | null): Aisle {
  if (!category) return "Other";
  const trimmed = category.trim();
  if (AISLE_SET.has(trimmed)) return trimmed as Aisle;
  return CATEGORY_TO_AISLE[trimmed.toLowerCase()] ?? "Other";
}

export type AisleGroup<T> = { aisle: Aisle; items: T[] };

/**
 * Bucket Shopping List rows into ordered aisle groups for rendering: a fixed
 * market-walk order ({@link AISLE_ORDER}, `Other` last), empty aisles omitted,
 * and the incoming row order preserved within each aisle.
 */
export function groupByAisle<T extends { category?: string | null }>(
  items: T[],
): AisleGroup<T>[] {
  const buckets = new Map<Aisle, T[]>();
  for (const item of items) {
    const aisle = toAisle(item.category);
    const bucket = buckets.get(aisle);
    if (bucket) bucket.push(item);
    else buckets.set(aisle, [item]);
  }

  return AISLE_ORDER.filter((aisle) => buckets.has(aisle)).map((aisle) => ({
    aisle,
    items: buckets.get(aisle)!,
  }));
}
