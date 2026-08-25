import { canonicalTipKey } from "@/lib/marketTips/canonicalKey";
import { tokenize } from "@/lib/ingredients";

/**
 * Canonical identity for a Shopping List row. Strips quantities, units and prep
 * adjectives, then singularizes, so a recipe's "2 apples, sliced" and a typed-in
 * "apple" collapse to the same row.
 *
 * Shares its tokenizer with pantry identity (ADR-0029), which replaced the
 * hand-mirrored word list this file used to carry. One consequence: form words
 * now survive, so "dried chilli" and "chilli" are two rows rather than one.
 *
 * Falls back to the lightly-cleaned name when nothing but prep words remain, so
 * an input like "Fresh" still yields a stable, non-empty key.
 */
export function canonicalShoppingKey(raw: string): string {
  const tokens = tokenize(raw);
  if (tokens.length === 0) return canonicalTipKey(raw);
  return canonicalTipKey(tokens.join(" "));
}
