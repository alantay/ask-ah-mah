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
import { DottedList, Eyebrow, StepList } from "@/features/shared/components/recipe";
import { toast } from "sonner";
import useSWR, { useSWRConfig } from "swr";
import { ScaledNum, scaleAmount, formatRecipeAsText } from "@/features/Recipe";

export interface RecipeLetterProps {
  // Partial during progressive reveal — fields fill in as the JSON streams.
  recipe: Partial<RecipeBlock>;
  onSave?: (recipe: RecipeBlock) => void;
  isSaved?: boolean;
  // Cooked marker for the last-step "I made this" checkbox in cooking mode (ADR-0020).
  cooked?: boolean;
  onCookedChange?: (cooked: boolean) => void;
  // Mints/shares the public link for this recipe (finish-moment share prompt, ADR-0022).
  onShare?: () => void;
  sharing?: boolean;
  // Drops the substitutions prompt into the composer (not sent) so the user can
  // correct the pantry-derived missing list before asking Ah Mah.
  onDraft?: (text: string) => void;
  // While true the recipe is still streaming: arrays may be incomplete and all
  // interactivity (stepper, add-to-list, save, cook, substitutions) is suppressed.
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
      aria-label={`Add ${ingredientName} to shopping list`}
      title={`Add ${ingredientName} to shopping list`}
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
  onDraft,
  isStreaming = false,
  cooked,
  onCookedChange,
  onShare,
  sharing,
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

  // Tapping the cart adds the missing ingredient to the standing Shopping List
  // (Need tab), not the pantry. The service upserts on a canonical key, so
  // re-adding an item already on the list is a server-side no-op.
  const addToShoppingList = async (ing: RecipeIngredientModel) => {
    if (!userId || inFlight.has(ing.name)) return;
    setInFlight((prev) => new Set(prev).add(ing.name));
    try {
      const res = await fetch("/api/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              name: ing.name,
              ...(ing.category && { category: ing.category }),
            },
          ],
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const msg =
          payload?.error ?? `Failed to add ${ing.name} (${res.status})`;
        throw new Error(msg);
      }
      toast.success(`${ing.name} — on the list.`);
      mutate(`/api/shopping-list?userId=${encodeURIComponent(userId)}`);
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

