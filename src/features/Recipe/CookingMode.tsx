"use client";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CookedCheckbox, StepBody } from "@/features/shared/components/recipe";
import type { RecipeStepUse } from "@/lib/recipes/schemas";
import { toast } from "sonner";
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
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onFinish?: () => void;
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
  // Master ingredient list mapped to Step Uses (see ingredientsToUses), applied
  // to every prep card so ingredient names mentioned in prep prose get the same
  // hover-for-quantity hint as steps.
  prepUses?: RecipeStepUse[];
}

function prepToStep(item: string, uses?: RecipeStepUse[]): Step {
  const normalized = item.trim();
  const commaIdx = normalized.indexOf(",");
  const title =
    commaIdx > 0
      ? normalized.slice(0, commaIdx).trim()
      : normalized.split(/\s+/).slice(0, 4).join(" ");
  const body = normalized;
  return { title, body, uses };
}

const PHASE_BADGE_CLASS =
  "shrink-0 size-12 bg-primary text-white flex items-center justify-center rounded-[50%_50%_50%_10px] -rotate-3 shadow-[inset_0_-2px_0_var(--primary-deep),0_1px_0_var(--primary-deep)]";

export function CookingMode({ title, steps, prep, onExit, cooked, onCookedChange, servingsRatio = 1, prepUses, initialStep = 0, onStepChange, onFinish }: CookingModeProps) {
  const prepSteps = (prep ?? []).map((item) => prepToStep(item, prepUses));
  const allSteps: Step[] = [...prepSteps, ...steps];
  const [current, setCurrent] = useState(() => Math.max(0, Math.min(initialStep, allSteps.length - 1)));
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const total = allSteps.length;
  const isPrep = current < prepSteps.length;
  const phaseCurrent = isPrep ? current : current - prepSteps.length;
  const phaseTotal = isPrep ? prepSteps.length : steps.length;
  const phaseLabel = isPrep ? "Prep" : "Step";
  const phaseHeading = isPrep ? "Before you start" : "Cooking";

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

  useEffect(() => {
    onStepChange?.(current);
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [current, onStepChange]);

  if (total === 0) return null;

  const step = allSteps[Math.min(current, total - 1)];
  const prev = () => setCurrent((c) => Math.max(0, c - 1));
  const next = () => setCurrent((c) => Math.min(total - 1, c + 1));
  const isFinalStep = current === total - 1;
  const isLastPrep = isPrep && phaseCurrent === phaseTotal - 1;
  const canMark = isFinalStep && !!onCookedChange;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onExit(); }}>
      <DialogContent
        showCloseButton={false}
        className="fixed inset-0 top-0 left-0 h-dvh max-w-none translate-x-0 translate-y-0 rounded-none border-0 p-0 shadow-none bg-background flex flex-col"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          headingRef.current?.focus();
        }}
      >
        <DialogDescription className="sr-only">
          Step-by-step cooking instructions. Press Escape to return to the recipe.
        </DialogDescription>
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-border shrink-0">
          <div className="min-w-0 flex-1">
            <DialogTitle className="font-display font-semibold text-base text-foreground leading-tight tracking-tight break-words">
              {title}
            </DialogTitle>
            <div role="status" aria-live="polite" className="font-sans text-micro text-ink-faint mt-0.5 tabular-nums">
              {phaseLabel} {phaseCurrent + 1} of {phaseTotal}
              <span className="sr-only">. {step.title}</span>
            </div>
          </div>
          <button
            onClick={onExit}
            className="inline-flex items-center gap-1.5 min-h-11 px-3 py-1.5 font-sans text-xs font-semibold text-foreground bg-card border border-border rounded-lg shadow-[0_1px_0_var(--border-soft)] hover:bg-muted/50 transition-colors cursor-pointer shrink-0"
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
        <div ref={contentRef} className="flex-1 min-h-0 overflow-y-auto px-6 py-8 sm:px-12 max-w-2xl mx-auto w-full">
          <div className="mb-3 font-sans text-xs font-bold uppercase tracking-[0.16em] text-primary">
            {phaseHeading}
          </div>

          {/* Step number stamp */}
          <div className="mb-6 flex items-center gap-3">
            {isPrep ? (
              <div
                aria-label={`Prep task ${phaseCurrent + 1}`}
                className={cn(PHASE_BADGE_CLASS, "font-sans text-[10px] font-bold uppercase tracking-[0.08em]")}
              >
                Prep
              </div>
            ) : (
              <div
                aria-label={`Step ${phaseCurrent + 1}`}
                className={cn(PHASE_BADGE_CLASS, "flex-col font-display font-bold")}
              >
                <span className="font-sans text-[8px] font-bold uppercase tracking-[0.08em] leading-none">
                  Step
                </span>
                <span className="text-2xl leading-none mt-0.5">{phaseCurrent + 1}</span>
              </div>
            )}
            <h2 ref={headingRef} tabIndex={-1} className="font-display font-semibold text-2xl text-foreground leading-tight tracking-tight focus:outline-none">
              {step.title}
            </h2>
          </div>

          <div className="font-display text-xl leading-relaxed text-foreground">
            <StepBody body={step.body} uses={step.uses} ratio={servingsRatio} quantityDisplay="inline" />
          </div>

          {step.tip && (
            <div className="mt-5 font-display italic text-base text-muted-foreground leading-relaxed">
              — {step.tip}
            </div>
          )}
        </div>

        {/* Navigation footer */}
        <div className="px-5 py-4 border-t border-border shrink-0 max-w-2xl mx-auto w-full">
          {/* Last-step recall marker — a quiet, reversible checkbox (ADR-0020) */}
          {canMark && (
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
                onClick={() => {
                  toast.success("All finished. Enjoy your meal, lah.");
                  if (onFinish) onFinish();
                  else onExit();
                }}
                className="flex-[2] py-3 font-sans text-sm font-semibold text-white bg-jade border border-jade-deep rounded-xl shadow-[0_2px_0_var(--jade-deep)] hover:opacity-90 transition-opacity cursor-pointer"
              >
                Done — all finished!
              </button>
            ) : (
              <Button
                variant="ctaDeep"
                onClick={next}
                className="flex-[2] min-h-11 py-3 font-sans text-sm font-semibold"
              >
                {isLastPrep ? "Start cooking →" : isPrep ? "Next prep →" : "Next step →"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
