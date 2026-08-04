"use client";
// PROTOTYPE — Variant C: "Message builder."
// The block does not send. Tapping chips composes a sentence, live, in the
// user's own voice — and the button drops that sentence into the real composer
// for the user to edit and send themselves. The primary affordance is writing a
// message, not filling a form: the escape hatch and the answer are the same act.
// Cost: what lands in the thread is whatever the user finally typed, so the
// ticked set can only ever be RECOVERED from prose, never recorded.

import { cn } from "@/lib/utils";
import { useState } from "react";
import { CHECKLIST, DEAL, labelsOf, listify } from "./data";

export const name = "Message builder — drafts into the composer";

export function sentenceC(ticked: string[]): string {
  if (ticked.length === 0) return "I don't have any of those.";
  return `I have ${listify(labelsOf(ticked))}.`;
}

interface Props {
  answer: string[] | null;
  abandoned: boolean;
  onDraft: (text: string) => void;
}

export function VariantC({ answer, abandoned, onDraft }: Props) {
  const [staged, setStaged] = useState<string[]>([]);
  const locked = answer !== null || abandoned;
  const shown = answer ?? staged;

  return (
    <div className={cn("min-w-0", abandoned && "opacity-50")}>
      <div className="font-display italic text-lg leading-relaxed text-foreground mb-1">
        {CHECKLIST.ask}
      </div>
      <div className="font-display italic text-sm text-muted-foreground leading-relaxed mb-3">
        {DEAL}
      </div>

      {/* Chips — no rows, no cards. Tapping puts the word in your sentence. */}
      <div className="flex flex-wrap gap-2">
        {CHECKLIST.rows.map(row => {
          const on = shown.includes(row.id);
          return (
            <button
              key={row.id}
              type="button"
              disabled={locked}
              onClick={() =>
                setStaged(s =>
                  s.includes(row.id) ? s.filter(x => x !== row.id) : [...s, row.id]
                )
              }
              title={row.hint}
              className={cn(
                "rounded-full px-4 py-2 font-display text-base transition border",
                on
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:border-primary/60",
                locked ? "cursor-default" : "cursor-pointer",
                locked && !on && "opacity-50"
              )}
            >
              {row.label}
            </button>
          );
        })}
      </div>

      {/* The sentence being written — this IS the message. */}
      <div className="mt-3 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3">
        <div className="font-sans text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1">
          Your reply
        </div>
        <div
          className={cn(
            "font-display text-lg leading-relaxed",
            shown.length === 0 ? "text-muted-foreground italic" : "text-foreground"
          )}
        >
          {sentenceC(shown)}
        </div>
      </div>

      {!locked && (
        <button
          type="button"
          onClick={() => onDraft(sentenceC(staged))}
          className="mt-3 w-full rounded-xl bg-primary text-primary-foreground font-display font-semibold text-base px-4 py-3 cursor-pointer hover:opacity-90 transition"
        >
          Put this in the box ↓
        </button>
      )}

      {locked && !abandoned && (
        <div className="mt-3 font-sans text-xs font-semibold text-primary-deep">
          ✓ Answered — recovered from what you sent
        </div>
      )}
      {abandoned && (
        <div className="mt-3 font-display italic text-sm text-ink-faint">
          Left unanswered — nothing in your message matched.
        </div>
      )}

      <div className="mt-2.5 font-display italic text-sm text-ink-faint leading-relaxed">
        Edit it however you like before sending.
      </div>
    </div>
  );
}
