// Categories whose quality does not vary meaningfully at the shop —
// no picking tip worth showing. Mirrors the taxonomy in CONTEXT.md.
const NON_PICKABLE: ReadonlySet<string> = new Set([
  "carbs",
  "condiments",
  "spice",
]);

/** True when an item is fresh enough that "how to pick it" is useful. */
export function isPickableCategory(category?: string | null): boolean {
  const normalized = category?.trim().toLowerCase();
  if (!normalized) return true; // unknown → let the model decide
  return !NON_PICKABLE.has(normalized);
}
