import { tokenize } from "./tokenize";

const isSubsetOf = (a: Set<string>, b: Set<string>): boolean =>
  [...a].every((token) => b.has(token));

/**
 * Does the pantry cover this recipe ingredient?
 *
 * Looser than `canonicalKey` equality on purpose: a pantry holding a generic
 * ("oil") covers a specific the recipe asks for ("olive oil"). Two rules, both
 * required — either alone lets a real bug through (#491):
 *
 *   - **Head nouns must agree.** The last content token is what the thing IS,
 *     so "rice noodles" does not match a pantry holding only "rice".
 *   - **One token set must contain the other.** "dark soy sauce" and "fish
 *     sauce" share a head noun, but "fish" appears in neither direction, so
 *     they do not match.
 *
 * Known limitation: "spring onion" vs. a pantry "Onion" is structurally
 * identical to "olive oil" vs. "oil" — generic subset, matching head — but
 * wants the opposite answer. No token-shape rule separates them.
 */
export function ingredientMatches(
  ingredientName: string,
  inventoryNames: string[],
): boolean {
  const ingredient = tokenize(ingredientName);
  if (ingredient.length === 0) return false;

  const ingredientSet = new Set(ingredient);
  const ingredientHead = ingredient[ingredient.length - 1];

  return inventoryNames.some((name) => {
    const inventory = tokenize(name);
    if (inventory.length === 0) return false;
    if (inventory[inventory.length - 1] !== ingredientHead) return false;

    const inventorySet = new Set(inventory);
    return (
      isSubsetOf(ingredientSet, inventorySet) ||
      isSubsetOf(inventorySet, ingredientSet)
    );
  });
}
