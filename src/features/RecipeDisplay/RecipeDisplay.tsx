"use client";

import { useSessionContext } from "@/contexts/SessionContext";
import { CookingMode, ServingsStepper } from "@/features/Recipe";
import {
  type ChangeEntry,
  type RecipeIngredient,
  type RecipeStep,
  type RecipeWithId,
  recipeWithIdToBlock,
} from "@/lib/recipes/schemas";
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

  const addedOrChangedNames = new Set(
    changes
      .filter((c) => c.kind === "ingredient_added" || c.kind === "ingredient_changed")
      .map((c) => String(c.ref)),
  );
  workingDraft.ingredients.forEach((ing, i) => {
    if (addedOrChangedNames.has(ing.name)) changedIngredients.add(i);
  });

  const removedNames = new Set(
    changes
      .filter((c) => c.kind === "ingredient_removed")
      .map((c) => String(c.ref)),
  );
  original.ingredients.forEach((ing, i) => {
    if (removedNames.has(ing.name)) deletedIngredients.add(i);
  });

  changes
    .filter((c) => c.kind === "step_replaced" || c.kind === "step_added")
    .forEach((c) => {
      const idx = Number(c.ref);
      if (!isNaN(idx)) changedSteps.add(idx);
    });

  changes
    .filter((c) => c.kind === "step_removed")
    .forEach((c) => {
      const idx = Number(c.ref);
      if (!isNaN(idx)) deletedSteps.add(idx);
    });

  return { changedIngredients, deletedIngredients, changedSteps, deletedSteps };
}

// ─── RecipeBody ──────────────────────────────────────────────────────────────

interface RecipeBodyProps {
  selectedRecipe: RecipeWithId;
  changedIngredients?: Set<number>;
  changedSteps?: Set<number>;
  deletedIngredients?: Set<number>;
  deletedSteps?: Set<number>;
  originalRecipe?: RecipeWithId;
  showHighlights?: boolean;
}

function RecipeBody({
  selectedRecipe,
  changedIngredients = new Set(),
  changedSteps = new Set(),
  deletedIngredients = new Set(),
  deletedSteps = new Set(),
  originalRecipe,
  showHighlights = false,
}: RecipeBodyProps) {
  const [servings, setServings] = useState<number>(
    selectedRecipe.baseServings ?? 2,
  );
  const baseServings = selectedRecipe.baseServings || 2;
  const ingredients = (selectedRecipe.ingredients || []) as RecipeIngredient[];
  const origIngredients = (originalRecipe?.ingredients || []) as RecipeIngredient[];
  const origSteps = (originalRecipe?.steps || []) as RecipeStep[];
  const prep = (selectedRecipe.prep ?? []) as string[];
  const steps = (selectedRecipe.steps || []) as RecipeStep[];
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
              <Image
                src="/granny-icon.png"
                alt=""
                fill
                className="object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-sans text-[10.5px] font-bold tracking-[0.16em] uppercase text-ink-faint mb-1">
                From Ah Mah
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

        {/* Ingredients */}
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
                const scaled =
                  ing.amount != null ? ing.amount * scale : undefined;
                const isChanged = showHighlights && changedIngredients.has(i);
                return (
                  <li
                    key={i}
                    className={`flex items-baseline gap-3 py-2.5 border-b border-dashed border-border transition-colors ${
                      isChanged
                        ? "bg-amber-50 dark:bg-amber-950/20 -mx-1 px-1 rounded"
                        : ""
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
                      isChanged
                        ? "bg-amber-50 dark:bg-amber-950/20 -mx-1 px-1 rounded-lg py-1"
                        : ""
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
                        <div className="mt-1.5 text-[12.5px] text-ink-faint italic">
                          {step.tip}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
              {/* Deleted steps */}
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
              <Streamdown>
                {extractInstructions(selectedRecipe.instructions || "")}
              </Streamdown>
            </div>
          )}
        </section>
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
}

export default function RecipeDisplay({
  recipe,
  onBack,
  onStartCooking,
  hideBackButton,
}: RecipeDisplayProps) {
  const { userId } = useSessionContext();
  const [cooking, setCooking] = useState(false);

  // ── Bench state ────────────────────────────────────────────────────────────
  const [benchOpen, setBenchOpen] = useState(false);
  const [workingDraft, setWorkingDraft] = useState<RecipeWithId>(recipe);
  const [changes, setChanges] = useState<ChangeEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const originalRecipeRef = useRef<RecipeWithId>(recipe);

  const steps = (workingDraft.steps ?? []) as RecipeStep[];
  const canCook = steps.length > 0;

  // Derive diff overlay sets from the model's change list
  const { changedIngredients, deletedIngredients, changedSteps, deletedSteps } =
    useMemo(
      () => changesToDiff(changes, workingDraft, originalRecipeRef.current),
      [changes, workingDraft],
    );

  const showHighlights = changes.length > 0;

  // Reset when navigating to a different recipe
  useEffect(() => {
    originalRecipeRef.current = recipe;
    setWorkingDraft(recipe);
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
      toast.success("Recipe saved!");
    } catch (err) {
      console.error("[RecipeDisplay] save error:", err);
      toast.error("Couldn't save. Try again?");
    } finally {
      setIsSaving(false);
    }
  }, [recipe.id, userId, workingDraft]);

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
      `}</style>

      <div className="flex h-full overflow-hidden">
        {/* Recipe panel */}
        <div className="flex flex-col flex-1 min-w-0 relative h-full">
          <div className="flex-1 overflow-y-auto pb-24">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-4 sm:pt-5 pb-8">
              {/* Nav bar */}
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
                <div className="flex items-center gap-2 ml-auto">
                  {!benchOpen && (
                    <button
                      onClick={() => setBenchOpen(true)}
                      className="inline-flex items-center gap-1.5 min-h-11 px-3 py-1.5 text-[12.5px] font-semibold text-primary bg-card border border-border rounded-md cursor-pointer hover:bg-muted/60 transition-colors"
                      aria-label="Tweak this recipe"
                    >
                      <TweakIcon />
                      Tweak this recipe
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
              </div>

              {/* Recipe card */}
              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-[0_1px_0_var(--color-border-soft)]">
                <RecipeBody
                  selectedRecipe={workingDraft}
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
        {benchOpen && userId && (
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
