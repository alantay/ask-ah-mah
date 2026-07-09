import type { RecipeStep } from "@/lib/recipes/schemas";
import { cn } from "@/lib/utils";

import { StepItem } from "./StepItem";

/**
 * Convenience wrapper: a vertical run of {@link StepItem}s for the common case
 * (the chat letter). Surfaces that need per-step decoration — e.g. the
 * cookbook's diff overlay — should map {@link StepItem} directly instead.
 */
export function StepList({
  steps,
  marker = "stamp",
  ratio,
  className,
}: {
  steps: RecipeStep[];
  marker?: "stamp" | "quiet";
  ratio?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4.5", className)}>
      {steps.map((step, i) => (
        <StepItem key={i} n={i + 1} step={step} marker={marker} ratio={ratio} />
      ))}
    </div>
  );
}
