"use client";
// PROTOTYPE — Variant A: "Tick list, blank means no."
// Closest kin to the shipped ClarifyBlock. Rows are checkboxes; staging is
// silent; one submit button whose LABEL carries the stakes. Leaving everything
// blank is a real answer, not an abandonment — the button says so.

import { cn } from "@/lib/utils";
import { useState } from "react";
import { CHECKLIST, DEAL, labelsOf, listify, type ChecklistRow } from "./data";

export const name = "Tick list — blank means no";

export function sentenceA(ticked: string[]): string {
  if (ticked.length === 0) return "I don't have any of those.";
  return `I've got the ${listify(labelsOf(ticked))}.`;
}

interface Props {
  answer: string[] | null;
  abandoned: boolean;
  onSubmit: (ticked: string[]) => void;
}

export function VariantA({ answer, abandoned, onSubmit }: Props) {
  const [staged, setStaged] = useState<string[]>([]);
  // DECIDED (#478): typing a reply instead does NOT close the card — it stays
  // live and tappable until it is actually answered, matching clarify today.
  const locked = answer !== null;
  const shown = answer ?? staged;

  const toggle = (row: ChecklistRow) =>
    setStaged(s => (s.includes(row.id) ? s.filter(x => x !== row.id) : [...s, row.id]));

  const count = shown.length;
  const total = CHECKLIST.rows.length;

  return (
    <div className="min-w-0">
      <div className="font-display italic text-lg leading-relaxed text-foreground mb-1">
        {CHECKLIST.ask}
      </div>
      <div className="font-display italic text-sm text-muted-foreground leading-relaxed mb-3">
        {DEAL}
      </div>

      <div className="flex flex-col gap-2.5">
        {CHECKLIST.rows.map(row => {
          const isTicked = shown.includes(row.id);
          return (
            <button
              key={row.id}
              type="button"
              onClick={() => toggle(row)}
              disabled={locked}
              className={cn(
                "w-full text-left bg-card rounded-xl px-4 py-3 transition-all duration-180 flex items-center gap-3",
                isTicked
                  ? "border border-primary shadow-[0_0_0_2px_oklch(0.56_0.135_35/0.18),0_1px_0_var(--border-soft)]"
                  : "border border-border shadow-[0_1px_0_var(--border-soft),0_14px_24px_-22px_oklch(0.3_0.05_50/0.4)]",
                locked ? "cursor-default" : "cursor-pointer hover:border-primary/60",
                locked && !isTicked && "opacity-60"
              )}
            >
              <span
                className={cn(
                  "shrink-0 size-5 rounded-md border grid place-items-center text-xs font-bold",
                  isTicked
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border text-transparent"
                )}
              >
                ✓
              </span>
              <span className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="font-display font-semibold text-lg text-foreground leading-tight tracking-tight">
                  {row.label}
                </span>
                {row.hint && (
                  <span className="font-display italic text-sm text-muted-foreground leading-relaxed">
                    {row.hint}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {!locked && (
        <button
          type="button"
          onClick={() => onSubmit(staged)}
          className="mt-3 w-full rounded-xl bg-primary text-primary-foreground font-display font-semibold text-base px-4 py-3 cursor-pointer hover:opacity-90 transition"
        >
          {/* DECIDED (#478): the resting label is neutral and only sharpens
              once something is ticked — an untouched card must not shout a
              negative the user hasn't given. Tapping it untouched still sends
              the "none of these" answer. */}
          {count === 0
            ? "Tell Ah Mah"
            : count === total
              ? `I have all ${total} — make the real laksa`
              : count === 1
                ? "I have this 1"
                : `I have these ${count}`}
        </button>
      )}

      {locked && (
        <div className="mt-3 font-sans text-xs font-semibold text-primary-deep">
          ✓ Answered — {count} of {total}
        </div>
      )}
      {abandoned && !locked && (
        <div className="mt-3 font-display italic text-sm text-ink-faint">
          Still here whenever you want it.
        </div>
      )}

      <div className="mt-2.5 font-display italic text-sm text-ink-faint leading-relaxed">
        Or just tell me — type it below.
      </div>
    </div>
  );
}
