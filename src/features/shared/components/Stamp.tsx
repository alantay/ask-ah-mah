import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Kopitiam ink-stamp frame — the rounded-corner, slightly-tilted "chop" motif
 * shared across Ah Mah (the numbered step badges, the brand mark). Wraps any
 * content — an icon, a number, a photo — in a stamped tile. The inner content is
 * counter-rotated so it sits upright inside the tilted frame.
 *
 * Size is set by the caller via `className` (e.g. `size-16`). Two tones:
 * - `"paper"` — a cream card tile with a soft lift (default; good for photos/marks).
 * - `"primary"` — the solid terracotta chop with the pressed-ink underbite
 *   (matches the `StepItem` "stamp" register).
 */
export function Stamp({
  children,
  className,
  tone = "paper",
}: {
  children: ReactNode;
  className?: string;
  tone?: "paper" | "primary";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-[50%_50%_50%_8px] -rotate-3 shrink-0",
        tone === "primary"
          ? "bg-primary text-white shadow-[inset_0_-2px_0_var(--primary-deep),0_1px_0_var(--primary-deep)]"
          : "bg-card border border-border shadow-[0_1px_0_var(--border-soft),0_10px_20px_-16px_oklch(0.3_0.05_50/0.5)]",
        className,
      )}
    >
      <span className="rotate-3 flex items-center justify-center">{children}</span>
    </span>
  );
}
