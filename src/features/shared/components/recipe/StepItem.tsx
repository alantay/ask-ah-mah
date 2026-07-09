import type { ComponentPropsWithoutRef, ElementType } from "react";

import type { RecipeStep } from "@/lib/recipes/schemas";
import { cn } from "@/lib/utils";

import { StepBody } from "./StepBody";
import { StepTip } from "./StepTip";

/**
 * A single numbered recipe step, rendered in one of two registers:
 *
 * - `"stamp"` — the chat *letter*: a rotated terracotta ink-stamp badge, larger
 *   serif body. Playful, one recipe at a time.
 * - `"quiet"` — the cookbook *reference*: a mono `1.` in a fixed gutter, denser
 *   serif body. Scannable.
 *
 * Both share the title → body → {@link StepTip} structure. The wrapping element
 * is configurable (`as`) and extra props/`className` are forwarded to it, so the
 * cookbook can render `<li>` rows carrying its diff-overlay attributes
 * (`data-tweak-row`, highlight classes) while the chat renders plain `<div>`s.
 */
type StepItemProps<T extends ElementType> = {
  n: number;
  step: RecipeStep;
  marker?: "stamp" | "quiet";
  ratio?: number;
  as?: T;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "children" | "className">;

const REGISTER = {
  stamp: {
    row: "gap-3 items-start",
    content: "flex-1 min-w-0",
    title: "text-base mb-1",
    body: "text-base leading-relaxed",
  },
  quiet: {
    row: "gap-4",
    content: "flex-1",
    title: "text-emphasis mb-0.5",
    body: "text-emphasis leading-[1.6]",
  },
} as const;

export function StepItem<T extends ElementType = "div">({
  n,
  step,
  marker = "quiet",
  ratio = 1,
  as,
  className,
  ...rest
}: StepItemProps<T>) {
  const Wrapper = (as ?? "div") as ElementType;
  const r = REGISTER[marker];

  return (
    <Wrapper className={cn("flex", r.row, className)} {...rest}>
      {marker === "stamp" ? (
        <div className="shrink-0 size-9 bg-primary text-white flex items-center justify-center font-display font-bold text-lg rounded-[50%_50%_50%_8px] -rotate-3 shadow-[inset_0_-2px_0_var(--primary-deep),0_1px_0_var(--primary-deep)]">
          {n}
        </div>
      ) : (
        <span className="font-mono text-dense font-bold text-ink-faint tabular-nums pt-0.5 shrink-0 w-5 text-right">
          {n}.
        </span>
      )}
      <div className={r.content}>
        {step.title && (
          <div
            className={cn(
              "font-display font-semibold text-foreground tracking-tight",
              r.title,
            )}
          >
            {step.title}
          </div>
        )}
        <div className={cn("font-display text-foreground", r.body)}>
          <StepBody body={step.body} uses={step.uses} ratio={ratio} />
        </div>
        {step.tip && <StepTip>{step.tip}</StepTip>}
      </div>
    </Wrapper>
  );
}
