import type { RecipeStepUse } from "@/lib/recipes/schemas";
import { scaleAmount } from "@/features/Recipe/scaleAmount";

/**
 * A quiet chip row for a step's per-use ingredient quantities (Step Uses —
 * see CONTEXT.md). Deliberately separate from the step's prose `body`.
 * Numeric amounts scale with `ratio` (servings / baseServings, same factor
 * as the master ingredient list); free-text uses (`"remaining"`, `"to
 * taste"`) render as-is.
 */
export function StepUses({
  uses,
  ratio = 1,
}: {
  uses?: RecipeStepUse[];
  ratio?: number;
}) {
  if (!uses || uses.length === 0) return null;

  return (
    <div data-testid="step-uses" className="mt-2 flex flex-wrap gap-1.5">
      {uses.map((use, i) => {
        const amountLabel = use.amount
          ? `${scaleAmount(use.amount, ratio)}${use.unit ? ` ${use.unit}` : ""} `
          : use.text
            ? `${use.text} `
            : "";
        return (
          <span
            key={i}
            className="inline-flex items-center font-mono text-micro font-medium text-muted-foreground bg-muted/50 border border-border rounded-full px-2 py-0.5 tabular-nums"
          >
            {amountLabel}
            {use.name}
          </span>
        );
      })}
    </div>
  );
}
