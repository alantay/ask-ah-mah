"use client";

import { useSessionContext } from "@/contexts/SessionContext";
import { InventoryItem } from "@/lib/inventory/schemas";

type GetInventoryResponse = {
  kitchenwareInventory: InventoryItem[];
  ingredientInventory: InventoryItem[];
};
import { Button } from "@/components/ui/button";
import { ingredientMatches } from "@/lib/recipes/matchIngredient";
import { RecipeBlock, RecipeIngredientModel } from "@/lib/recipes/schemas";
import { cn } from "@/lib/utils";
import { fetcher } from "@/lib/utils";
import { ShoppingCart, TimerIcon } from "lucide-react";
import { useState } from "react";
import { CookingMode, ServingsStepper } from "@/features/Recipe";
import { toast } from "sonner";
import useSWR, { useSWRConfig } from "swr";
import { ScaledNum, scaleAmount, formatRecipeAsText } from "@/features/Recipe";

export interface RecipeLetterProps {
  // Partial during progressive reveal — fields fill in as the JSON streams.
  recipe: Partial<RecipeBlock>;
  onSave?: (recipe: RecipeBlock) => void;
  isSaved?: boolean;
  onSend?: (text: string) => void;
  // While true the recipe is still streaming: arrays may be incomplete and all
  // interactivity (stepper, add-to-pantry, save, cook, shortfall) is suppressed.
  isStreaming?: boolean;
}


function NeedCartButton({
  ingredientName,
  onAdd,
  pending,
}: {
  ingredientName: string;
  onAdd: () => void;
  pending?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={pending}
      aria-label={`Add ${ingredientName} to pantry`}
      title={`Add ${ingredientName} to pantry`}
      className={cn(
        "shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full text-muted-foreground bg-transparent border border-border transition-colors",
        pending
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer hover:bg-muted hover:text-foreground",
      )}
    >
      <ShoppingCart className="w-3 h-3" strokeWidth={1.8} />
    </button>
  );
}

function ingredientHave(name: string, inventoryNames: string[]): boolean {
  return ingredientMatches(name, inventoryNames);
}

