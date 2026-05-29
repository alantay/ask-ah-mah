"use client";

import { CookingMode, ServingsStepper } from "@/features/Recipe";
import { useSessionContext } from "@/contexts/SessionContext";
import { RecipeIngredient, RecipeStep, RecipeWithId } from "@/lib/recipes/schemas";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatAmount = (n: number) => {
  if (Number.isInteger(n)) return String(n);
  return Number(n.toFixed(2)).toString();
};

const extractInstructions = (markdown: string): string => {
  const match = markdown.match(/\*\*Instructions:\*\*\s*\n([\s\S]*)/i);
  if (match) {
    return match[1].replace(/\n?\s*-----\s*$/, "").trim();
  }
  return markdown;
};

const formatTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} h ${m} m` : `${h} h`;
};

// ─── Tweak state machine ─────────────────────────────────────────────────────

type TweakState = "resting" | "open" | "streaming" | "preview" | "saved";

const QUICK_TWEAKS = [
  "Use what's in my pantry",
  "Swap for pantry staples",
  "Less spicy",
  "Make it quicker",
];

// ─── Changed-field tracking ──────────────────────────────────────────────────

function diffRecipes(
  original: RecipeWithId,
  tweaked: RecipeWithId,
): { ingredients: Set<number>; steps: Set<number>; deletedIngredients: Set<number>; deletedSteps: Set<number> } {
  const changedIngredients = new Set<number>();
  const changedSteps = new Set<number>();
  const deletedIngredients = new Set<number>();
  const deletedSteps = new Set<number>();

  const origIngs = (original.ingredients || []) as RecipeIngredient[];
  const tweakIngs = (tweaked.ingredients || []) as RecipeIngredient[];

  const ingLen = Math.max(origIngs.length, tweakIngs.length);
  for (let i = 0; i < ingLen; i++) {
    const orig = origIngs[i];
    const ing = tweakIngs[i];
    if (!ing) {
      // Row deleted by AI — mark the original index as deleted
      deletedIngredients.add(i);
    } else if (
      !orig ||
      orig.name !== ing.name ||
      orig.amount !== ing.amount ||
      orig.unit !== ing.unit
    ) {
      changedIngredients.add(i);
    }
  }

  const origSteps = (original.steps || []) as RecipeStep[];
  const tweakSteps = (tweaked.steps || []) as RecipeStep[];

  const stepsLen = Math.max(origSteps.length, tweakSteps.length);
  for (let i = 0; i < stepsLen; i++) {
    const orig = origSteps[i];
    const step = tweakSteps[i];
    if (!step) {
      deletedSteps.add(i);
    } else if (!orig || orig.body !== step.body || orig.title !== step.title) {
      changedSteps.add(i);
    }
  }

  return { ingredients: changedIngredients, steps: changedSteps, deletedIngredients, deletedSteps };
}

// ─── RecipeBody ──────────────────────────────────────────────────────────────

interface RecipeBodyProps {
  selectedRecipe: RecipeWithId;
  /** Fields that changed compared to original (highlight them) */
  changedIngredients?: Set<number>;
  changedSteps?: Set<number>;
  /** Rows present in original but removed by AI tweak */
  deletedIngredients?: Set<number>;
  deletedSteps?: Set<number>;
  /** Original recipe — needed to render deleted rows */
  originalRecipe?: RecipeWithId;
  tweakState: TweakState;
}

function RecipeBody({
  selectedRecipe,
  changedIngredients = new Set(),
  changedSteps = new Set(),
  deletedIngredients = new Set(),
  deletedSteps = new Set(),
  originalRecipe,
  tweakState,
}: RecipeBodyProps) {
  const [servings, setServings] = useState<number>(selectedRecipe.baseServings ?? 2);
  const baseServings = selectedRecipe.baseServings || 2;
  const ingredients = (selectedRecipe.ingredients || []) as RecipeIngredient[];
  const origIngredients = (originalRecipe?.ingredients || []) as RecipeIngredient[];
  const origSteps = (originalRecipe?.steps || []) as RecipeStep[];
  const prep = (selectedRecipe.prep ?? []) as string[];
  const steps = (selectedRecipe.steps || []) as RecipeStep[];
  const scale = servings / baseServings;

  const showHighlights = tweakState === "streaming" || tweakState === "preview" || tweakState === "saved";

  return (
    <>
      {/* Hero strip */}
      <div
        className="relative h-[180px] sm:h-[260px] border-b border-border flex items-end overflow-hidden"
        style={
          !selectedRecipe.imageUrl
            ? { background: "linear-gradient(135deg, oklch(0.55 0.13 35) 0%, oklch(0.42 0.10 30) 100%)" }
            : undefined
        }
      >
        {selectedRecipe.imageUrl ? (
          <Image
            src={selectedRecipe.imageUrl}
            alt={selectedRecipe.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 900px"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, oklch(1 0 0 / 0.04) 0 12px, transparent 12px 24px)",
            }}
          />
        )}
        <div
          className="relative w-full px-4 sm:px-9 pt-6 pb-5 text-white"
          style={{ background: "linear-gradient(to top, oklch(0 0 0 / 0.5), transparent)" }}
        >
          {selectedRecipe.tags && selectedRecipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {selectedRecipe.tags.map((tag, i) => (
                <span
                  key={`${tag}-${i}`}
                  className="text-[10.5px] font-semibold tracking-wide px-[9px] py-[3px] rounded-full text-white border border-white/35 bg-white/[0.18] backdrop-blur-[4px]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <h1
            className="font-display font-semibold text-[28px] sm:text-[36px] leading-none tracking-tight m-0"
            style={{ textShadow: "0 2px 8px oklch(0 0 0 / 0.3)" }}
          >
            {selectedRecipe.name}
          </h1>
        </div>
        {selectedRecipe.imageUrl &&
          selectedRecipe.photographerName &&
          selectedRecipe.photographerUrl && (
            <a
              href={selectedRecipe.photographerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-2 right-3 font-sans text-[10px] text-white/70 hover:text-white transition-colors leading-none"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
            >
              Photo by {selectedRecipe.photographerName}
            </a>
          )}
      </div>

      {/* Body */}
      <div className="px-4 sm:px-9 py-7 pb-12">
        {/* From Ah Mah */}
        {selectedRecipe.description && (
          <div className="flex gap-3.5 items-start mb-6 pb-5 border-b border-dashed border-border">
            <div className="relative w-10 h-10 shrink-0">
              <Image src="/granny-icon.png" alt="" fill className="object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-sans text-[10.5px] font-bold tracking-[0.16em] uppercase text-ink-faint mb-1 flex items-center gap-2">
                From Ah Mah
                {tweakState === "saved" && (
                  <span className="text-emerald-600 tracking-[0.14em]">· tweaked just now</span>
                )}
              </div>
              <div className="font-display italic text-[15px] sm:text-base text-foreground leading-[1.5] max-w-prose">
                {selectedRecipe.description}
              </div>

            </div>
          </div>
        )}

        {/* Stat row — total time */}
        {selectedRecipe.totalTimeMinutes && (
          <div className="flex flex-wrap items-end gap-3 mb-7">
            <div className="flex flex-col px-3.5 py-2 bg-card border border-border rounded-lg shadow-[0_1px_0_var(--color-border-soft)] min-w-[78px]">
              <span className="font-sans text-[9.5px] font-bold tracking-[0.16em] uppercase text-ink-faint">
                Total time
              </span>
              <span className="font-display font-semibold text-[18px] text-foreground tabular-nums mt-0.5">
                {formatTime(selectedRecipe.totalTimeMinutes)}
              </span>
            </div>
          </div>
        )}

        {/* Ingredients — header inline with servings stepper */}
        {ingredients.length > 0 && (
          <section className="mb-9">
            <div className="flex items-center justify-between mb-1 gap-3">
              <h2 className="font-display font-semibold text-[24px] sm:text-[26px] text-foreground tracking-tight m-0">
                What to gather
              </h2>
              <ServingsStepper
                servings={servings}
                onDecrement={() => setServings((s) => Math.max(1, s - 1))}
                onIncrement={() => setServings((s) => s + 1)}
              />
            </div>
            <ul className="list-none p-0 mt-2 border-t border-border">
              {ingredients.map((ing, i) => {
                const scaled = ing.amount != null ? ing.amount * scale : undefined;
                const isChanged = showHighlights && changedIngredients.has(i);
                return (
                  <li
                    key={i}
                    className={`flex items-baseline gap-3 py-2.5 border-b border-dashed border-border transition-colors ${
                      isChanged ? "bg-amber-50 dark:bg-amber-950/20 -mx-1 px-1 rounded" : ""
                    }`}
                  >
                    <span
                      className={`basis-20 sm:basis-24 shrink-0 text-[13px] text-foreground text-right ${
                        scaled != null
                          ? "font-mono font-semibold tabular-nums"
                          : "font-display italic text-muted-foreground"
                      }`}
                    >
                      {scaled != null
                        ? `${formatAmount(scaled)}${ing.unit ? ` ${ing.unit}` : ""}`
                        : "to taste"}
                    </span>
                    <span className="flex-1 font-display text-[15px] text-foreground leading-[1.4]">
                      {ing.name}
                    </span>
                  </li>
                );
              })}
              {/* Deleted ingredients — shown with strikethrough when tweaking */}
              {showHighlights &&
                Array.from(deletedIngredients).map((i) => {
                  const ing = origIngredients[i];
                  if (!ing) return null;
                  const scaled = ing.amount != null ? ing.amount * scale : undefined;
                  return (
                    <li
                      key={`deleted-ing-${i}`}
                      className="flex items-baseline gap-3 py-2.5 border-b border-dashed border-border transition-colors line-through opacity-50"
                    >
                      <span
                        className={`basis-20 sm:basis-24 shrink-0 text-[13px] text-foreground text-right ${
                          scaled != null
                            ? "font-mono font-semibold tabular-nums"
                            : "font-display italic text-muted-foreground"
                        }`}
                      >
                        {scaled != null
                          ? `${formatAmount(scaled)}${ing.unit ? ` ${ing.unit}` : ""}`
                          : "to taste"}
                      </span>
                      <span className="flex-1 font-display text-[15px] text-foreground leading-[1.4]">
                        {ing.name}
                      </span>
                    </li>
                  );
                })}
            </ul>
          </section>
        )}

        {/* Before you start — mise en place */}
        {prep.length > 0 && (
          <section className="mb-9">
            <h2 className="font-display font-semibold text-[24px] sm:text-[26px] text-foreground tracking-tight mb-4">
              Before you start
            </h2>
            <ul className="list-none p-0 flex flex-col">
              {prep.map((item, i) => (
                <li
                  key={i}
                  className="flex gap-3 items-baseline py-2 border-b border-dashed border-border"
                >
                  <span className="font-mono text-[13px] font-bold text-ink-faint tabular-nums shrink-0 w-5 text-right">
                    ·
                  </span>
                  <span className="flex-1 font-display text-[15px] text-foreground leading-[1.45]">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Method */}
        <section>
          <h2 className="font-display font-semibold text-[24px] sm:text-[26px] text-foreground tracking-tight mb-4">
            Method
          </h2>
          {steps.length > 0 ? (
            <ol className="list-none p-0 flex flex-col gap-5">
              {steps.map((step, i) => {
                const isChanged = showHighlights && changedSteps.has(i);
                return (
                  <li
                    key={i}
                    className={`flex gap-4 transition-colors ${
                      isChanged ? "bg-amber-50 dark:bg-amber-950/20 -mx-1 px-1 rounded-lg py-1" : ""
                    }`}
                  >
                    <span className="font-mono text-[13px] font-bold text-ink-faint tabular-nums pt-0.5 shrink-0 w-5 text-right">
                      {i + 1}.
                    </span>
                    <div className="flex-1">
                      {step.title && (
                        <div className="font-display font-semibold text-[15px] text-foreground mb-0.5">
                          {step.title}
                        </div>
                      )}
                      <div className="font-sans text-[14px] text-foreground leading-[1.6]">
                        {step.body}
                      </div>
                      {step.tip && (
                        <div className="mt-1.5 text-[12.5px] text-ink-faint italic">{step.tip}</div>
                      )}
                    </div>
                  </li>
                );
              })}
              {/* Deleted steps — shown with strikethrough when tweaking */}
              {showHighlights &&
                Array.from(deletedSteps).map((i) => {
                  const step = origSteps[i];
                  if (!step) return null;
                  return (
                    <li
                      key={`deleted-step-${i}`}
                      className="flex gap-4 transition-colors line-through opacity-50"
                    >
                      <span className="font-mono text-[13px] font-bold text-ink-faint tabular-nums pt-0.5 shrink-0 w-5 text-right">
                        {i + 1}.
                      </span>
                      <div className="flex-1">
                        {step.title && (
                          <div className="font-display font-semibold text-[15px] text-foreground mb-0.5">
                            {step.title}
                          </div>
                        )}
                        <div className="font-sans text-[14px] text-foreground leading-[1.6]">
                          {step.body}
                        </div>
                      </div>
                    </li>
                  );
                })}
            </ol>
          ) : (
            <div className="recipe-prose">
              <Streamdown>{extractInstructions(selectedRecipe.instructions || "")}</Streamdown>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

// ─── Workshop card (Direction B — floating, not sticky) ──────────────────────

const TweakIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="shrink-0">
    <path
      d="M3 10.5 L8.5 5 L11 7.5 L5.5 13 H3 V10.5 Z M8.5 5 L10 3.5 L12.5 6 L11 7.5"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

interface WorkshopCardProps {
  tweakState: TweakState;
  instruction: string;
  totalChanges: number;
  onInstructionChange: (v: string) => void;
  onSend: (prompt?: string) => void;
  onDismiss: () => void;
  onSave: () => void;
  onTryAgain: () => void;
  onDiscard: () => void;
  isSaving: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

function WorkshopCard({
  tweakState,
  instruction,
  totalChanges,
  onInstructionChange,
  onSend,
  onDismiss,
  onSave,
  onTryAgain,
  onDiscard,
  isSaving,
  inputRef,
}: WorkshopCardProps) {
  if (tweakState !== "open" && tweakState !== "streaming" && tweakState !== "preview") {
    return null;
  }

  return (
    <div
      className="absolute inset-x-4 sm:inset-x-6 bottom-4 sm:bottom-5 max-w-3xl mx-auto bg-card border border-border rounded-2xl shadow-[0_24px_48px_-20px_oklch(0_0_0/0.35),0_1px_0_var(--color-border-soft)] z-40 overflow-hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="p-3.5 sm:p-4">
        {/* State 2 — open */}
        {tweakState === "open" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-[7px] bg-primary/8 border border-primary/40 text-primary inline-flex items-center justify-center">
                  <TweakIcon />
                </div>
                <div>
                  <div className="font-display italic font-semibold text-[15px] text-foreground tracking-tight leading-none">
                    Tweak workshop
                  </div>
                  <div className="font-sans text-[11px] text-ink-faint mt-0.5">
                    Describe a change. Ah Mah will rewrite the recipe.
                  </div>
                </div>
              </div>
              <button
                onClick={onDismiss}
                aria-label="Dismiss"
                className="w-7 h-7 inline-flex items-center justify-center border border-border rounded-full text-[11px] text-muted-foreground hover:bg-muted/60 transition-colors cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>
            {/* Quick-tweak chips */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {QUICK_TWEAKS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => onSend(chip)}
                  className="px-2.5 py-1 text-[11px] font-medium text-muted-foreground bg-background border border-border/70 rounded-full cursor-pointer hover:bg-muted/60 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
            {/* Input row */}
            <div className="flex items-center gap-2.5 px-4 py-2 bg-background border border-border rounded-full shadow-[0_1px_0_var(--color-border-soft),0_8px_24px_-16px_oklch(0_0_0/0.15)]">
              <TweakIcon />
              <input
                ref={inputRef}
                value={instruction}
                onChange={(e) => onInstructionChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSend();
                }}
                placeholder="e.g. less spicy, add cucumber for crunch…"
                className="flex-1 bg-transparent border-none outline-none text-[13.5px] text-foreground placeholder:text-muted-foreground font-sans"
              />
              <button
                onClick={() => onSend()}
                disabled={!instruction.trim()}
                aria-label="Send"
                className={`w-8 h-8 rounded-full inline-flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                  instruction.trim()
                    ? "bg-primary border border-primary/80 text-primary-foreground shadow-[0_1px_0_oklch(0.46_0.135_35)] hover:opacity-90"
                    : "bg-muted border border-border text-muted-foreground cursor-not-allowed"
                }`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M3 12 L21 4 L13 21 L11 13 Z" fill="currentColor" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* State 3 — streaming */}
        {tweakState === "streaming" && (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="inline-flex items-center gap-2 font-sans text-[12px] font-semibold text-primary">
                <span className="inline-flex gap-[3px]">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-[5px] h-[5px] rounded-full bg-primary"
                      style={{ animation: `tweakDot 1.2s ease-in-out ${i * 0.15}s infinite` }}
                    />
                  ))}
                </span>
                Ah Mah is rewriting…
              </div>
            </div>
            <div className="px-3 py-2 bg-primary/5 border border-dashed border-primary/40 rounded-lg font-display italic text-[13px] text-primary">
              &ldquo;{instruction}&rdquo;
            </div>
          </div>
        )}

        {/* State 4 — preview ready */}
        {tweakState === "preview" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-display italic font-semibold text-[15px] text-foreground tracking-tight leading-none">
                  Preview ready
                  {totalChanges > 0 && (
                    <span className="font-sans not-italic font-normal text-[12px] text-ink-faint ml-2">
                      — {totalChanges} change{totalChanges !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="font-sans text-[11px] text-ink-faint mt-1">
                  &ldquo;{instruction}&rdquo;
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 flex-wrap">
              <button
                onClick={onDiscard}
                className="px-3 py-2 text-[12px] font-semibold tracking-[0.14em] uppercase text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              >
                Discard
              </button>
              <button
                onClick={onTryAgain}
                className="px-3.5 py-2 text-[12.5px] font-semibold text-foreground bg-background border border-border rounded-lg cursor-pointer hover:bg-muted/60 transition-colors"
              >
                Tweak again
              </button>
              <button
                onClick={onSave}
                disabled={isSaving}
                className="px-4 py-2 text-[13px] font-semibold text-primary-foreground bg-primary border border-primary rounded-lg shadow-[0_1px_0_oklch(0.46_0.135_35)] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60"
              >
                {isSaving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── RecipeDisplay ───────────────────────────────────────────────────────────

interface RecipeDisplayProps {
  recipe: RecipeWithId;
  onBack: () => void;
  onStartCooking?: () => void;
  hideBackButton?: boolean;
}

export default function RecipeDisplay({
  recipe,
  onBack,
  onStartCooking,
  hideBackButton,
}: RecipeDisplayProps) {
  const { userId } = useSessionContext();
  const [cooking, setCooking] = useState(false);

  // ── Tweak state ────────────────────────────────────────────────────────────
  const [tweakState, setTweakState] = useState<TweakState>("resting");
  const [instruction, setInstruction] = useState("");
  const [tweakedRecipe, setTweakedRecipe] = useState<RecipeWithId>(recipe);
  const [isSaving, setIsSaving] = useState(false);
  const originalRecipeRef = useRef<RecipeWithId>(recipe);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const steps = (tweakedRecipe.steps ?? []) as RecipeStep[];
  const canCook = steps.length > 0;

  // Compute changed fields (memoised — only recalculates when the recipes change)
  const { ingredients: changedIngredients, steps: changedSteps, deletedIngredients, deletedSteps } = useMemo(
    () => diffRecipes(originalRecipeRef.current, tweakedRecipe),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tweakedRecipe],
  );

  const totalChanges = changedIngredients.size + changedSteps.size + deletedIngredients.size + deletedSteps.size;

  // ── Handlers ───────────────────────────────────────────────────────────────

  // Reset tweak state when the recipe changes (e.g. navigating to a different recipe)
  useEffect(() => {
    setTweakedRecipe(recipe);
    originalRecipeRef.current = recipe;
    setTweakState("resting");
    setIsSaving(false);
    setInstruction("");
  }, [recipe.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus the input whenever the tweak bar opens
  useEffect(() => {
    if (tweakState === "open") inputRef.current?.focus();
  }, [tweakState]);

  const openTweak = useCallback(() => {
    setTweakState("open");
  }, []);

  const dismissTweak = useCallback(() => {
    setTweakState("resting");
    setInstruction("");
    setTweakedRecipe(originalRecipeRef.current);
  }, []);

  const sendTweak = useCallback(
    async (prompt?: string) => {
      const p = (prompt ?? instruction).trim();
      if (!p) return;

      const finalInstruction = prompt ?? instruction;
      setInstruction(finalInstruction);
      setTweakState("streaming");

      try {
        const res = await fetch(`/api/recipe/${recipe.id}/tweak`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, instruction: p, recipe: originalRecipeRef.current }),
        });

        if (!res.ok || !res.body) {
          throw new Error("Tweak request failed");
        }

        // Read the stream and accumulate
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        let parsedAtLeastOnce = false;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            accumulated += decoder.decode(value, { stream: true });

            // Try to parse accumulated text as JSON progressively
            try {
              const parsed = JSON.parse(accumulated);
              // Map RecipeBlock → RecipeWithId (carry over the id and image fields)
              const updatedRecipe: RecipeWithId = {
                ...originalRecipeRef.current,
                name: parsed.title ?? originalRecipeRef.current.name,
                description: parsed.description ?? originalRecipeRef.current.description,
                totalTimeMinutes: parsed.totalTimeMinutes ?? originalRecipeRef.current.totalTimeMinutes,
                baseServings: parsed.baseServings ?? originalRecipeRef.current.baseServings,
                ingredients: parsed.ingredients ?? originalRecipeRef.current.ingredients,
                prep: parsed.prep ?? originalRecipeRef.current.prep,
                steps: parsed.steps ?? originalRecipeRef.current.steps,
                tags: parsed.tags ?? originalRecipeRef.current.tags,
                instructions: originalRecipeRef.current.instructions,
              };
              setTweakedRecipe(updatedRecipe);
              parsedAtLeastOnce = true;
            } catch {
              // JSON not yet complete — keep accumulating
            }
          }
        } finally {
          reader.cancel().catch(() => {});
        }

        if (parsedAtLeastOnce) {
          setTweakState("preview");
        } else {
          // AI responded with non-JSON (e.g. refused the request) — surface an error
          toast.error("Ah Mah couldn't tweak this one. Try a different instruction?");
          setTweakState("open");
        }
      } catch (err) {
        console.error("[RecipeDisplay] tweak stream error:", err);
        toast.error("Aiyah, something went wrong. Try again?");
        setTweakState("open");
      }
    },
    [instruction, recipe.id, userId],
  );

  const tryAgain = useCallback(() => {
    setTweakedRecipe(originalRecipeRef.current);
    setInstruction("");
    setTweakState("open");
  }, []);

  const saveChanges = useCallback(async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      const recipeBlock = {
        title: tweakedRecipe.name,
        description: tweakedRecipe.description,
        totalTimeMinutes: tweakedRecipe.totalTimeMinutes,
        baseServings: tweakedRecipe.baseServings,
        ingredients: tweakedRecipe.ingredients,
        prep: tweakedRecipe.prep,
        steps: tweakedRecipe.steps,
        tags: tweakedRecipe.tags,
      };

      const res = await fetch(`/api/recipe/${recipe.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, recipe: recipeBlock }),
      });

      if (!res.ok) {
        throw new Error("Save failed");
      }

      // Update the original reference so future tweaks start from the saved version
      originalRecipeRef.current = tweakedRecipe;
      setTweakState("saved");
      toast.success("Recipe saved!");
    } catch (err) {
      console.error("[RecipeDisplay] save error:", err);
      toast.error("Couldn't save. Try again?");
    } finally {
      setIsSaving(false);
    }
  }, [recipe.id, tweakedRecipe, userId]);

  const discardChanges = useCallback(() => {
    setTweakedRecipe(originalRecipeRef.current);
    setInstruction("");
    setTweakState("resting");
  }, []);

  const tweakAgain = useCallback(() => {
    setInstruction("");
    setTweakState("open");
  }, []);

  const handleStartCooking = () => {
    if (onStartCooking) {
      onStartCooking();
    } else {
      setCooking(true);
    }
  };

  const hasWorkshopCard =
    tweakState === "open" || tweakState === "streaming" || tweakState === "preview";

  if (cooking) {
    return (
      <CookingMode
        title={recipe.name}
        steps={steps}
        prep={(recipe.prep ?? []) as string[]}
        onExit={() => setCooking(false)}
      />
    );
  }

  return (
    <>
      {/* Dot animation keyframes */}
      <style>{`
        @keyframes tweakDot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.85); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div className="flex flex-col h-full relative">
        <div className={`flex-1 overflow-y-auto ${hasWorkshopCard ? "pb-52" : "pb-24"}`}>
          <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-4 sm:pt-5 pb-8">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              {!hideBackButton && (
                <button
                  onClick={onBack}
                  className="min-h-11 inline-flex items-center font-sans text-[11.5px] font-semibold tracking-[0.14em] uppercase text-ink-faint hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Back to cookbook"
                >
                  ← Back to cookbook
                </button>
              )}
              {canCook && (
                <button
                  onClick={handleStartCooking}
                  className="inline-flex items-center gap-1.5 min-h-11 px-3 py-1.5 text-[12.5px] font-semibold text-primary-foreground bg-primary border border-primary rounded-md cursor-pointer shadow-[0_1px_0_oklch(0.46_0.135_35)] hover:opacity-90 transition-opacity"
                  aria-label="Start cooking — step-by-step view with screen stay-on"
                >
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                    <path d="M5 3l8 5-8 5V3z" fill="currentColor" />
                  </svg>
                  Start cooking
                </button>
              )}
            </div>
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-[0_1px_0_var(--color-border-soft)]">
              <RecipeBody
                selectedRecipe={tweakedRecipe}
                changedIngredients={changedIngredients}
                changedSteps={changedSteps}
                deletedIngredients={deletedIngredients}
                deletedSteps={deletedSteps}
                originalRecipe={originalRecipeRef.current}
                tweakState={tweakState}
              />
            </div>
          </div>
        </div>

        {/* Direction B — floating pill (resting / saved) */}
        {(tweakState === "resting" || tweakState === "saved") && (
          <button
            onClick={openTweak}
            className="absolute right-5 bottom-5 inline-flex items-center gap-2 px-[18px] py-[11px] font-sans text-[13px] font-semibold text-primary-foreground bg-primary border border-primary/80 rounded-full cursor-pointer shadow-[0_12px_32px_-10px_oklch(0_0_0/0.35),0_1px_0_oklch(0.46_0.135_35),inset_0_1px_0_oklch(0.65_0.13_38)] hover:opacity-90 transition-opacity z-40"
            style={{ bottom: "max(20px, env(safe-area-inset-bottom, 20px))" }}
          >
            <TweakIcon />
            Tweak this recipe
          </button>
        )}

        {/* Direction B — floating workshop card (open / streaming / preview) */}
        <WorkshopCard
          tweakState={tweakState}
          instruction={instruction}
          totalChanges={totalChanges}
          onInstructionChange={setInstruction}
          onSend={sendTweak}
          onDismiss={dismissTweak}
          onSave={saveChanges}
          onTryAgain={tryAgain}
          onDiscard={discardChanges}
          isSaving={isSaving}
          inputRef={inputRef}
        />
      </div>
    </>
  );
}
