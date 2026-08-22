import type { AddInventoryItem, InventoryItem } from '@/lib/inventory/schemas';
import { ingredientMatches } from '@/lib/recipes/matchIngredient';
import type { RecipeIngredientModel } from '@/lib/recipes/schemas';

// Every pantry item the loose token matcher considers the same thing as this
// ingredient. `ingredientMatches` matches on ANY shared token, so this can
// legitimately return several unrelated items ("dark soy sauce" hits both
// "fish sauce" and "soy sauce" via "sauce") — see issue #491.
export function matchingPantryItems(
  ingredientName: string,
  inventoryItems: InventoryItem[],
): InventoryItem[] {
  return inventoryItems.filter((item) =>
    ingredientMatches(ingredientName, [item.name]),
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
// MATCHED pantry item, and only when exactly one item matched: under the loose
// matcher, deleting on an ambiguous match would remove the wrong ingredient.
// An ambiguous unticked item is simply absent for this dish, which is the
// transient confirmed-absence ADR-0026 §5 already sanctions.
export function buildReconcilePlan(
  ingredients: RecipeIngredientModel[],
  inventoryItems: InventoryItem[],
  ticked: Set<string>,
): ReconcilePlan {
  const adds: AddInventoryItem[] = [];
  const deletes: string[] = [];
  const stillMissing: RecipeIngredientModel[] = [];

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
      if (matches.length === 1) deletes.push(matches[0].name);
      stillMissing.push(ing);
    }
  }

  return { adds, deletes, stillMissing };
}
