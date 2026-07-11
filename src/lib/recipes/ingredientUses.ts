import type { RecipeStepUse } from "@/lib/recipes/schemas";

// Prep ("Before you start") works on the whole ingredient — you rinse ALL the
// rice, not a partial amount — so its hint is just the ingredient's master
// total, scaled by servings at render like the ingredient list itself. This
// maps the master list into the `uses` shape StepBody already knows how to
// render (see StepBody.tsx / ADR-0021), so no new UI is needed.
//
// Ingredients with no amount (e.g. "salt to taste") map to a use with no
// amount/text; StepBody's formatUseLabel then returns "", so the name renders
// as plain text — no empty popover.
export function ingredientsToUses(
  ingredients: Array<{ name: string; amount?: string | number; unit?: string }>,
): RecipeStepUse[] {
  return ingredients.map((ing) => ({
    name: ing.name,
    amount: ing.amount != null ? String(ing.amount) : undefined,
    unit: ing.unit,
  }));
}
