import type { RecipeStepUse } from "@/lib/recipes/schemas";
import { cn } from "@/lib/utils";
import { StepBody } from "./StepBody";

/**
 * Dotted bullet list — prep ("Before you start") and whole-dish notes on both
 * recipe surfaces. Canonical style is the aligned reference treatment: a
 * right-aligned `·` marker in a fixed gutter, serif body, dashed dividers.
 *
 * `uses`/`ratio` are optional and only meaningful for prep: when passed, each
 * item's prose is run through StepBody so ingredient names it mentions get
 * the same hover-for-quantity hint as recipe steps (see StepBody.tsx). Notes
 * callers omit them and items render as plain text, unchanged.
 */
export function DottedList({
  items,
  uses,
  ratio,
  className,
}: {
  items: string[];
  uses?: RecipeStepUse[];
  ratio?: number;
  className?: string;
}) {
  return (
    <ul className={cn("list-none p-0 m-0 flex flex-col", className)}>
      {items.map((item, i) => (
        <li
          key={i}
          className="flex gap-3 items-baseline py-2 border-b border-dashed border-border last:border-none"
        >
          <span className="font-mono text-dense font-bold text-ink-faint tabular-nums shrink-0 w-5 text-right">
            ·
          </span>
          <span className="flex-1 font-display text-emphasis text-foreground leading-[1.45]">
            {uses ? <StepBody body={item} uses={uses} ratio={ratio} /> : item}
          </span>
        </li>
      ))}
    </ul>
  );
}
