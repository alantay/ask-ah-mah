"use client";
// PROTOTYPE — Variant B: "Sorter — no blanks allowed."
// Not a checkbox list. Every row is a Have / No question, and answered rows
// physically migrate into two groups. Submit stays disabled until every row has
// been answered, so "confirmed absent" (ask-policy §5) is something the user
// SAID, never something inferred from a blank. Costs more taps; buys certainty.

import { cn } from "@/lib/utils";
import { useState } from "react";
import { CHECKLIST, DEAL, labelsOf, listify, type ChecklistRow } from "./data";

export const name = "Sorter — answer every row";

export function sentenceB(ticked: string[]): string {
  const missing = CHECKLIST.rows.filter(r => !ticked.includes(r.id)).map(r => r.label);
  const have = labelsOf(ticked);
  if (ticked.length === 0) return `No ${listify(missing)} here.`;
  if (missing.length === 0) return `I have all of them — ${listify(have)}.`;
  return `I have ${listify(have)}, but no ${listify(missing)}.`;
}

type Verdict = "have" | "no";

interface Props {
  answer: string[] | null;
  abandoned: boolean;
  onSubmit: (ticked: string[]) => void;
}

export function VariantB({ answer, abandoned, onSubmit }: Props) {
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});
  const locked = answer !== null || abandoned;

  const resolved: Record<string, Verdict | undefined> = locked && answer
    ? Object.fromEntries(
        CHECKLIST.rows.map(r => [r.id, answer.includes(r.id) ? "have" : "no"])
      )
    : verdicts;

  const unanswered = CHECKLIST.rows.filter(r => !resolved[r.id]);
  const have = CHECKLIST.rows.filter(r => resolved[r.id] === "have");
  const no = CHECKLIST.rows.filter(r => resolved[r.id] === "no");

  const set = (row: ChecklistRow, v: Verdict) =>
    setVerdicts(s => ({ ...s, [row.id]: v }));

  const Row = ({ row }: { row: ChecklistRow }) => {
    const v = resolved[row.id];
    return (
      <div
        className={cn(
          "bg-card rounded-xl px-4 py-3 border flex items-center gap-3",
          v === "have"
            ? "border-primary/70"
            : v === "no"
              ? "border-border opacity-60"
              : "border-border shadow-[0_1px_0_var(--border-soft)]"
        )}
      >
        <span className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span className="font-display font-semibold text-base text-foreground leading-tight">
            {row.label}
          </span>
          {!v && row.hint && (
            <span className="font-display italic text-sm text-muted-foreground">
              {row.hint}
            </span>
          )}
        </span>
        {!locked && (
          <span className="shrink-0 flex rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => set(row, "have")}
              className={cn(
                "px-3 py-1.5 font-sans text-xs font-semibold cursor-pointer transition",
                v === "have"
                  ? "bg-primary text-primary-foreground"
                  : "bg-transparent text-muted-foreground hover:bg-muted"
              )}
            >
              Have
            </button>
            <button
              type="button"
              onClick={() => set(row, "no")}
              className={cn(
                "px-3 py-1.5 font-sans text-xs font-semibold cursor-pointer transition border-l border-border",
                v === "no"
                  ? "bg-foreground text-background"
                  : "bg-transparent text-muted-foreground hover:bg-muted"
              )}
            >
              No
            </button>
          </span>
        )}
      </div>
    );
  };

  const GroupLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="font-sans text-[11px] font-semibold uppercase tracking-wider text-ink-faint mt-3 mb-1.5">
      {children}
    </div>
  );

  return (
    <div className={cn("min-w-0", abandoned && "opacity-50")}>
      <div className="font-display italic text-lg leading-relaxed text-foreground mb-1">
        {CHECKLIST.ask}
      </div>
      <div className="font-display italic text-sm text-muted-foreground leading-relaxed mb-2">
        {DEAL}
      </div>

      {unanswered.length > 0 && (
        <>
          {(have.length > 0 || no.length > 0) && <GroupLabel>Still to answer</GroupLabel>}
          <div className="flex flex-col gap-2">
            {unanswered.map(row => (
              <Row key={row.id} row={row} />
            ))}
          </div>
        </>
      )}

      {have.length > 0 && (
        <>
          <GroupLabel>Got it</GroupLabel>
          <div className="flex flex-col gap-2">
            {have.map(row => (
              <Row key={row.id} row={row} />
            ))}
          </div>
        </>
      )}

      {no.length > 0 && (
        <>
          <GroupLabel>Don&apos;t have</GroupLabel>
          <div className="flex flex-col gap-2">
            {no.map(row => (
              <Row key={row.id} row={row} />
            ))}
          </div>
        </>
      )}

      {!locked && (
        <button
          type="button"
          disabled={unanswered.length > 0}
          onClick={() => onSubmit(have.map(r => r.id))}
          className={cn(
            "mt-3 w-full rounded-xl font-display font-semibold text-base px-4 py-3 transition",
            unanswered.length > 0
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground cursor-pointer hover:opacity-90"
          )}
        >
          {unanswered.length > 0
            ? `${unanswered.length} more to answer`
            : "Tell Ah Mah"}
        </button>
      )}

      {locked && !abandoned && (
        <div className="mt-3 font-sans text-xs font-semibold text-primary-deep">
          ✓ Answered — {have.length} have, {no.length} no
        </div>
      )}
      {abandoned && (
        <div className="mt-3 font-display italic text-sm text-ink-faint">
          Left unanswered — you typed instead.
        </div>
      )}

      <div className="mt-2.5 font-display italic text-sm text-ink-faint leading-relaxed">
        Or just tell me — type it below.
      </div>
    </div>
  );
}
