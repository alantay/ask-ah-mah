"use client";

import { Button } from "@/components/ui/button";
import { CookedCheckbox, StepUses } from "@/features/shared/components/recipe";
import type { RecipeStepUse } from "@/lib/recipes/schemas";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";

interface Step {
  title: string;
  body: string;
  tip?: string;
  uses?: RecipeStepUse[];
}

interface CookingModeProps {
  title: string;
  steps: Step[];
  prep?: string[];
  onExit: () => void;
  // Whether this dish is already marked cooked (ADR-0020). Reflected by the
  // last-step "I made this" checkbox; omitted when the consumer can't persist it.
  cooked?: boolean;
  // Toggles the cooked marker. Explicit checkbox tap only — never inferred from
  // reaching the last step (ADR-0020). Reversible: `false` un-marks it.
  onCookedChange?: (cooked: boolean) => void;
  // servings / baseServings ratio — scales numeric Step Uses amounts the same
  // way the master ingredient list scales. Defaults to 1 (no consumer that
  // omits it has a servings stepper to desync from).
  servingsRatio?: number;
}

function prepToStep(item: string): Step {
  const normalized = item.trim();
  const commaIdx = normalized.indexOf(",");
  const title =
    commaIdx > 0
      ? normalized.slice(0, commaIdx).trim()
      : normalized.split(/\s+/).slice(0, 4).join(" ");
  const body = normalized;
  return { title, body };
}

export function CookingMode({ title, steps, prep, onExit, cooked, onCookedChange, servingsRatio = 1 }: CookingModeProps) {
  const allSteps: Step[] = [
    ...(prep ?? []).map(prepToStep),
    ...steps,
  ];
  const [current, setCurrent] = useState(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const total = allSteps.length;

  const requestWakeLock = useCallback(async () => {
    if (!("wakeLock" in navigator)) return;
    try {
      const lock = await navigator.wakeLock.request("screen");
      lock.addEventListener("release", () => {
        if (wakeLockRef.current === lock) wakeLockRef.current = null;
      });
      wakeLockRef.current = lock;
    } catch {}
  }, []);

  useEffect(() => {
    requestWakeLock();
    return () => {
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [requestWakeLock]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && (!wakeLockRef.current || wakeLockRef.current.released)) {
        requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [requestWakeLock]);

  if (total === 0) return null;

  const step = allSteps[Math.min(current, total - 1)];
  const prev = () => setCurrent((c) => Math.max(0, c - 1));
  const next = () => setCurrent((c) => Math.min(total - 1, c + 1));
  const isFinalStep = current === total - 1;
  const canMark = isFinalStep && !!onCookedChange;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
        <div>
          <div className="font-display font-semibold text-base text-foreground leading-tight tracking-tight truncate max-w-[240px] sm:max-w-none">
            {title}
          </div>
          <div className="font-sans text-micro text-ink-faint mt-0.5 tabular-nums">
            Step {current + 1} of {total}
          </div>
        </div>
        <button
          onClick={onExit}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 font-sans text-xs font-semibold text-foreground bg-card border border-border rounded-lg shadow-[0_1px_0_var(--border-soft)] hover:bg-muted/50 transition-colors cursor-pointer shrink-0"
        >
          Exit cooking mode
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-border shrink-0">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((current + 1) / total) * 100}%` }}
        />
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto flex flex-col justify-center px-6 py-8 sm:px-12 max-w-2xl mx-auto w-full">
        {/* Step number stamp */}
        <div className="mb-6 flex items-center gap-3">
          <div className="shrink-0 size-12 bg-primary text-white flex items-center justify-center font-display font-bold text-2xl rounded-[50%_50%_50%_10px] -rotate-3 shadow-[inset_0_-2px_0_var(--primary-deep),0_1px_0_var(--primary-deep)]">
            {current + 1}
          </div>
          <div className="font-display font-semibold text-2xl text-foreground leading-tight tracking-tight">
            {step.title}
          </div>
        </div>

        <div className="font-display text-xl leading-relaxed text-foreground">
          {step.body}
        </div>

        <StepUses uses={step.uses} ratio={servingsRatio} />

        {step.tip && (
          <div className="mt-5 pl-4 border-l-[3px] border-callout font-display italic text-base text-muted-foreground leading-relaxed">
            — {step.tip}
          </div>
        )}
      </div>

      {/* Navigation footer */}
      <div className="px-5 py-4 border-t border-border shrink-0 max-w-2xl mx-auto w-full">
        {/* Last-step recall marker — a quiet, reversible checkbox (ADR-0020) */}
        {canMark && onCookedChange && (
          <CookedCheckbox cooked={!!cooked} onChange={onCookedChange} className="mb-3" />
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={prev}
            disabled={current === 0}
            className={cn(
              "flex-1 py-3 font-sans text-sm font-semibold rounded-xl border transition-colors cursor-pointer",
              current === 0
                ? "text-muted-foreground border-border bg-card opacity-40 cursor-not-allowed"
                : "text-foreground border-border bg-card shadow-[0_1px_0_var(--border-soft)] hover:bg-muted/50"
            )}
          >
            ← Prev
          </button>

          {isFinalStep ? (
            <button
              onClick={onExit}
              className="flex-[2] py-3 font-sans text-sm font-semibold text-white bg-jade border border-jade-deep rounded-xl shadow-[0_2px_0_var(--jade-deep)] hover:opacity-90 transition-opacity cursor-pointer"
            >
              Done — all finished!
            </button>
          ) : (
            <Button
              variant="ctaDeep"
              onClick={next}
              className="flex-[2] py-3 font-sans text-sm font-semibold"
            >
              Next step →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
