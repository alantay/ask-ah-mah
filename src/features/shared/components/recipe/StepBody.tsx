"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import type { RecipeStepUse } from "@/lib/recipes/schemas";
import { scaleAmount } from "@/features/Recipe/scaleAmount";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * A step's prose `body`, with any word/phrase that names a Step Use (see
 * CONTEXT.md, ADR-0021) turned into an interactive hint: hover or tap shows
 * the quantity consumed at this step, scaled by `ratio` the same way the
 * master ingredient list scales.
 *
 * Matching is best-effort and silent: a `use` whose `name` doesn't literally
 * appear in `body` (e.g. a later reference like "stir it in") just renders no
 * hint for that entry — no fallback chip, per ADR-0021's existing philosophy
 * that a missed quantity is a smaller failure than cluttering the prose.
 */
export function StepBody({
  body,
  uses,
  ratio = 1,
}: {
  body: string;
  uses?: RecipeStepUse[];
  ratio?: number;
}) {
  if (!uses || uses.length === 0) return <>{body}</>;

  const matches = findMatches(body, uses);
  if (matches.length === 0) return <>{body}</>;

  const nodes: ReactNode[] = [];
  let cursor = 0;
  matches.forEach((match, i) => {
    if (match.start > cursor) nodes.push(body.slice(cursor, match.start));
    const label = formatUseLabel(match.use, ratio);
    nodes.push(
      label ? (
        <UseHint key={i} label={label}>
          {body.slice(match.start, match.end)}
        </UseHint>
      ) : (
        body.slice(match.start, match.end)
      ),
    );
    cursor = match.end;
  });
  if (cursor < body.length) nodes.push(body.slice(cursor));

  return <>{nodes}</>;
}

function formatUseLabel(use: RecipeStepUse, ratio: number): string {
  if (use.amount) {
    return `${scaleAmount(use.amount, ratio)}${use.unit ? ` ${use.unit}` : ""}`;
  }
  return use.text ?? "";
}

type Match = { start: number; end: number; use: RecipeStepUse };

// First-fit, non-overlapping: each `use` claims the earliest occurrence of
// its `name` in `body` that no earlier use has already claimed.
function findMatches(body: string, uses: RecipeStepUse[]): Match[] {
  const claimed: Array<[number, number]> = [];
  const matches: Match[] = [];

  for (const use of uses) {
    if (!use.name) continue;
    const re = new RegExp(`\\b${escapeRegExp(use.name)}\\b`, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(body))) {
      const start = m.index;
      const end = start + m[0].length;
      const overlaps = claimed.some(([s, e]) => start < e && end > s);
      if (!overlaps) {
        matches.push({ start, end, use });
        claimed.push([start, end]);
        break;
      }
    }
  }

  return matches.sort((a, b) => a.start - b.start);
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function UseHint({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
          className="underline decoration-dotted decoration-muted-foreground/70 underline-offset-4 font-medium cursor-help"
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        sideOffset={6}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-auto px-2.5 py-1 font-mono text-micro font-medium tabular-nums"
      >
        {label}
      </PopoverContent>
    </Popover>
  );
}
