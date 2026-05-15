"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface Step {
  title: string;
  body: string;
  tip?: string;
}

interface CookingModeProps {
  title: string;
  steps: Step[];
  onExit: () => void;
}

export function CookingMode({ title, steps, onExit }: CookingModeProps) {
  const [current, setCurrent] = useState(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const total = steps.length;
  const step = steps[current];

  useEffect(() => {
    if (!("wakeLock" in navigator)) return;
    navigator.wakeLock.request("screen").then((lock) => {
      wakeLockRef.current = lock;
    }).catch(() => {});

    return () => {
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, []);

  // Re-acquire wake lock if page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !wakeLockRef.current && "wakeLock" in navigator) {
        navigator.wakeLock.request("screen").then((lock) => {
          wakeLockRef.current = lock;
        }).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const prev = () => setCurrent((c) => Math.max(0, c - 1));
  const next = () => setCurrent((c) => Math.min(total - 1, c + 1));

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
        <div>
          <div className="font-display font-semibold text-base text-foreground leading-tight tracking-tight truncate max-w-[240px] sm:max-w-none">
            {title}
          </div>
          <div className="font-sans text-[11px] text-ink-faint mt-0.5 tabular-nums">
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
          <div className="shrink-0 size-12 bg-primary text-white flex items-center justify-center font-display font-bold text-2xl rounded-[50%_50%_50%_10px] -rotate-3 shadow-[inset_0_-2px_0_oklch(0.405_0.130_32),0_1px_0_oklch(0.405_0.130_32)]">
            {current + 1}
          </div>
          <div className="font-display font-semibold text-2xl text-foreground leading-tight tracking-tight">
            {step.title}
          </div>
        </div>

        <div className="font-display text-[1.25rem] leading-relaxed text-foreground">
          {step.body}
        </div>

        {step.tip && (
          <div className="mt-5 pl-4 border-l-[3px] border-[oklch(0.65_0.10_60)] font-display italic text-base text-muted-foreground leading-relaxed">
            — {step.tip}
          </div>
        )}
      </div>

      {/* Navigation footer */}
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

        {current < total - 1 ? (
          <button
            onClick={next}
            className="flex-[2] py-3 font-sans text-sm font-semibold text-white bg-primary border border-[oklch(0.405_0.130_32)] rounded-xl shadow-[0_2px_0_oklch(0.405_0.130_32)] hover:bg-[oklch(0.50_0.130_32)] transition-colors cursor-pointer"
          >
            Next step →
          </button>
        ) : (
          <button
            onClick={onExit}
            className="flex-[2] py-3 font-sans text-sm font-semibold text-white bg-jade border border-[oklch(0.35_0.10_168)] rounded-xl shadow-[0_2px_0_oklch(0.35_0.10_168)] hover:opacity-90 transition-opacity cursor-pointer"
          >
            Done — all finished!
          </button>
        )}
      </div>
    </div>
  );
}
