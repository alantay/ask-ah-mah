import type { AddInventoryItem, InventoryItem } from '@/lib/inventory/schemas';
import { ingredientMatches } from '@/lib/recipes/matchIngredient';
import type { RecipeIngredientModel } from '@/lib/recipes/schemas';

// Every pantry item the token matcher considers the same thing as this
// ingredient. Still plural: a pantry holding both "Soy sauce" and "Light soy
// sauce" matches "light soy sauce" twice. Rarer since #491, not impossible.
export function matchingPantryItems(
  ingredientName: string,
  inventoryItems: InventoryItem[],
): InventoryItem[] {
  return inventoryItems.filter((item) =>
    ingredientMatches(ingredientName, [item.name]),
  );
}

// Every pantry item some ticked ingredient is relying on. Computed across the
// whole recipe, because a per-ingredient decision cannot see the claim. Shared
// with the row caption so the label and the write agree on what is deletable.
export function claimedPantryNames(
  ingredients: RecipeIngredientModel[],
  inventoryItems: InventoryItem[],
  ticked: Set<string>,
): Set<string> {
  return new Set(
    ingredients
      .filter((ing) => ticked.has(ing.name))
      .flatMap((ing) => matchingPantryItems(ing.name, inventoryItems))
      .map((item) => item.name),
  );
}

export type ReconcilePlan = {
  adds: AddInventoryItem[];
  deletes: string[];
  stillMissing: RecipeIngredientModel[];
};

// Turns the user's ticks into the two pantry writes and the list that goes into
// the substitutions ask. A tick means "I have this"; `ticked` holds ingredient
// names, which are unique within a recipe.
//
// The two directions are deliberately asymmetric. An add uses the recipe's own
// name — a bad match there costs one spare pantry row. A delete removes the
// MATCHED pantry item, and only past two guards, because coverage matching is
// looser than pantry-row identity (ADR-0029) and a delete destroys data: it
// fires only when exactly one item matched (an ambiguous match would remove
// the wrong ingredient) and only when no TICKED ingredient matched that same
// item (one pantry row can answer two ingredients — unticking "fish sauce"
// must not take away the "Soy sauce" the user just affirmed). An unticked
// item held back by either guard is simply absent for this dish, which is the
// transient confirmed-absence ADR-0026 §5 already sanctions.
export function buildReconcilePlan(
  ingredients: RecipeIngredientModel[],
  inventoryItems: InventoryItem[],
  ticked: Set<string>,
): ReconcilePlan {
  const adds: AddInventoryItem[] = [];
  // A Set: two unticked ingredients can each uniquely match the SAME pantry row
  // under coverage matching. `deleteMany` would shrug off the repeat, but
  // `deletes.length` is the number the "n removed" toast reports.
  const deletes = new Set<string>();
  const stillMissing: RecipeIngredientModel[] = [];

  const claimedByTicked = claimedPantryNames(ingredients, inventoryItems, ticked);

  for (const ing of ingredients) {
    const matches = matchingPantryItems(ing.name, inventoryItems);
    const isTicked = ticked.has(ing.name);

    if (isTicked && matches.length === 0) {
      adds.push({
        name: ing.name,
        type: 'ingredient',
        ...(ing.category && { category: ing.category }),
      });
    }

    if (!isTicked) {
      if (matches.length === 1 && !claimedByTicked.has(matches[0].name))
        deletes.add(matches[0].name);
      stillMissing.push(ing);
    }
  }

  return { adds, deletes: [...deletes], stillMissing };
}
