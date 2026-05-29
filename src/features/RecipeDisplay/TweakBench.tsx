"use client";

import type { ChangeEntry, RecipeWithId } from "@/lib/recipes/schemas";
import { recipeWithIdToBlock } from "@/lib/recipes/schemas";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type TurnEntry =
  | { kind: "user"; text: string }
  | { kind: "assistant"; changes: ChangeEntry[] }
  | { kind: "refusal"; text: string };

// ─── Props ───────────────────────────────────────────────────────────────────

interface TweakBenchProps {
  recipe: RecipeWithId;
  userId: string;
  onWorkingDraftChange: (draft: RecipeWithId, changes: ChangeEntry[]) => void;
  onClose: () => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const QUICK_TWEAKS = ["Less spicy", "Make it quicker", "More servings", "Swap for pantry staples"];

// ─── TweakBench ──────────────────────────────────────────────────────────────

export function TweakBench({
  recipe,
  userId,
  onWorkingDraftChange,
  onClose,
  onSave,
  isSaving,
}: TweakBenchProps) {
  const [turns, setTurns] = useState<TurnEntry[]>([]);
  const [instruction, setInstruction] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  // Working draft accumulates across turns — used as the model input for each new turn
  const workingDraftRef = useRef<RecipeWithId>(recipe);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  // Reset bench when the recipe changes (different recipe page)
  useEffect(() => {
    workingDraftRef.current = recipe;
    setTurns([]);
    setInstruction("");
    setIsStreaming(false);
    onWorkingDraftChange(recipe, []);
  }, [recipe.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll turn log to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, isStreaming]);

  // Focus input on open
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const successfulTurns = turns.filter((t) => t.kind === "assistant").length;

  const sendTweak = useCallback(
    async (prompt?: string) => {
      const text = (prompt ?? instruction).trim();
      if (!text || isStreaming) return;

      setInstruction("");
      setIsStreaming(true);
      setTurns((prev) => [...prev, { kind: "user", text }]);

      const currentDraft = workingDraftRef.current;

      try {
        const res = await fetch(`/api/recipe/${recipe.id}/tweak`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            instruction: text,
            originalRecipe: recipeWithIdToBlock(recipe),
            workingDraft: recipeWithIdToBlock(currentDraft),
          }),
        });

        if (!res.ok || !res.body) throw new Error("Tweak request failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        let lastParsedDraft: RecipeWithId | null = null;
        let lastParsedChanges: ChangeEntry[] = [];

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            accumulated += decoder.decode(value, { stream: true });

            // Progressive parse — update recipe view during streaming
            try {
              const partial = JSON.parse(accumulated);
              if (partial?.recipe) {
                const r = partial.recipe as Record<string, unknown>;
                const newDraft: RecipeWithId = {
                  ...currentDraft,
                  name: (r.title as string) ?? currentDraft.name,
                  description: (r.description as string | undefined) ?? currentDraft.description,
                  totalTimeMinutes: (r.totalTimeMinutes as number | undefined) ?? currentDraft.totalTimeMinutes,
                  baseServings: (r.baseServings as number) ?? currentDraft.baseServings,
                  ingredients: (r.ingredients as RecipeWithId["ingredients"]) ?? currentDraft.ingredients,
                  prep: (r.prep as string[] | undefined) ?? currentDraft.prep,
                  steps: (r.steps as RecipeWithId["steps"]) ?? currentDraft.steps,
                  tags: (r.tags as string[] | undefined) ?? currentDraft.tags,
                };
                const newChanges: ChangeEntry[] = (partial.changes as ChangeEntry[]) ?? [];
                lastParsedDraft = newDraft;
                lastParsedChanges = newChanges;
                onWorkingDraftChange(newDraft, newChanges);
              }
            } catch {
              // Incomplete JSON — keep accumulating
            }
          }
        } finally {
          reader.cancel().catch(() => {});
        }

