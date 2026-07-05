"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

interface Step {
  title: string;
  body: string;
  tip?: string;
}

interface CookingModeProps {
  title: string;
  steps: Step[];
  prep?: string[];
  onExit: () => void;
  // Explicit "I made this" tap only — never inferred from reaching the last step (ADR-0020).
  onMadeIt?: () => void;
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

export function CookingMode({ title, steps, prep, onExit, onMadeIt }: CookingModeProps) {
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

  const handleMadeIt = () => {
    onMadeIt?.();
    onExit();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Finish-panel entrance — one-shot, respects reduced motion */}
      <style>{`
        @keyframes finishPanelIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .finish-panel { animation: finishPanelIn 200ms ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .finish-panel { animation: none; }
        }
      `}</style>

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

        {step.tip && (
          <div className="mt-5 pl-4 border-l-[3px] border-callout font-display italic text-base text-muted-foreground leading-relaxed">
            — {step.tip}
          </div>
        )}
      </div>

      {/* Navigation footer */}
      {isFinalStep ? (
        <div
          className="finish-panel w-full max-w-2xl mx-auto rounded-t-2xl px-6 pt-6 shrink-0 shadow-[inset_0_1px_0_oklch(1_0_0/0.16)]"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.55 0.13 35) 0%, oklch(0.42 0.10 30) 100%)",
            paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
          }}
        >
          <div className="flex items-center gap-4 mb-5">
            <div className="relative w-14 h-14 shrink-0 -rotate-6 rounded-full bg-card ring-1 ring-white/25 shadow-[0_2px_0_oklch(0_0_0/0.2)]">
              <div className="absolute inset-2.5">
                <Image src="/granny-icon.png" alt="" fill className="object-contain" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="font-sans text-eyebrow uppercase tracking-[0.14em] text-white/65 mb-1">
                From Ah Mah
              </div>
              <div className="font-display italic text-xl text-white leading-snug">
                You did it — that&rsquo;s dinner, lah.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="flex-1 py-3 font-sans text-sm font-semibold rounded-xl bg-primary-deep text-white border border-primary-deep shadow-[0_2px_0_var(--primary-deeper)] hover:opacity-90 transition-opacity cursor-pointer"
            >
              Back to recipe
            </button>
            <button
              onClick={handleMadeIt}
              className="flex-[2] inline-flex items-center justify-center gap-2 py-3 font-sans text-sm font-semibold rounded-xl bg-card text-jade-deep shadow-[0_2px_0_var(--border-soft)] hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Check className="size-4" strokeWidth={2.5} aria-hidden />
              I made this
            </button>
          </div>
        </div>
      ) : (
        <div className="px-5 py-4 border-t border-border flex items-center gap-3 shrink-0 max-w-2xl mx-auto w-full">
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

          <Button
            variant="ctaDeep"
            onClick={next}
            className="flex-[2] py-3 font-sans text-sm font-semibold"
          >
            Next step →
          </Button>
        </div>
      )}
    </div>
  );
}