export function RecipeLetter({
  recipe,
  onSave,
  isSaved,
  onSend,
  isStreaming = false,
}: RecipeLetterProps) {
  // Streaming partials may be missing arrays entirely; default them so the
  // same render path serves both the live and the final view (ADR-0009).
  const title = recipe.title ?? "";
  const ingredients = recipe.ingredients ?? [];
  const prep = recipe.prep;
  const steps = recipe.steps ?? [];
  const baseServings = recipe.baseServings ?? 1;

  const [servings, setServings] = useState(baseServings);
  const [inFlight, setInFlight] = useState<Set<string>>(new Set());
  const [cooking, setCooking] = useState(false);
  // While streaming the stepper is hidden and baseServings may still be filling
  // in, so show amounts as authored (ratio 1) rather than briefly mis-scaling.
  const ratio = isStreaming ? 1 : servings / baseServings;
  const { userId } = useSessionContext();
  const { mutate } = useSWRConfig();
  const inventoryKey = userId ? `/api/inventory?userId=${userId}` : null;
  const { data: inventoryData } = useSWR<GetInventoryResponse>(
    inventoryKey,
    fetcher,
  );

  const addToPantry = async (ing: RecipeIngredientModel) => {
    if (!userId || inFlight.has(ing.name)) return;
    setInFlight((prev) => new Set(prev).add(ing.name));
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              name: ing.name,
              type: "ingredient",
              ...(ing.category && { category: ing.category }),
            },
          ],
          userId,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const msg =
          payload?.error ?? `Failed to add ${ing.name} (${res.status})`;
        throw new Error(msg);
      }
      toast.success(`${ing.name} — in the pantry now.`);
      mutate(inventoryKey);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : `Aiyah, couldn't add ${ing.name}. Try again?`,
      );
    } finally {
      setInFlight((prev) => {
        const s = new Set(prev);
        s.delete(ing.name);
        return s;
      });
    }
  };

  const inventoryItems: InventoryItem[] = [
    ...(inventoryData?.ingredientInventory ?? []),
    ...(inventoryData?.kitchenwareInventory ?? []),
  ];
  const inventoryNames = inventoryItems.map((i) => i.name.trim().toLowerCase());

  const haveCount = ingredients.filter((ing) =>
    ingredientHave(ing.name, inventoryNames),
  ).length;

  const total = ingredients.length;
  const missingIngredients = ingredients.filter(
    (ing) => !ingredientHave(ing.name, inventoryNames),
  );
  const showShortfall =
    !isStreaming &&
    userId &&
    inventoryItems.length > 0 &&
    total > 0 &&
    haveCount >= Math.ceil(total / 2) &&
    missingIngredients.length > 0;

  const copyShoppingList = () => {
    const lines = missingIngredients
      .map((ing) => {
        const parts = [ing.name];
        if (ing.amount) parts.unshift(ing.amount + (ing.unit ? ` ${ing.unit}` : ""));
        return parts.join(" ");
      })
      .join("\n");
    navigator.clipboard.writeText(lines).then(
      () => toast.success("Shopping list copied — go get them!"),
      () => toast.error("Aiyah, couldn't copy — select and copy by hand?"),
    );
  };

  const copyRecipe = () => {
    const text = formatRecipeAsText(
      {
        title,
        description: recipe.description,
        totalTimeMinutes: recipe.totalTimeMinutes,
        baseServings,
        ingredients,
        prep,
        steps,
        notes: recipe.notes,
      },
      servings,
    );
    navigator.clipboard.writeText(text).then(
      () => toast.success("Recipe copied — paste it anywhere."),
      () => toast.error("Aiyah, couldn't copy — try again?"),
    );
  };

  const askForSubstitutions = () => {
    if (!onSend) return;
    const names = missingIngredients.map((i) => i.name).join(", ");
    onSend(`I'm missing ${names} for the ${title}. Can you suggest substitutions or alternatives?`);
  };

  const timeLabel = recipe.totalTimeMinutes
    ? `${recipe.totalTimeMinutes} min`
    : null;
  const EYEBROW_BASE =
    "font-sans text-eyebrow font-bold tracking-widest uppercase";

  const showPantryPill = !!userId && !isStreaming;
  const canCook = !isStreaming && steps.length > 0;

  if (cooking) {
    return (
      <CookingMode
        title={title}
        steps={steps}
        prep={prep}
        onExit={() => setCooking(false)}
      />
    );
  }

  const closenessLabel =
    recipe.closeness === "close"
      ? "Right now"
      : recipe.closeness === "stretch"
        ? "Worth a small trip"
        : null;

  return (
    <div className="border-y border-border-soft px-4 sm:px-[26px] pt-5 pb-[22px] relative">
      {/* Cook-With closeness caption */}
      {closenessLabel && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1 font-sans text-eyebrow font-bold tracking-[0.16em] uppercase px-2 py-0.5 rounded-full border border-dashed border-primary/40 text-primary bg-primary/5">
            {recipe.closeness === "close" ? "✓" : "↗"} {closenessLabel}
          </span>
        </div>
      )}
      {/* Title */}
      <div className="font-display text-3xl font-semibold text-foreground leading-[1.05] tracking-tight mb-2">
        {title}
      </div>

      {/* Description */}
      {recipe.description && (
        <div className="font-display italic text-sm text-muted-foreground leading-relaxed mb-3">
          {recipe.description}
        </div>
      )}

      {/* Meta row — time · pantry pill */}
      {(timeLabel || showPantryPill) && (
        <div className="flex items-center gap-2.5 text-muted-foreground mb-4 pb-3 border-b border-dashed border-border">
          {timeLabel && (
            <span className="font-mono text-xs flex items-center gap-1">
              <TimerIcon className="w-3.5 h-3.5" />
              {timeLabel}
            </span>
          )}
          {timeLabel && showPantryPill && (
            <span className="text-border">·</span>
          )}
          {showPantryPill && (
            <span className="font-sans text-eyebrow font-semibold text-jade px-1.5 py-0.5 bg-[oklch(0.94_0.04_168)] border border-[oklch(0.78_0.07_168)] rounded-full tracking-normal normal-case">
              {haveCount}/{ingredients.length} in your pantry
            </span>
          )}
        </div>
      )}

      {/* Shortfall card — shown when ≥50% in pantry but some missing */}
      {showShortfall && (
        <div className="mb-4 bg-[oklch(0.97_0.03_60)] border border-dashed border-[oklch(0.78_0.07_60)] rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[oklch(0.6_0.14_50)]" />
            <span className="font-sans text-eyebrow font-bold tracking-[0.16em] uppercase text-[oklch(0.45_0.10_50)]">
              You&rsquo;re almost there
            </span>
          </div>
          <p className="font-display text-sm text-foreground mb-0.5 leading-snug">
            Still need:{" "}
            <span className="font-semibold">
              {missingIngredients.map((i) => i.name).join(", ")}
            </span>
          </p>
          <div className="flex items-center gap-2 mt-2.5">
            <button
              onClick={copyShoppingList}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 font-sans text-xs font-semibold text-foreground bg-card border border-border rounded-lg shadow-[0_1px_0_var(--border-soft)] hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                <rect x="5" y="2" width="9" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M5 4H3.5A1.5 1.5 0 0 0 2 5.5v9A1.5 1.5 0 0 0 3.5 16h7A1.5 1.5 0 0 0 12 14.5V13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              Copy shopping list
            </button>
            {onSend && (
              <button
                onClick={askForSubstitutions}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 font-sans text-xs font-semibold text-primary-deep bg-primary-tint border border-primary-deep rounded-lg shadow-cta hover:bg-primary-tint/70 transition-colors cursor-pointer"
              >
                Ask Ah Mah for substitutions →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Ingredients — neat 2-column grid card */}
      {ingredients.length > 0 && (
        <div className="mb-5.5">
          <div className="flex items-center justify-between mb-2">
            <span className={cn(EYEBROW_BASE, "text-muted-foreground")}>What to gather</span>
            {!isStreaming && (
              <div className="flex items-center gap-1.5">
                <span className="font-sans text-eyebrow font-bold tracking-[0.16em] uppercase text-ink-faint">
                  Servings
                </span>
                <ServingsStepper
                  servings={servings}
                  onDecrement={() => setServings((s) => Math.max(1, s - 1))}
                  onIncrement={() => setServings((s) => s + 1)}
                />
              </div>
            )}
          </div>
          <div className="bg-card border border-border rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-x-4.5 gap-y-1 shadow-[0_1px_0_var(--border-soft)]">
            {ingredients.map((ing, i) => {
              const scaledAmt = ing.amount
                ? scaleAmount(ing.amount, ratio)
                : "";
              const amountLabel = scaledAmt
                ? `${scaledAmt}${ing.unit ? " " + ing.unit : ""}`
                : "";
              const have = ingredientHave(ing.name, inventoryNames);
              const isLastTwo = i >= ingredients.length - 2;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-baseline gap-2 py-1.5 border-b border-dashed border-border",
                    isLastTwo && "border-none",
                  )}
                >
                  <span className="flex-[0_0_64px] font-mono text-xs font-semibold text-foreground text-right tabular-nums">
                    {amountLabel ? <ScaledNum>{amountLabel}</ScaledNum> : ""}
                  </span>
                  <span className="flex-1 font-display text-sm text-foreground leading-tight">
                    {ing.name}
                    {ing.note && (
                      <span className="text-muted-foreground italic text-xs">
                        , {ing.note}
                      </span>
                    )}
                  </span>
                  {!isStreaming && userId && inventoryItems.length > 0 && !have && (
                    <NeedCartButton
                      ingredientName={ing.name}
                      onAdd={() => addToPantry(ing)}
                      pending={inFlight.has(ing.name)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Before you start — mise en place */}
      {prep && prep.length > 0 && (
        <div className="mb-5">
          <span className={cn(EYEBROW_BASE, "text-muted-foreground block mb-2")}>Before you start</span>
          <ul className="list-none p-0 m-0 flex flex-col">
            {prep.map((item, i) => (
              <li key={i} className="flex gap-2.5 items-baseline py-2 border-b border-dashed border-border last:border-none">
                <span className="font-mono text-[11px] font-bold text-ink-faint shrink-0">·</span>
                <span className="font-display text-sm text-foreground leading-[1.45]">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Steps — each step a conversational bubble with a numbered ink-stamp */}
      {steps.length > 0 && (
        <div className="flex flex-col gap-4.5">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="shrink-0 size-9 bg-primary text-white flex items-center justify-center font-display font-bold text-lg rounded-[50%_50%_50%_8px] -rotate-3 shadow-[inset_0_-2px_0_var(--primary-deep),0_1px_0_var(--primary-deep)]">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold text-base text-foreground mb-1 tracking-tight">
                  {step.title}
                </div>
                <div className="font-display text-base text-foreground leading-relaxed">
                  {step.body}
                </div>
                {step.tip && (
                  <div className="mt-2 pl-3 border-l-[3px] border-[oklch(0.65_0.10_60)] font-display italic text-sm text-muted-foreground leading-relaxed">
                    — {step.tip}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notes — whole-dish asides (make-ahead, storage, serving) */}
      {recipe.notes && recipe.notes.length > 0 && (
        <div className="mt-5">
          <span className={cn(EYEBROW_BASE, "text-muted-foreground block mb-2")}>Notes</span>
          <ul className="list-none p-0 m-0 flex flex-col">
            {recipe.notes.map((note, i) => (
              <li key={i} className="flex gap-2.5 items-baseline py-2 border-b border-dashed border-border last:border-none">
                <span className="font-mono text-[11px] font-bold text-ink-faint shrink-0">·</span>
                <span className="font-display text-sm text-foreground leading-[1.45]">{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action bar */}
      {!isStreaming && (onSave || canCook) && (
        <div className="flex gap-2 items-center pt-3 mt-4.5 border-t border-dashed border-border">
          <button
            onClick={copyRecipe}
            aria-label="Copy recipe"
            className="px-3 py-1.5 font-sans text-xs font-semibold text-foreground bg-card border border-border rounded-lg cursor-pointer shadow-[0_1px_0_var(--border-soft)] hover:bg-muted/50 transition-colors inline-flex items-center gap-1"
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <rect x="5" y="2" width="9" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M5 4H3.5A1.5 1.5 0 0 0 2 5.5v9A1.5 1.5 0 0 0 3.5 16h7A1.5 1.5 0 0 0 12 14.5V13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            Copy recipe
          </button>
          {onSave && (
            isSaved ? (
              <button
                disabled
                className="px-3 py-1.5 font-sans text-xs font-semibold text-jade bg-transparent border border-border rounded-lg cursor-not-allowed inline-flex items-center gap-1 opacity-80"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                  <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3-7 3z" />
                </svg>
                Saved
              </button>
            ) : (
              <button
                onClick={() => onSave(recipe as RecipeBlock)}
                className="px-3 py-1.5 font-sans text-xs font-semibold text-foreground bg-card border border-border rounded-lg cursor-pointer shadow-[0_1px_0_var(--border-soft)] hover:bg-muted/50 transition-colors inline-flex items-center gap-1"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3-7 3z" />
                </svg>
                Save to cookbook
              </button>
            )
          )}
          {canCook && (
            <Button
              variant="cta"
              onClick={() => setCooking(true)}
              className="ml-auto px-3 py-1.5 font-sans text-xs font-semibold gap-1.5"
            >
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" className="size-[11px]">
                <path d="M5 3l8 5-8 5V3z" fill="currentColor"/>
              </svg>
              Start cooking
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
