import { canonicalTipKey } from "@/lib/marketTips/canonicalKey";

// Prep/quality adjectives that describe how an ingredient is cut or sold, not
// what it is. Dropped before keying so "fresh chopped coriander" === "coriander".
// Mirrors the recipe matcher's stopwords (src/lib/recipes/matchIngredient.ts).
const PREP_WORDS: ReadonlySet<string> = new Set([
  "fresh", "ground", "chopped", "minced", "sliced", "diced",
  "whole", "thin", "thinly", "raw", "cooked", "dried",
  "powder", "extract", "pure", "fine", "coarse",
  "large", "small", "medium", "ripe",
  "of", "the", "and", "a", "to",
]);

// Measurement units that may lead a recipe ingredient string. Dropped alongside
// the numbers they qualify so "3 cloves garlic" === "garlic".
const UNITS: ReadonlySet<string> = new Set([
  "g", "kg", "oz", "lb",
  "ml", "l", "cup", "cups", "tbsp", "tsp",
  "piece", "pieces", "clove", "cloves",
  "bottle", "bottles", "can", "cans", "pack", "packs",
  "bunch", "bunches", "pinch", "dash", "slice", "slices",
]);

const NUMBER = /^\d+([./]\d+)?$/;

/** Naive English singularization with guards against false plurals. */
function singularize(token: string): string {
  if (token.length <= 3) return token;
  if (/(ss|us|is)$/.test(token)) return token; // hummus, watercress, basis
  if (token.endsWith("ies")) return token.slice(0, -3) + "y"; // berries → berry
  if (/(ches|shes|ses|xes|zes|oes)$/.test(token)) return token.slice(0, -2); // tomatoes → tomato
  if (token.endsWith("s")) return token.slice(0, -1); // apples → apple
  return token;
}

/**
 * Canonical identity for a Shopping List row. Strips quantities, units, and
 * prep adjectives, then singularizes the remaining words, so a recipe's
 * "2 apples, sliced" and a typed-in "apple" collapse to the same row.
 *
 * Falls back to the lightly-cleaned name when nothing but prep words remain,
 * so an input like "Fresh" still yields a stable, non-empty key.
 */
export function canonicalShoppingKey(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9/\s]/g, " ");

  const content = cleaned
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .filter((t) => !NUMBER.test(t) && !UNITS.has(t) && !PREP_WORDS.has(t))
    .map(singularize);

  if (content.length === 0) return canonicalTipKey(raw);
  return canonicalTipKey(content.join(" "));
}