  const missingIngredients = ingredients.filter(
    (ing) => !ingredientHave(ing.name, inventoryNames),
  );
  // The substitutions on-ramp is useful whenever the user is tracking a pantry
  // and is short an ingredient — Ah Mah can suggest a swap for what's missing.
  const showSubstitutions =
    !isStreaming &&
    !!onDraft &&
    !!userId &&
    inventoryItems.length > 0 &&
    missingIngredients.length > 0;

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
    if (!onDraft) return;
    const names = missingIngredients.map((i) => i.name).join(", ");
    onDraft(`I'm missing ${names} for the ${title}. Can you suggest substitutions or alternatives?`);
  };

  const timeLabel = recipe.totalTimeMinutes
    ? `${recipe.totalTimeMinutes} min`
    : null;

  const showPantryPill = !!userId && !isStreaming;
  const canCook = !isStreaming && steps.length > 0;

  // Shared shape for the lightweight secondary actions so copy/save/substitutions
  // line up at one height and padding instead of three mismatched treatments.
  const secondaryAction =
    "inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg font-sans text-xs font-semibold transition-colors cursor-pointer";

  if (cooking) {
    return (
      <CookingMode
        title={title}
        steps={steps}
        prep={prep}
        onExit={() => setCooking(false)}
        cooked={cooked}
        onCookedChange={onCookedChange}
        onShare={onShare}
        sharing={sharing}
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

      {/* Meta row — time · pantry pill, with the substitutions nudge tucked
          beneath the pantry count it answers (you're short → ask for a swap). */}
      {(timeLabel || showPantryPill) && (
        <div className="mb-4 pb-3 border-b border-dashed border-border">
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
              <span className="font-sans text-eyebrow font-semibold text-jade px-1.5 py-0.5 bg-jade-tint border border-jade-border rounded-full tracking-normal normal-case">
                {haveCount}/{ingredients.length} in your pantry
              </span>
            )}
          </div>
          {/* Conversational nudge — a suggestion to continue the chat, styled as
              a quiet link rather than a button so it doesn't read as an action. */}
          {showSubstitutions && (
            <button
              onClick={askForSubstitutions}
              className="group mt-2 inline-flex items-center gap-1.5 font-sans text-xs cursor-pointer"
            >
              <span className="text-muted-foreground">Short an ingredient?</span>
              <span className="font-medium text-primary-deep underline decoration-dashed decoration-primary-deep/40 underline-offset-2 transition-colors group-hover:decoration-primary-deep">
                Ask Ah Mah for substitutions
              </span>
              <span
                aria-hidden
                className="text-primary-deep transition-transform group-hover:translate-x-0.5"
              >
                →
              </span>
            </button>
          )}
        </div>
      )}

      {/* Ingredients — neat 2-column grid card */}
      {ingredients.length > 0 && (
        <div className="mb-5.5">
          <div className="flex items-center justify-between mb-2">
            <Eyebrow className="text-muted-foreground">What to gather</Eyebrow>
            {!isStreaming && (
              <div className="flex items-center gap-1.5">
                <Eyebrow>Servings</Eyebrow>
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
                  <span className="flex-[0_0_72px] font-mono text-dense font-semibold text-foreground text-right tabular-nums whitespace-nowrap">
                    {amountLabel ? <ScaledNum>{amountLabel}</ScaledNum> : ""}
                  </span>
                  <span className="flex-1 font-display text-emphasis text-foreground">
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
                      onAdd={() => addToShoppingList(ing)}
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
          <Eyebrow className="text-muted-foreground block mb-2">Before you start</Eyebrow>
          <DottedList items={prep} />
        </div>
      )}

      {/* Steps — each step a conversational bubble with a numbered ink-stamp */}
      {steps.length > 0 && <StepList steps={steps} marker="stamp" />}

      {/* Notes — whole-dish asides (make-ahead, storage, serving) */}
      {recipe.notes && recipe.notes.length > 0 && (
        <div className="mt-5">
          <Eyebrow className="text-muted-foreground block mb-2">Notes</Eyebrow>
          <DottedList items={recipe.notes} />
        </div>
      )}

      {/* Action bar — utility + save on the left, the primary action on the right. */}
      {!isStreaming && (onSave || canCook) && (
        <div className="flex items-center gap-2 pt-3.5 mt-4.5 border-t border-dashed border-border">
          <button
            onClick={copyRecipe}
            aria-label="Copy recipe"
            title="Copy recipe"
            className={cn(
              secondaryAction,
              "w-9 px-0 text-muted-foreground border border-border bg-card shadow-[0_1px_0_var(--border-soft)] hover:bg-muted/50 hover:text-foreground",
            )}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <rect x="5" y="2" width="9" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M5 4H3.5A1.5 1.5 0 0 0 2 5.5v9A1.5 1.5 0 0 0 3.5 16h7A1.5 1.5 0 0 0 12 14.5V13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </button>
          {onSave && (
            isSaved ? (
              <span
                className={cn(
                  secondaryAction,
                  "text-jade border border-border bg-card opacity-80 cursor-default",
                )}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                  <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3-7 3z" />
                </svg>
                Saved
              </span>
            ) : (
              <button
                onClick={() => onSave(recipe as RecipeBlock)}
                className={cn(
                  secondaryAction,
                  "text-foreground border border-border bg-card shadow-[0_1px_0_var(--border-soft)] hover:bg-muted/50",
                )}
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
              className="ml-auto h-9 px-4 font-sans text-xs font-semibold gap-1.5"
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
