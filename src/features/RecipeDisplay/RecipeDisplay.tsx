"use client";

import { Button } from "@/components/ui/button";
import { useSessionContext } from "@/contexts/SessionContext";
import { SignInDialog } from "@/features/Auth/SignInDialog";
import { CookingMode, ServingsStepper, formatRecipeAsText } from "@/features/Recipe";
import { ShareRecipeModal } from "./components/ShareRecipeModal";
import {
  CookedCheckbox,
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
import { hasSeenSignInNudge, markSignInNudgeSeen } from "@/lib/signInNudge";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { TweakBench } from "./TweakBench";

// Deferred: streamdown pulls in katex (~253 kB parsed, ADR-0019) that recipe
// instructions never need, so load it after the shell renders instead of
// shipping it in the initial bundle.
const Streamdown = dynamic(() => import("@/lib/markdown/streamdownLoader"));

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
  // Cooked marker (ADR-0020) — omitted when the viewer can't persist it
  // (public share view, guests).
  cooked?: boolean;
  onCookedChange?: (cooked: boolean) => void;
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
  cooked = false,
  onCookedChange,
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
                    ratio={scale}
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

        {/* Cooked marker — a quiet end-cap, out of the reading path (ADR-0020) */}
        {onCookedChange && (
          <div className="mt-9 pt-6 border-t border-dashed border-border">
            <CookedCheckbox cooked={cooked} onChange={onCookedChange} />
          </div>
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
  const { userId, isAuthenticated } = useSessionContext();
  const { mutate } = useSWRConfig();
  const [cooking, setCooking] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
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
    setShareOpen(false);
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

  const handleCookedChange = useCallback(
    async (nextCooked: boolean) => {
      if (!userId) return;
      const prevDraft = workingDraft;
      // Base the PATCH on the last *confirmed* server state, not the live
      // (possibly-unsaved) Tweak Bench draft — the cooked marker is an
      // independent, reversible action (ADR-0020) and must not persist
      // in-progress bench edits as a side effect.
      const confirmedBase = originalRecipeRef.current;
      // Optimistic — the checkbox flips instantly; revert if the save fails.
      // Don't touch originalRecipeRef (the bench's revert/diff baseline) until
      // the save is confirmed.
      setWorkingDraft({ ...prevDraft, cooked: nextCooked });
      try {
        const res = await fetch(`/api/recipe/${recipe.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipe: { ...recipeWithIdToBlock(confirmedBase), cooked: nextCooked },
          }),
        });

        if (!res.ok) throw new Error("Save failed");

        originalRecipeRef.current = { ...confirmedBase, cooked: nextCooked };
        mutate(`/api/recipe?userId=${userId}`);
        if (nextCooked) {
          if (!isAuthenticated && !hasSeenSignInNudge("finish-moment")) {
            markSignInNudgeSeen("finish-moment");
            toast.success(
              "Marked as made — nice one. Sign in and your kitchen follows you, wherever you cook next.",
              { action: { label: "Sign in", onClick: () => setSignInOpen(true) } },
            );
          } else {
            toast.success("Marked as made — nice one.");
          }
        }
      } catch (err) {
        console.error("[RecipeDisplay] cooked-toggle error:", err);
        setWorkingDraft(prevDraft);
        toast.error("Couldn't save that. Try again?");
      }
    },
    [recipe.id, userId, workingDraft, mutate, isAuthenticated],
  );

  const handleCopyRecipe = useCallback(() => {
    const text = formatRecipeAsText(recipeWithIdToBlock(workingDraft), servings);
    navigator.clipboard.writeText(text).then(
      () => toast.success("Recipe copied — paste it anywhere."),
      () => toast.error("Couldn't copy — try again?"),
    );
  }, [workingDraft, servings]);

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
        cooked={!!workingDraft.cooked}
        onCookedChange={handleCookedChange}
        servingsRatio={servings / (recipe.baseServings || 2)}
      />
    );
  }

  return (
    <>
      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
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
                    className="hidden lg:inline-flex min-h-11 items-center gap-1.5 font-sans text-micro font-semibold tracking-[0.14em] uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    aria-label="Back to cookbook"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="shrink-0"
                    >
                      <path
                        d="M8.5 3.5 4 8l4.5 4.5M4 8h8"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Back to cookbook
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
                      onClick={() => setShareOpen(true)}
                      className="inline-flex items-center min-h-11 px-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      aria-label="Share recipe"
                      title="Share recipe"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                        <path
                          d="M9.5 3.2 13 6.5 9.5 9.8"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                        <path
                          d="M12.7 6.5H8.2C5.6 6.5 3.5 8.6 3.5 11.2V12"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          fill="none"
                        />
                      </svg>
                    </button>
                  )}
                  {!benchOpen && !readOnly && (
                    <button
                      onClick={() => setBenchOpen(true)}
                      className="inline-flex items-center justify-center gap-1.5 min-h-11 px-2 sm:px-3 sm:py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors text-muted-foreground hover:text-foreground sm:text-primary sm:hover:text-primary sm:bg-card sm:border sm:border-border sm:hover:bg-muted/60"
                      aria-label="Tweak this recipe"
                    >
                      <TweakIcon size={16} />
                      <span className="hidden sm:inline">Tweak this recipe</span>
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
                  cooked={!!workingDraft.cooked}
                  onCookedChange={!readOnly && userId ? handleCookedChange : undefined}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tweak Bench — right panel */}
        {benchOpen && userId && !readOnly && (
          <TweakBench
            recipe={originalRecipeRef.current}
            onWorkingDraftChange={handleWorkingDraftChange}
            onClose={handleBenchClose}
            onSave={handleSave}
            isSaving={isSaving}
          />
        )}
      </div>

      {!readOnly && userId && (
        <ShareRecipeModal key={recipe.id} recipe={recipe} open={shareOpen} onOpenChange={setShareOpen} />
      )}
    </>
  );
}

// ─── TweakIcon (shared with TweakBench header) ───────────────────────────────

function TweakIcon({ size = 13 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
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
