"use client";

import { Button } from "@/components/ui/button";
import { useSessionContext } from "@/contexts/SessionContext";
import { CookingMode, ServingsStepper, formatRecipeAsText } from "@/features/Recipe";
import {
  DottedList,
  Eyebrow,
  SectionHeading,
  StepItem,
} from "@/features/shared/components/recipe";
import {
  type ChangeEntry,
  type RecipeIngredient,
  type RecipeStep,
  type RecipeWithId,
  recipeWithIdToBlock,
} from "@/lib/recipes/schemas";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { TweakBench } from "./TweakBench";

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

// ─── Diff overlay (derived from model change list) ───────────────────────────

function changesToDiff(
  changes: ChangeEntry[],
  workingDraft: RecipeWithId,
  original: RecipeWithId,
) {
  const changedIngredients = new Set<number>();
  const deletedIngredients = new Set<number>();
  const changedSteps = new Set<number>();
  const deletedSteps = new Set<number>();

  if (!changes.length) return { changedIngredients, deletedIngredients, changedSteps, deletedSteps };

  changes.forEach((change) => {
    const ref = change.ref;
    if (!ref) return;

    if (
      ref.type === "ingredient" &&
      ref.basis === "workingDraft" &&
      ref.index < workingDraft.ingredients.length &&
      (change.kind === "ingredient_added" || change.kind === "ingredient_changed")
    ) {
      changedIngredients.add(ref.index);
      return;
    }

    if (
      ref.type === "ingredient" &&
      ref.basis === "original" &&
      ref.index < original.ingredients.length &&
      change.kind === "ingredient_removed"
    ) {
      deletedIngredients.add(ref.index);
      return;
    }

    if (
      ref.type === "step" &&
      ref.basis === "workingDraft" &&
      ref.index < (workingDraft.steps?.length ?? 0) &&
      (change.kind === "step_added" || change.kind === "step_replaced")
    ) {
      changedSteps.add(ref.index);
      return;
    }

    if (
      ref.type === "step" &&
      ref.basis === "original" &&
      ref.index < (original.steps?.length ?? 0) &&
      change.kind === "step_removed"
    ) {
      deletedSteps.add(ref.index);
    }
  });

  return { changedIngredients, deletedIngredients, changedSteps, deletedSteps };
}

// ─── RecipeBody ──────────────────────────────────────────────────────────────

interface RecipeBodyProps {
  selectedRecipe: RecipeWithId;
  servings: number;
  onServingsChange: (next: number) => void;
  changedIngredients?: Set<number>;
  changedSteps?: Set<number>;
  deletedIngredients?: Set<number>;
  deletedSteps?: Set<number>;
  originalRecipe?: RecipeWithId;
  showHighlights?: boolean;
}

