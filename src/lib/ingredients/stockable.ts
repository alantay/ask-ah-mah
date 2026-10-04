import { tokenize } from "./tokenize";

/**
 * Water, in the forms a recipe writes it. A closed vocabulary on purpose:
 * anything qualified by a word not in this list is a different ingredient
 * ("coconut water", "rose water", "tamarind water"), so it stays stockable.
 */
const WATER_WORDS: ReadonlySet<string> = new Set([
  "water",
  "cold", "hot", "warm", "boiling", "lukewarm",
  "ice", "iced", "room", "temperature",
  "tap", "filtered", "plain",
]);

/**
 * Can the user own this? Everything can, except water: it comes out of a tap,
 * so it never sits in the pantry, never earns a Shopping List row, and is
 * never an Addition (CONTEXT.md — Addition).
 *
 * The other assumed staples — salt, pepper, cooking oil — are stockable and
 * live in `DEFAULT_INVENTORY` instead. They need no rule here.
 */
export function isStockable(name: string): boolean {
  const tokens = tokenize(name);
  if (tokens.length === 0) return true;
  return !(tokens.includes("water") && tokens.every((t) => WATER_WORDS.has(t)));
}
