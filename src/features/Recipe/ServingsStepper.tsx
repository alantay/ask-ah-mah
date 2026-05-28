"use client";

interface ServingsStepperProps {
  servings: number;
  onDecrement: () => void;
  onIncrement: () => void;
  max?: number;
}

export function ServingsStepper({
  servings,
  onDecrement,
  onIncrement,
  max = 20,
}: ServingsStepperProps) {
  return (
    <div className="inline-flex items-center bg-card border border-border rounded-lg overflow-hidden shadow-[0_1px_0_var(--color-border-soft)]">
      <button
        onClick={onDecrement}
        disabled={servings <= 1}
        aria-label="Decrease servings"
        className="w-8 h-8 flex items-center justify-center text-foreground text-base font-semibold border-r border-border hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        −
      </button>
      <span className="min-w-11 text-center font-display font-semibold text-[15px] text-foreground tabular-nums">
        {servings}
      </span>
      <button
        onClick={onIncrement}
        disabled={servings >= max}
        aria-label="Increase servings"
        className="w-8 h-8 flex items-center justify-center text-foreground text-base font-semibold border-l border-border hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        +
      </button>
    </div>
  );
}
