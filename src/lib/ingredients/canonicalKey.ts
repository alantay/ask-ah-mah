import { tokenize } from "./tokenize";

/**
 * Canonical identity for an ingredient or pantry item. Two names sharing a key
 * are the same thing and must not occupy two pantry rows.
 *
 * Stricter than `ingredientMatches`: this is equality, not coverage. A pantry
 * holding "oil" covers a recipe's "olive oil" (they match) but they are still
 * two different things to stock (they do not share a key).
 *
 * Falls back to the lightly-cleaned name when tokenizing leaves nothing, so an
 * input like "Fresh" still yields a stable, non-empty key.
 */
export function canonicalKey(raw: string): string {
  const tokens = tokenize(raw);
  if (tokens.length === 0) return raw.trim().toLowerCase().replace(/\s+/g, " ");
  return tokens.join(" ");
}