function RecipeBody({
  selectedRecipe,
  servings,
  onServingsChange,
  changedIngredients = new Set(),
  changedSteps = new Set(),
  deletedIngredients = new Set(),
  deletedSteps = new Set(),
  originalRecipe,
  showHighlights = false,
}: RecipeBodyProps) {
  const baseServings = selectedRecipe.baseServings || 2;
  const ingredients = (selectedRecipe.ingredients || []) as RecipeIngredient[];
  const origIngredients = (originalRecipe?.ingredients || []) as RecipeIngredient[];
  const origSteps = (originalRecipe?.steps || []) as RecipeStep[];
  const prep = (selectedRecipe.prep ?? []) as string[];
  const steps = (selectedRecipe.steps || []) as RecipeStep[];
  const notes = (selectedRecipe.notes ?? []) as string[];
  const scale = servings / baseServings;

  return (
    <>
      {/* Hero strip */}
      <div
        className="relative h-[180px] sm:h-[260px] border-b border-border flex items-end overflow-hidden"
        style={
          !selectedRecipe.imageUrl
            ? {
                background:
                  "linear-gradient(135deg, oklch(0.55 0.13 35) 0%, oklch(0.42 0.10 30) 100%)",
              }
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
          style={{
            background:
              "linear-gradient(to top, oklch(0 0 0 / 0.5), transparent)",
          }}
        >
          {selectedRecipe.tags && selectedRecipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {selectedRecipe.tags.map((tag, i) => (
                <span
                  key={`${tag}-${i}`}
                  className="text-eyebrow font-semibold tracking-wide px-[9px] py-[3px] rounded-full text-white border border-white/35 bg-white/[0.18] backdrop-blur-[4px]"
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
              className="absolute bottom-2 right-3 font-sans text-eyebrow text-white/70 hover:text-white transition-colors leading-none"
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
              <Image
                src="/granny-icon.png"
                alt=""
                fill
                className="object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <Eyebrow className="block mb-1">From Ah Mah</Eyebrow>
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
              <Eyebrow>Total time</Eyebrow>
              <span className="font-display font-semibold text-[18px] text-foreground tabular-nums mt-0.5">
                {formatTime(selectedRecipe.totalTimeMinutes)}
              </span>
            </div>
          </div>
        )}

        {/* Ingredients */}
        {ingredients.length > 0 && (
          <section className="mb-9">
            <div className="flex items-center justify-between mb-1 gap-3">
              <SectionHeading>What to gather</SectionHeading>
              <ServingsStepper
                servings={servings}
                onDecrement={() => onServingsChange(Math.max(1, servings - 1))}
                onIncrement={() => onServingsChange(servings + 1)}
              />
            </div>
            <ul className="list-none p-0 mt-2 border-t border-border">
              {ingredients.map((ing, i) => {
                const scaled =
                  ing.amount != null ? ing.amount * scale : undefined;
                const isChanged = showHighlights && changedIngredients.has(i);
                return (
                  <li
                    key={i}
                    data-tweak-row={`ing-${i}`}
                    className={`flex items-baseline gap-3 py-2.5 border-b border-dashed border-border transition-colors ${
                      isChanged
                        ? "bg-amber-200/70 dark:bg-amber-900/30 ring-1 ring-inset ring-amber-400/60 dark:ring-amber-700/50 -mx-1 px-1 rounded"
                        : ""
                    }`}
                  >
                    <span
                      className={`basis-20 sm:basis-24 shrink-0 text-dense text-foreground text-right ${
                        scaled != null
                          ? "font-mono font-semibold tabular-nums"
                          : "font-display italic text-muted-foreground"
                      }`}
                    >
                      {scaled != null
                        ? `${formatAmount(scaled)}${ing.unit ? ` ${ing.unit}` : ""}`
                        : "to taste"}
                    </span>
                    <span className="flex-1 font-display text-emphasis text-foreground">
                      {ing.name}
                    </span>
                  </li>
                );
              })}
              {/* Deleted ingredients */}
              {showHighlights &&
                Array.from(deletedIngredients).map((i) => {
                  const ing = origIngredients[i];
                  if (!ing) return null;
                  const scaled =
                    ing.amount != null ? ing.amount * scale : undefined;
                  return (
                    <li
                      key={`deleted-ing-${i}`}
                      className="flex items-baseline gap-3 py-2.5 border-b border-dashed border-border transition-colors line-through opacity-50"
                    >
                      <span
                        className={`basis-20 sm:basis-24 shrink-0 text-dense text-foreground text-right ${
                          scaled != null
                            ? "font-mono font-semibold tabular-nums"
                            : "font-display italic text-muted-foreground"
                        }`}
                      >
                        {scaled != null
                          ? `${formatAmount(scaled)}${ing.unit ? ` ${ing.unit}` : ""}`
                          : "to taste"}
                      </span>
                      <span className="flex-1 font-display text-emphasis text-foreground">
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
            <SectionHeading className="mb-4">Before you start</SectionHeading>
            <DottedList items={prep} />
          </section>
        )}

        {/* Method */}
        <section>
          <SectionHeading className="mb-4">Method</SectionHeading>
          {steps.length > 0 ? (
            <ol className="list-none p-0 flex flex-col gap-5">
              {steps.map((step, i) => {
                const isChanged = showHighlights && changedSteps.has(i);
                return (
                  <StepItem
                    key={i}
                    as="li"
                    marker="quiet"
                    n={i + 1}
                    step={step}
                    data-tweak-row={`step-${i}`}
                    className={cn(
                      "transition-colors",
                      isChanged &&
                        "bg-amber-200/70 dark:bg-amber-900/30 ring-1 ring-inset ring-amber-400/60 dark:ring-amber-700/50 -mx-1 px-1 rounded-lg py-1",
                    )}
                  />
                );
              })}
              {/* Deleted steps — diff overlay, tip suppressed */}
              {showHighlights &&
                Array.from(deletedSteps).map((i) => {
                  const step = origSteps[i];
                  if (!step) return null;
                  return (
                    <StepItem
                      key={`deleted-step-${i}`}
                      as="li"
                      marker="quiet"
                      n={i + 1}
                      step={{ title: step.title, body: step.body }}
                      className="transition-colors line-through opacity-50"
                    />
                  );
                })}
            </ol>
          ) : (
            <div className="recipe-prose">
              <Streamdown>
                {extractInstructions(selectedRecipe.instructions || "")}
              </Streamdown>
            </div>
          )}
        </section>

        {/* Notes — whole-dish asides (make-ahead, storage, serving) */}
        {notes.length > 0 && (
          <section className="mt-9">
            <SectionHeading className="mb-4">Notes</SectionHeading>
            <DottedList items={notes} />
          </section>
        )}
      </div>
    </>
  );
}

// ─── RecipeDisplay ───────────────────────────────────────────────────────────

interface RecipeDisplayProps {
  recipe: RecipeWithId;
  onBack: () => void;
  onStartCooking?: () => void;
  hideBackButton?: boolean;
  // Public share view: hide every owner-only action (share, tweak, bench, back)
  // and the tweak panel. Copy stays — it's useful for whoever opens the link.
  readOnly?: boolean;
}

export default function RecipeDisplay({
  recipe,
  onBack,
  onStartCooking,
  hideBackButton,
  readOnly = false,
}: RecipeDisplayProps) {
  const { userId } = useSessionContext();
  const [cooking, setCooking] = useState(false);
  const [sharing, setSharing] = useState(false);
  // Lifted out of RecipeBody so the header "Copy recipe" action can read the
  // currently displayed servings and scale the copied text to match.
  const [servings, setServings] = useState<number>(recipe.baseServings ?? 2);

  // ── Bench state ────────────────────────────────────────────────────────────
  const [benchOpen, setBenchOpen] = useState(false);
  const [workingDraft, setWorkingDraft] = useState<RecipeWithId>(recipe);
  const [changes, setChanges] = useState<ChangeEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const originalRecipeRef = useRef<RecipeWithId>(recipe);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const steps = (workingDraft.steps ?? []) as RecipeStep[];
  const canCook = steps.length > 0;

  // Derive diff overlay sets from the model's change list
  const { changedIngredients, deletedIngredients, changedSteps, deletedSteps } =
    useMemo(
      () => changesToDiff(changes, workingDraft, originalRecipeRef.current),
      [changes, workingDraft],
    );

  const showHighlights = changes.length > 0;

  // Choreographed reveal (ADR-0010): the patch arrives whole, so after the
  // bench's change label appears we deliberately lead the eye to the recipe —
  // scroll the first changed row into view and pulse it. The cue points at the
  // exact row rather than re-flowing the document.
  useEffect(() => {
    if (!changes.length) return;
    const firstIng = Math.min(...changedIngredients, Infinity);
    const firstStep = Math.min(...changedSteps, Infinity);
    const selector =
      Number.isFinite(firstIng)
        ? `[data-tweak-row="ing-${firstIng}"]`
        : Number.isFinite(firstStep)
          ? `[data-tweak-row="step-${firstStep}"]`
          : null;
    if (!selector) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const timer = setTimeout(() => {
      const el = scrollRef.current?.querySelector<HTMLElement>(selector);
      if (!el) return;
      el.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "center",
      });
      el.classList.remove("tweak-pulse");
      void el.offsetWidth; // restart the animation if the same row changes again
      el.classList.add("tweak-pulse");
    }, 150);

    return () => clearTimeout(timer);
  }, [changes, changedIngredients, changedSteps]);

  // Reset when navigating to a different recipe
  useEffect(() => {
    originalRecipeRef.current = recipe;
    setWorkingDraft(recipe);
    setServings(recipe.baseServings ?? 2);
    setChanges([]);
    setBenchOpen(false);
    setIsSaving(false);
  }, [recipe.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleWorkingDraftChange = useCallback(
    (draft: RecipeWithId, newChanges: ChangeEntry[]) => {
      setWorkingDraft(draft);
      setChanges(newChanges);
    },
    [],
  );

  const handleBenchClose = useCallback(() => {
    setBenchOpen(false);
    setWorkingDraft(originalRecipeRef.current);
    setChanges([]);
  }, []);

  const handleSave = useCallback(async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/recipe/${recipe.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          recipe: recipeWithIdToBlock(workingDraft),
        }),
      });

      if (!res.ok) throw new Error("Save failed");

      originalRecipeRef.current = workingDraft;
      setBenchOpen(false);
      setChanges([]);
      toast.success("Saved — into your cookbook.");
    } catch (err) {
      console.error("[RecipeDisplay] save error:", err);
      toast.error("Couldn't save. Try again?");
    } finally {
      setIsSaving(false);
    }
  }, [recipe.id, userId, workingDraft]);

  const handleCopyRecipe = useCallback(() => {
    const text = formatRecipeAsText(recipeWithIdToBlock(workingDraft), servings);
    navigator.clipboard.writeText(text).then(
      () => toast.success("Recipe copied — paste it anywhere."),
      () => toast.error("Couldn't copy — try again?"),
    );
  }, [workingDraft, servings]);

  const handleShare = useCallback(async () => {
    if (!userId || sharing) return;
    setSharing(true);
    try {
      const res = await fetch(`/api/recipe/${recipe.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("share failed");
      const { token } = await res.json();
      const url = `${window.location.origin}/r/${token}`;
      await navigator.clipboard.writeText(url);
      toast.success("Link copied — anyone can open it.");
    } catch (err) {
      console.error("[RecipeDisplay] share error:", err);
      toast.error("Couldn't make a link. Try again?");
    } finally {
      setSharing(false);
    }
  }, [recipe.id, userId, sharing]);

  const handleStartCooking = () => {
    if (onStartCooking) {
      onStartCooking();
    } else {
      setCooking(true);
    }
  };

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
      {/* Dot animation for streaming indicator */}
      <style>{`
        @keyframes tweakDot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.85); }
          40% { opacity: 1; transform: scale(1); }
        }
        @keyframes tweakPulse {
          0%   { box-shadow: 0 0 0 0 oklch(0.78 0.16 75 / 0); }
          25%  { box-shadow: 0 0 0 4px oklch(0.78 0.16 75 / 0.55); }
          100% { box-shadow: 0 0 0 0 oklch(0.78 0.16 75 / 0); }
        }
        .tweak-pulse { animation: tweakPulse 1.1s ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .tweak-pulse { animation: none; }
        }
      `}</style>

      <div className="flex h-full overflow-hidden">
        {/* Recipe panel */}
        <div className="flex flex-col flex-1 min-w-0 relative h-full">
          <div ref={scrollRef} className="flex-1 overflow-y-auto pb-24">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-4 sm:pt-5 pb-8">
              {/* Nav bar */}
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                {!hideBackButton && !readOnly && (
                  <button
                    onClick={onBack}
                    className="min-h-11 inline-flex items-center font-sans text-micro font-semibold tracking-[0.14em] uppercase text-ink-faint hover:text-foreground transition-colors cursor-pointer"
                    aria-label="Back to cookbook"
                  >
                    ← Back to cookbook
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={handleCopyRecipe}
                    className="inline-flex items-center min-h-11 px-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    aria-label="Copy recipe"
                    title="Copy recipe"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                      <rect x="5" y="2" width="9" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                      <path d="M5 4H3.5A1.5 1.5 0 0 0 2 5.5v9A1.5 1.5 0 0 0 3.5 16h7A1.5 1.5 0 0 0 12 14.5V13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                  </button>
                  {!readOnly && userId && (
                    <button
                      onClick={handleShare}
                      disabled={sharing}
                      className="inline-flex items-center min-h-11 px-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
                      aria-label="Share recipe — copy a public link"
                      title="Share recipe"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                        <circle cx="12" cy="3.5" r="1.9" stroke="currentColor" strokeWidth="1.4" />
                        <circle cx="4" cy="8" r="1.9" stroke="currentColor" strokeWidth="1.4" />
                        <circle cx="12" cy="12.5" r="1.9" stroke="currentColor" strokeWidth="1.4" />
                        <path d="M10.4 4.5 5.6 7M5.6 9l4.8 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                  {!benchOpen && !readOnly && (
                    <button
                      onClick={() => setBenchOpen(true)}
                      className="inline-flex items-center gap-1.5 min-h-11 px-3 py-1.5 text-xs font-semibold text-primary bg-card border border-border rounded-md cursor-pointer hover:bg-muted/60 transition-colors"
                      aria-label="Tweak this recipe"
                    >
                      <TweakIcon />
                      Tweak this recipe
                    </button>
                  )}
                  {canCook && !readOnly && (
                    <Button
                      variant="cta"
                      onClick={handleStartCooking}
                      className="gap-1.5 min-h-11 px-3 py-1.5 text-xs font-semibold rounded-md"
                      aria-label="Start cooking — step-by-step view with screen stay-on"
                    >
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" className="size-[11px]">
                        <path d="M5 3l8 5-8 5V3z" fill="currentColor" />
                      </svg>
                      Start cooking
                    </Button>
                  )}
                </div>
              </div>

              {/* Recipe card */}
              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-[0_1px_0_var(--color-border-soft)]">
                <RecipeBody
                  selectedRecipe={workingDraft}
                  servings={servings}
                  onServingsChange={setServings}
                  changedIngredients={changedIngredients}
                  changedSteps={changedSteps}
                  deletedIngredients={deletedIngredients}
                  deletedSteps={deletedSteps}
                  originalRecipe={originalRecipeRef.current}
                  showHighlights={showHighlights}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tweak Bench — right panel */}
        {benchOpen && userId && !readOnly && (
          <TweakBench
            recipe={originalRecipeRef.current}
            userId={userId}
            onWorkingDraftChange={handleWorkingDraftChange}
            onClose={handleBenchClose}
            onSave={handleSave}
            isSaving={isSaving}
          />
        )}
      </div>
    </>
  );
}

// ─── TweakIcon (shared with TweakBench header) ───────────────────────────────

function TweakIcon() {
  return (
    <svg
      width="13"
      height="13"
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
