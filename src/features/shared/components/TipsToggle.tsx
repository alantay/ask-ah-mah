"use client";

import { cn } from "@/lib/utils";

/**
 * A small on/off switch for showing or hiding Ah Mah's tips on a surface.
 * Presentational only — the persisted preference lives in `useTipsPreference`.
 * Reused per-surface (Shopping List Market tips, Pantry Storage tips), each
 * with its own state.
 */
export function TipsToggle({
  enabled,
  onChange,
  label = "Ah Mah's tips",
  className,
}: {
  enabled: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-2 cursor-pointer select-none",
        className,
      )}
    >
      <span className="font-display italic text-dense text-muted-foreground">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={`${label} ${enabled ? "on" : "off"}`}
        onClick={() => onChange(!enabled)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          enabled ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "inline-block size-4 rounded-full bg-card shadow-sm transition-transform",
            enabled ? "translate-x-[18px]" : "translate-x-[2px]",
          )}
        />
      </button>
    </label>
  );
}
