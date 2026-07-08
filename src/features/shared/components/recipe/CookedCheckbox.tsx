"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

/**
 * The reversible "I made this" cooked marker (ADR-0020) — a quiet checkbox,
 * not a trophy. Shared between CookingMode's last step and the recipe view;
 * consumers that can't persist the flag simply don't render it.
 */
export function CookedCheckbox({
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
        "flex w-fit items-center gap-2.5 cursor-pointer select-none",
        className,
      )}
    >
      <input
        type="checkbox"
        checked={cooked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-md border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-jade/40 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-background",
          cooked
            ? "bg-jade border-jade text-white"
            : "border-border bg-card text-transparent"
        )}
      >
        <Check className="size-3.5" strokeWidth={3} aria-hidden />
      </span>
      <span className="font-sans text-sm font-medium text-foreground">
        I made this
      </span>
    </label>
  );
}
