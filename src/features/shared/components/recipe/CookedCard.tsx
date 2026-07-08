"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

/**
 * The cooked marker as a card (ADR-0020) — a matching sibling to the recipe's
 * Total time card, so "have I made this?" lives in the recipe meta rather than
 * floating over the hero. Quiet and squared at rest; on tick the whole card
 * warms to a jade tint with a mono "made once · logged" line — a small, earned
 * moment rather than a permanent green dot.
 *
 * The visible helper/status text is decorative — the input carries an explicit
 * "I made this" label and the checked state conveys "logged" to assistive tech.
 */
export function CookedCard({
  cooked,
  onChange,
  className,
}: {
  cooked: boolean;
  onChange: (cooked: boolean) => void;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "flex min-w-[200px] flex-1 items-center gap-2.5 rounded-lg border px-3.5 py-2 cursor-pointer select-none transition-colors",
        cooked
          ? "bg-jade-tint border-jade-border"
          : "bg-card border-border shadow-[0_1px_0_var(--color-border-soft)] hover:border-jade-border",
        className,
      )}
    >
      <input
        type="checkbox"
        checked={cooked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label="I made this"
        className="peer sr-only"
      />
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-jade/40 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-background",
          cooked
            ? "bg-jade border-jade text-white"
            : "border-border bg-card text-transparent",
        )}
      >
        <Check className="size-3.5" strokeWidth={3} aria-hidden />
      </span>
      <span className="flex min-w-0 items-baseline gap-2" aria-hidden>
        <span
          className={cn(
            "font-sans text-sm font-semibold shrink-0",
            cooked ? "text-jade-deep" : "text-foreground",
          )}
        >
          I made this
        </span>
        <span
          className={cn(
            "font-mono text-[11px] tracking-tight truncate",
            cooked ? "text-jade-deep/70" : "text-muted-foreground",
          )}
        >
          {cooked ? "made once · logged" : "tap when you've cooked it"}
        </span>
      </span>
    </label>
  );
}
