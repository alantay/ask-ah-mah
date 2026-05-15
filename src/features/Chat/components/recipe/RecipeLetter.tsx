"use client";

import { useSessionContext } from "@/contexts/SessionContext";
import {
  Category,
  GetInventoryResponse,
  InventoryItem,
} from "@/lib/inventory/schemas";
import { ingredientMatches } from "@/lib/recipes/matchIngredient";
import { cn } from "@/lib/utils";
import { fetcher } from "@/lib/utils/index";
import { TimerIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useSWR, { useSWRConfig } from "swr";
import { ScaledNum } from "./ScaledNum";
import { scaleAmount } from "./scaleAmount";

interface Ingredient {
  name: string;
  category?: Category;
  amount?: string;
  unit?: string;
  note?: string;
}

interface Step {
  title: string;
  body: string;
  tip?: string;
}

interface RecipeData {
  title: string;
  description?: string;
  totalTimeMinutes?: number;
  baseServings: number;
  ingredients: Ingredient[];
  steps: Step[];
  tags?: string[];
}

export interface RecipeLetterProps {
  recipe: RecipeData;
  onSave?: (recipe: RecipeData) => void;
  isSaved?: boolean;
}

function ServingsStepper({
  servings,
  onDecrement,
  onIncrement,
}: {
  servings: number;
  baseServings: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  const BUTTON_BASE =
    "w-7 border-none bg-transparent cursor-pointer text-foreground text-base font-semibold disabled:cursor-not-allowed disabled:text-muted-foreground";

  return (
    <div className="inline-flex items-stretch border border-border rounded-lg bg-card overflow-hidden shadow-[0_1px_0_var(--border-soft)] h-8">
      <button
        onClick={onDecrement}
        disabled={servings <= 1}
        className={cn(
          BUTTON_BASE,
          "border-r border-border disabled:opacity-50",
        )}
        aria-label="Decrease servings"
      >
        −
      </button>
      <div className="flex justify-center items-center min-w-4 px-2">
        <span className="font-display font-semibold text-[14px] text-foreground tabular-nums">
          {servings}
        </span>
      </div>
      <button
        onClick={onIncrement}
        disabled={servings >= 12}
        className={cn(BUTTON_BASE, "border-l border-border")}
        aria-label="Increase servings"
      >
        +
      </button>
    </div>
  );
}

function HaveTag({
  have,
  ingredientName,
  onAdd,
  pending,
}: {
  have: boolean;
  ingredientName: string;
  onAdd?: () => void;
  pending?: boolean;
}) {
  const BASE =
    "font-sans text-[9.5px] font-bold px-1.5 py-0.5 rounded-full tracking-wider shrink-0";
  if (have) {
    return (
      <span
        className={cn(
          BASE,
          "text-jade bg-[oklch(0.94_0.04_168)] border border-[oklch(0.78_0.07_168)]",
        )}
      >
        HAVE
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={pending}
      aria-label={`Add ${ingredientName} to pantry`}
      className={cn(
        BASE,
        "text-muted-foreground bg-transparent border border-border transition-colors",
        pending
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer hover:bg-muted hover:text-foreground",
      )}
    >
      NEED
    </button>
  );
}

function ingredientHave(name: string, inventoryNames: string[]): boolean {
  return ingredientMatches(name, inventoryNames);
}

export function RecipeLetter({ recipe, onSave, isSaved }: RecipeLetterProps) {
  const [servings, setServings] = useState(recipe.baseServings);
  const [inFlight, setInFlight] = useState<Set<string>>(new Set());
  const ratio = servings / recipe.baseServings;
  const { userId } = useSessionContext();
  const { mutate } = useSWRConfig();
  const inventoryKey = userId ? `/api/inventory?userId=${userId}` : null;
  const { data: inventoryData } = useSWR<GetInventoryResponse>(
    inventoryKey,
    fetcher,
  );

  const addToPantry = async (ing: Ingredient) => {
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
      toast.success(`Added ${ing.name} to your pantry`);
      mutate(inventoryKey);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : `Couldn't add ${ing.name} — please try again`,
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

  const haveCount = recipe.ingredients.filter((ing) =>
    ingredientHave(ing.name, inventoryNames),
  ).length;

  const timeLabel = recipe.totalTimeMinutes
    ? `${recipe.totalTimeMinutes} min`
    : null;
  const EYEBROW_BASE =
    "font-sans text-[10px] font-bold tracking-widest uppercase";

  const showPantryPill = !!userId;

  return (
    <div className=" border-y border-border-soft p-[20px_26px_22px] relative">
      {/* Title */}
      <div className="font-display text-3xl font-semibold text-foreground leading-[1.05] tracking-tight mb-2">
        {recipe.title}
      </div>

      {/* Description */}
      {recipe.description && (
        <div className="font-display italic text-sm text-muted-foreground leading-relaxed mb-3">
          {recipe.description}
        </div>
      )}

      {/* Meta row — time · pantry pill on left, servings stepper on right */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-dashed border-border">
          <div className="flex items-center gap-2.5 text-muted-foreground">
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
              <span className="font-sans text-[10px] font-semibold text-jade px-1.5 py-0.5 bg-[oklch(0.94_0.04_168)] border border-[oklch(0.78_0.07_168)] rounded-full tracking-normal normal-case">
                {haveCount}/{recipe.ingredients.length} in your pantry
              </span>
            )}
          </div>
          <div className="flex-1" />
          <span className="font-sans text-[9.5px] font-bold tracking-[0.16em] uppercase text-ink-faint">
            Servings
          </span>
          <ServingsStepper
            servings={servings}
            baseServings={recipe.baseServings}
            onDecrement={() => setServings((s) => Math.max(1, s - 1))}
            onIncrement={() => setServings((s) => Math.min(12, s + 1))}
          />
        </div>

      {/* Ingredients — neat 2-column grid card */}
      {recipe.ingredients.length > 0 && (
        <div className="mb-5.5">
          <div
            className={cn(
              EYEBROW_BASE,
              "text-muted-foreground mb-2 flex items-baseline gap-2.5",
            )}
          >
            <span>What to gather</span>
          </div>
          <div className="bg-card border border-border rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-x-4.5 gap-y-1 shadow-[0_1px_0_var(--border-soft)]">
            {recipe.ingredients.map((ing, i) => {
              const scaledAmt = ing.amount
                ? scaleAmount(ing.amount, ratio)
                : "";
              const amountLabel = scaledAmt
                ? `${scaledAmt}${ing.unit ? " " + ing.unit : ""}`
                : "";
              const have = ingredientHave(ing.name, inventoryNames);
              const isLastTwo = i >= recipe.ingredients.length - 2;
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
                  {userId && inventoryItems.length > 0 && (
                    <HaveTag
                      have={have}
                      ingredientName={ing.name}
                      onAdd={have ? undefined : () => addToPantry(ing)}
                      pending={inFlight.has(ing.name)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Steps — each step a conversational bubble with a numbered ink-stamp */}
      {recipe.steps.length > 0 && (
        <div className="flex flex-col gap-4.5">
          {recipe.steps.map((step, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="shrink-0 size-9 bg-primary text-white flex items-center justify-center font-display font-bold text-lg rounded-[50%_50%_50%_8px] -rotate-3 shadow-[inset_0_-2px_0_oklch(0.405_0.130_32),0_1px_0_oklch(0.405_0.130_32)]">
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

      {/* Action bar — only when onSave is provided */}
      {onSave && (
        <div className="flex gap-2 items-center pt-3 mt-4.5 border-t border-dashed border-border">
          {isSaved ? (
            <button
              disabled
              className="px-3 py-1.5 font-sans text-xs font-semibold text-jade bg-transparent border border-border rounded-lg cursor-not-allowed inline-flex items-center gap-1 opacity-80"
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3-7 3z" />
              </svg>
              Saved
            </button>
          ) : (
            <button
              onClick={() => onSave(recipe)}
              className="px-3 py-1.5 font-sans text-xs font-semibold text-foreground bg-card border border-border rounded-lg cursor-pointer shadow-[0_1px_0_var(--border-soft)] hover:bg-muted/50 transition-colors inline-flex items-center gap-1"
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3-7 3z" />
              </svg>
              Save to cookbook
            </button>
          )}
        </div>
      )}
    </div>
  );
}
