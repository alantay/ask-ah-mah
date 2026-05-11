"use client";

import { useSessionContext } from "@/contexts/SessionContext";
import { GetInventoryResponse, InventoryItem } from "@/lib/inventory/schemas";
import { cn } from "@/lib/utils";
import { fetcher } from "@/lib/utils/index";
import { useState } from "react";
import useSWR from "swr";
import { ScaledNum } from "./ScaledNum";
import { scaleAmount } from "./scaleAmount";

interface Ingredient {
  name: string;
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
    "w-7 border-none bg-transparent cursor-pointer text-foreground text-[16px] font-semibold disabled:cursor-not-allowed disabled:text-muted-foreground";

  return (
    <div className="inline-flex items-stretch border border-border rounded-lg bg-card overflow-hidden shadow-[0_1px_0_var(--border-soft)] h-[30px]">
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
      <div className="flex justify-center items-center min-w-[40px] px-2">
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

function HaveTag({ have }: { have: boolean }) {
  const BASE =
    "font-sans text-[9.5px] font-bold px-1.5 py-0.5 rounded-full tracking-wider shrink-0";
  if (have) {
    return (
      <span
        className={cn(
          BASE,
          "text-accent bg-[oklch(0.94_0.04_168)] border border-[oklch(0.78_0.07_168)]",
        )}
      >
        HAVE
      </span>
    );
  }
  return (
    <span
      className={cn(
        BASE,
        "text-muted-foreground bg-transparent border border-border",
      )}
    >
      NEED
    </span>
  );
}

function ingredientHave(name: string, inventoryNames: string[]): boolean {
  const n = name.trim().toLowerCase();
  return inventoryNames.some((inv) => inv.includes(n) || n.includes(inv));
}

export function RecipeLetter({ recipe, onSave, isSaved }: RecipeLetterProps) {
  const [servings, setServings] = useState(recipe.baseServings);
  const ratio = servings / recipe.baseServings;
  const { userId } = useSessionContext();
  const { data: inventoryData } = useSWR<GetInventoryResponse>(
    userId ? `/api/inventory?userId=${userId}` : null,
    fetcher,
  );

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

  return (
    <div className=" border-y border-border-soft p-[20px_26px_22px] relative">
      {/* Ribbon header */}
      <div className="flex items-center gap-2.5 mb-3.5 pb-2.5 border-b border-dashed border-border">
        <div className="size-5.5 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 2v12l5-3 5 3V2z"
              stroke="currentColor"
              strokeWidth="1.4"
              fill="currentColor"
            />
          </svg>
        </div>

        <div className={cn(EYEBROW_BASE, "text-muted-foreground")}>
          From Ah Mah's Kitchen
        </div>

        <div className="flex-1" />

        {timeLabel && (
          <div className="font-mono text-[10px] text-muted-foreground">
            {timeLabel}
          </div>
        )}

        <div className="flex flex-col items-end gap-0.5">
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
      </div>

      {/* Title */}
      <div className="font-display text-3xl font-semibold text-foreground leading-[1.05] tracking-tight mb-2">
        {recipe.title}
      </div>

      {/* Description */}
      {recipe.description && (
        <div className="font-display italic text-sm text-muted-foreground leading-relaxed mb-4.5">
          {recipe.description}
        </div>
      )}

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
            {userId && inventoryItems.length > 0 && (
              <span className="font-sans italic-normal text-[10px] font-semibold text-accent px-1.5 py-0.25 bg-[oklch(0.94_0.04_168)] border border-[oklch(0.78_0.07_168)] rounded-full tracking-normal normal-case">
                {haveCount}/{recipe.ingredients.length} in your pantry
              </span>
            )}
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
                    <HaveTag have={have} />
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
                <div className="font-display italic text-base text-foreground leading-relaxed">
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
              className="px-3 py-1.5 font-sans text-xs font-semibold text-accent bg-transparent border border-border rounded-lg cursor-not-allowed inline-flex items-center gap-1 opacity-80"
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
              className="px-3 py-1.5 font-sans text-xs font-semibold text-white bg-primary border border-[oklch(0.405_0.130_32)] rounded-lg cursor-pointer shadow-[0_1px_0_oklch(0.405_0.130_32)] inline-flex items-center gap-1"
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
