/**
 * Ingredient matching moved to `@/lib/ingredients` (ADR-0029), where it shares
 * one tokenizer with pantry identity and the Shopping List. This file stays as
 * the import path its three call sites already use.
 */
export { ingredientMatches } from "@/lib/ingredients";