        if (lastParsedDraft) {
          workingDraftRef.current = lastParsedDraft;
          setTurns((prev) => [
            ...prev,
            { kind: "assistant", changes: lastParsedChanges },
          ]);
        } else {
          // Non-JSON response = model refusal
          const refusalText = accumulated.trim() || "Ah Mah couldn't do that one. Try a different instruction?";
          setTurns((prev) => [...prev, { kind: "refusal", text: refusalText }]);
        }
      } catch (err) {
        console.error("[TweakBench] stream error:", err);
        setTurns((prev) => [
          ...prev,
          { kind: "refusal", text: "Aiyah, something went wrong. Try again?" },
        ]);
      } finally {
        setIsStreaming(false);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    },
    [instruction, isStreaming, recipe, userId, onWorkingDraftChange],
  );

  const handleTryAgain = useCallback(() => {
    workingDraftRef.current = recipe;
    setTurns([]);
    setInstruction("");
    onWorkingDraftChange(recipe, []);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [recipe, onWorkingDraftChange]);

  return (
    <div className="flex flex-col h-full border-l border-border bg-card w-[360px] sm:w-[380px] shrink-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[8px] bg-primary/8 border border-primary/40 text-primary inline-flex items-center justify-center shrink-0">
            <PencilIcon />
          </div>
          <div>
            <div className="font-display italic font-semibold text-[15px] text-foreground tracking-tight leading-none">
              Tweak bench
            </div>
            <div className="font-sans text-[11px] text-ink-faint mt-0.5">
              Ah Mah rewrites — you watch it happen
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close tweak bench"
          className="w-7 h-7 inline-flex items-center justify-center border border-border rounded-full text-[11px] text-muted-foreground hover:bg-muted/60 transition-colors cursor-pointer shrink-0 mt-0.5"
        >
          ✕
        </button>
      </div>

      {/* Turn log */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 min-h-0">
        <AssistantBubble text="What should I tweak?" />

        {turns.map((turn, i) => {
          if (turn.kind === "user") {
            return (
              <div key={i} className="flex justify-end">
                <div className="max-w-[82%] px-3.5 py-2 bg-[oklch(0.86_0.10_88)] text-foreground rounded-2xl rounded-br-sm font-sans text-[13.5px] leading-[1.5]">
                  {turn.text}
                </div>
              </div>
            );
          }

          if (turn.kind === "assistant") {
            const n = turn.changes.length;
            return (
              <div key={i} className="flex flex-col gap-3">
                <AssistantBubble
                  text={`Done! ${n} change${n !== 1 ? "s" : ""}. Have a look on the left — anything still off?`}
                />
                {n > 0 && (
                  <div className="pl-[37px]">
                    <div className="font-sans text-[9.5px] font-bold tracking-[0.16em] uppercase text-ink-faint mb-2">
                      What changed
                    </div>
                    <ul className="flex flex-col gap-1.5">
                      {turn.changes.map((c, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <span className="text-emerald-600 shrink-0 mt-[1px]">
                            <CheckIcon />
                          </span>
                          <span className="font-sans text-[12.5px] text-foreground leading-[1.45]">
                            {c.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          }

          if (turn.kind === "refusal") {
            return <AssistantBubble key={i} text={turn.text} />;
          }

          return null;
        })}

        {/* Streaming indicator */}
        {isStreaming && (
          <div className="flex gap-2.5 items-center">
            <div className="relative w-7 h-7 shrink-0">
              <Image src="/granny-icon.png" alt="" fill className="object-contain" />
            </div>
            <div className="inline-flex gap-[4px] items-center">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-[5px] h-[5px] rounded-full bg-primary"
                  style={{
                    animation: `tweakDot 1.2s ease-in-out ${i * 0.15}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={logEndRef} />
      </div>

      {/* Input + footer */}
      <div className="shrink-0 border-t border-border px-4 pt-3 pb-4">
        {/* Quick chips — first turn only */}
        {!isStreaming && turns.length === 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {QUICK_TWEAKS.map((chip) => (
              <button
                key={chip}
                onClick={() => sendTweak(chip)}
                className="px-2.5 py-1 text-[11px] font-medium text-muted-foreground bg-background border border-border/70 rounded-full cursor-pointer hover:bg-muted/60 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Input row */}
        {!isStreaming ? (
          <div className="flex items-center gap-2.5 px-3.5 py-2 bg-background border border-border rounded-full shadow-[0_1px_0_var(--color-border-soft)]">
            <input
              ref={inputRef}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendTweak();
              }}
              placeholder="e.g. less spicy, add cucumber…"
              className="flex-1 bg-transparent border-none outline-none text-[13px] text-foreground placeholder:text-muted-foreground font-sans"
            />
            <button
              onClick={() => sendTweak()}
              disabled={!instruction.trim()}
              aria-label="Send"
              className={`w-7 h-7 rounded-full inline-flex items-center justify-center shrink-0 transition-colors ${
                instruction.trim()
                  ? "bg-primary text-primary-foreground cursor-pointer hover:opacity-90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path d="M3 12 L21 4 L13 21 L11 13 Z" fill="currentColor" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-background border border-border/60 rounded-full opacity-60">
            <span className="font-sans text-[13px] text-muted-foreground italic">
              Ah Mah is rewriting…
            </span>
          </div>
        )}

        {/* Footer actions — visible after a successful turn */}
        {successfulTurns > 0 && !isStreaming && (
          <div className="mt-3 flex flex-col gap-2">
            <button
              onClick={onSave}
              disabled={isSaving}
              className="w-full py-2.5 text-[13px] font-semibold text-primary-foreground bg-primary border border-primary/80 rounded-lg cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {isSaving ? "Saving…" : "Save to my cookbook"}
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleTryAgain}
                className="flex-1 py-2 text-[12px] font-semibold text-foreground bg-background border border-border rounded-lg cursor-pointer hover:bg-muted/60 transition-colors"
              >
                Try a different tweak
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 text-[12px] font-semibold text-muted-foreground bg-background border border-border rounded-lg cursor-pointer hover:bg-muted/60 transition-colors"
              >
                ↩ Discard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function AssistantBubble({ text }: { text: string }) {
  return (
    <div className="flex gap-2.5 items-start">
      <div className="relative w-7 h-7 shrink-0">
        <Image src="/granny-icon.png" alt="" fill className="object-contain" />
      </div>
      <div className="flex-1 font-display italic text-[13.5px] text-foreground leading-[1.5] pt-0.5">
        {text}
      </div>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      className="shrink-0"
    >
      <path
        d="M3 10.5 L8.5 5 L11 7.5 L5.5 13 H3 V10.5 Z M8.5 5 L10 3.5 L12.5 6 L11 7.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.15" />
      <path
        d="M5 8.5L7 10.5L11 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
