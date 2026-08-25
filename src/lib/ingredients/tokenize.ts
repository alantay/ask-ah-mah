/**
 * Prep words: how an ingredient was cut, sold or picked. Identity survives, so
 * these are stripped — "fresh chopped coriander" === "coriander".
 */
export const PREP: ReadonlySet<string> = new Set([
  "fresh", "chopped", "minced", "sliced", "diced",
  "whole", "thin", "thinly", "fine", "coarse",
  "large", "small", "medium", "ripe", "cooking",
  "of", "the", "and", "a", "to",
]);

/**
 * Form words: what an ingredient IS. Dried chilli, garlic powder and vanilla
 * extract are separate pantry items from chilli, garlic and vanilla, so these
 * are deliberately NOT stripped (ADR-0029). Exported so the tokenizer's
 * contract is testable rather than merely commented.
 */
export const FORM: ReadonlySet<string> = new Set([
  "dried", "ground", "powder", "extract", "cooked", "raw", "pure",
]);

/** Measurement units that may lead an ingredient string. */
export const UNITS: ReadonlySet<string> = new Set([
  "g", "kg", "oz", "lb",
  "ml", "l", "cup", "cups", "tbsp", "tsp",
  "piece", "pieces", "clove", "cloves",
  "bottle", "bottles", "can", "cans", "pack", "packs",
  "bunch", "bunches", "pinch", "dash", "slice", "slices",
]);

/**
 * A token that leads with a digit is a quantity, never an ingredient: "3",
 * "1/2", "200g", "2tbsp". Broader than the Shopping List's old number regex,
 * which let "200g" through as a content word.
 */
const QUANTITY = /^\d/;

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
 * The content words of an ingredient name: lowercased, stripped of
 * parentheticals, punctuation, quantities, units and prep words, then
 * singularized. Form words survive.
 */
export function tokenize(raw: string): string[] {
  return raw
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9/\s]/g, " ") // "/" survives so "1/2" stays one token
    .split(/\s+/)
    .filter(
      (t) =>
        t.length > 1 && !QUANTITY.test(t) && !UNITS.has(t) && !PREP.has(t),
    )
    .map(singularize);
}
