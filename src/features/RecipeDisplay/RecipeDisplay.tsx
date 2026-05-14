import { Button } from "@/components/ui/button";
import { useRecipeContext } from "@/contexts/RecipeContext";
import { useSessionContext } from "@/contexts/SessionContext";
import { RecipeLetter } from "@/features/Chat/components/recipe/RecipeLetter";
import { GetInventoryResponse, InventoryItem } from "@/lib/inventory/schemas";
import { RecipeIngredient, RecipeStep, RecipeWithId } from "@/lib/recipes/schemas";
import { fetcher } from "@/lib/utils/index";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import useSWR from "swr";

const formatAmount = (n: number) => {
  if (Number.isInteger(n)) return String(n);
  return Number(n.toFixed(2)).toString();
};

const extractInstructions = (markdown: string): string => {
  // Find the **Instructions:** heading and return everything after it.
  // Also strips the trailing -----  delimiter if present.
  const match = markdown.match(/\*\*Instructions:\*\*\s*\n([\s\S]*)/i);
  if (match) {
    return match[1].replace(/\n?\s*-----\s*$/, "").trim();
  }
  // Fallback: return the full text (e.g. freeform recipes without the delimiter format)
  return markdown;
};

const formatTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} h ${m} m` : `${h} h`;
};

const findInventoryMatch = (
  ingredient: RecipeIngredient,
  inventory: InventoryItem[],
): InventoryItem | undefined => {
  const target = ingredient.name.trim().toLowerCase();
  return inventory.find((item) => item.name.trim().toLowerCase() === target);
};

const computeShortfall = (
  scaledAmount: number,
  recipeUnit: string | undefined,
  inv: InventoryItem | undefined,
): number | null => {
  if (!inv) return null;
  if (inv.quantity == null) return null;
  if (!recipeUnit || !inv.unit) return null;
  if (recipeUnit.toLowerCase() !== inv.unit.toLowerCase()) return null;
  const diff = scaledAmount - inv.quantity;
  return diff > 0 ? diff : null;
};

function LegacyRecipeBody({
  selectedRecipe,
}: {
  selectedRecipe: RecipeWithId;
}) {
  const { userId } = useSessionContext();
  const [servings, setServings] = useState<number>(
    selectedRecipe?.baseServings ?? 2,
  );

  const { data: inventoryData } = useSWR<GetInventoryResponse>(
    userId ? `/api/inventory?userId=${userId}` : null,
    fetcher,
  );

  const baseServings = selectedRecipe.baseServings || 2;
  const ingredients = (selectedRecipe.ingredients || []) as RecipeIngredient[];
  const allInventory = [
    ...(inventoryData?.ingredientInventory ?? []),
    ...(inventoryData?.kitchenwareInventory ?? []),
  ];
  const scale = servings / baseServings;

  const ingredientStatus = ingredients.map((ing) => {
    const scaled = ing.amount != null ? ing.amount * scale : undefined;
    const inv = findInventoryMatch(ing, allInventory);
    const comparable =
      scaled != null &&
      inv?.quantity != null &&
      !!ing.unit &&
      !!inv.unit &&
      ing.unit.toLowerCase() === inv.unit.toLowerCase();
    const short = comparable ? computeShortfall(scaled, ing.unit, inv) : null;
    const inPantry = comparable && short == null;
    return { ing, scaled, inv, short, inPantry };
  });
  const inPantryCount = ingredientStatus.filter((s) => s.inPantry).length;
  const shortCount = ingredientStatus.filter((s) => s.short != null).length;

  return (
    <>
      {/* Hero strip */}
      <div
        className="relative h-[180px] sm:h-[220px] border-b border-border flex items-end"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.55 0.13 35) 0%, oklch(0.42 0.10 30) 100%)",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, oklch(1 0 0 / 0.04) 0 12px, transparent 12px 24px)",
          }}
        />
        <div
          className="relative w-full px-9 pt-6 pb-5 text-white"
          style={{
            background:
              "linear-gradient(to top, oklch(0 0 0 / 0.3), transparent)",
          }}
        >
          {selectedRecipe.tags && selectedRecipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {selectedRecipe.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
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
      </div>

      {/* Body */}
      <div className="px-6 sm:px-9 py-7 pb-12">
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
            <div>
              <div className="font-sans text-[10.5px] font-bold tracking-[0.16em] uppercase text-ink-faint mb-1">
                From Ah Mah
              </div>
              <div className="font-display italic text-[15px] sm:text-base text-foreground leading-[1.5] max-w-prose">
                {selectedRecipe.description}
              </div>
            </div>
          </div>
        )}

        {/* Stat row — total time + servings stepper */}
        <div className="flex flex-wrap items-end gap-3 mb-7">
          {selectedRecipe.totalTimeMinutes && (
            <div className="flex flex-col px-3.5 py-2 bg-card border border-border rounded-lg shadow-[0_1px_0_var(--color-border-soft)] min-w-[78px]">
              <span className="font-sans text-[9.5px] font-bold tracking-[0.16em] uppercase text-ink-faint">
                Total time
              </span>
              <span className="font-display font-semibold text-[18px] text-foreground tabular-nums mt-0.5">
                {formatTime(selectedRecipe.totalTimeMinutes)}
              </span>
            </div>
          )}
          <div className="flex flex-col px-3.5 py-2 bg-card border border-border rounded-lg shadow-[0_1px_0_var(--color-border-soft)] min-w-[78px]">
            <span className="font-sans text-[9.5px] font-bold tracking-[0.16em] uppercase text-ink-faint">
              Yields
            </span>
            <span className="font-display font-semibold text-[18px] text-foreground tabular-nums mt-0.5">
              {servings} {servings === 1 ? "serving" : "servings"}
            </span>
          </div>
          <div className="flex-1" />
          <div className="flex flex-col items-end gap-1.5">
            <span className="font-sans text-[10.5px] font-bold tracking-[0.16em] uppercase text-ink-faint">
              Servings
            </span>
            <div className="inline-flex items-center bg-card border border-border rounded-lg overflow-hidden shadow-[0_1px_0_var(--color-border-soft)]">
              <button
                onClick={() => setServings((s) => Math.max(1, s - 1))}
                disabled={servings <= 1}
                aria-label="Decrease servings"
                className="w-8 h-8 flex items-center justify-center text-foreground text-base font-semibold border-r border-border hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                −
              </button>
              <span className="min-w-11 text-center font-display font-semibold text-[15px] text-foreground tabular-nums">
                {servings}
              </span>
              <button
                onClick={() => setServings((s) => Math.min(20, s + 1))}
                disabled={servings >= 20}
                aria-label="Increase servings"
                className="w-8 h-8 flex items-center justify-center text-foreground text-base font-semibold border-l border-border hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Ingredients */}
        {ingredients.length > 0 && (
          <section className="mb-9">
            <div className="flex items-baseline justify-between mb-1 flex-wrap gap-3">
              <h2 className="font-display font-semibold text-[24px] sm:text-[26px] text-foreground tracking-tight m-0">
                Ingredients
              </h2>
              <div className="flex items-center gap-3.5 font-sans text-[12px] text-muted-foreground">
                {inPantryCount > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-jade" />
                    {inPantryCount} in pantry
                  </span>
                )}
                {shortCount > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-destructive" />
                    {shortCount} short
                  </span>
                )}
              </div>
            </div>
            <ul className="list-none p-0 mt-2 border-t border-border">
              {ingredientStatus.map(({ ing, scaled, inv, short, inPantry }, i) => (
                <li
                  key={i}
                  className="flex items-baseline gap-3 py-2.5 border-b border-dashed border-border"
                >
                  <span className="basis-20 sm:basis-24 shrink-0 font-mono text-[13px] font-semibold text-foreground tabular-nums text-right">
                    {scaled != null
                      ? `${formatAmount(scaled)}${ing.unit ? ` ${ing.unit}` : ""}`
                      : "—"}
                  </span>
                  <span className="flex-1 font-display text-[15px] text-foreground leading-[1.4]">
                    {ing.name}
                  </span>
                  {inPantry && (
                    <span
                      className="font-sans text-[10.5px] font-semibold px-[7px] py-[2px] rounded-full tracking-wide shrink-0 text-jade border"
                      style={{
                        background: "oklch(0.94 0.04 168)",
                        borderColor: "oklch(0.78 0.07 168)",
                      }}
                    >
                      in pantry
                    </span>
                  )}
                  {short != null && (
                    <span
                      className="font-sans text-[10.5px] font-semibold px-[7px] py-[2px] rounded-full tracking-wide shrink-0 text-destructive border border-destructive/30 bg-destructive/10"
                      title={`You have ${inv?.quantity}${inv?.unit ? ` ${inv.unit}` : ""}`}
                    >
                      short {formatAmount(short)}
                      {ing.unit ? ` ${ing.unit}` : ""}
                    </span>
                  )}
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
          <div className="recipe-prose">
            <Streamdown>
              {extractInstructions(selectedRecipe.instructions || "")}
            </Streamdown>
          </div>
        </section>
      </div>
    </>
  );
}

export default function RecipeDisplay() {
  const { selectedRecipe, exitRecipe } = useRecipeContext();

  const copyRecipe = async () => {
    try {
      await navigator.clipboard.writeText(selectedRecipe?.instructions || "");
      toast.success("Recipe copied to clipboard!");
    } catch {
      toast.error("Failed to copy recipe");
    }
  };

  if (!selectedRecipe) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Top strip — Back / Copy */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-dashed border-border shrink-0">
        <button
          onClick={exitRecipe}
          className="font-sans text-[11.5px] font-semibold tracking-[0.14em] uppercase text-ink-faint hover:text-foreground transition-colors cursor-pointer"
          aria-label="Back to cookbook"
        >
          ← Back to cookbook
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={copyRecipe}
            aria-label="Copy recipe to clipboard"
          >
            Copy
          </Button>
          <button
            onClick={exitRecipe}
            className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 3l10 10M13 3L3 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {selectedRecipe.steps && (selectedRecipe.steps as RecipeStep[]).length > 0 ? (
        // New structured recipe — render RecipeLetter (no onSave — it's already saved)
        <div className="flex-1 overflow-y-auto px-6 sm:px-9 py-7 pb-12">
          <RecipeLetter
            recipe={{
              title: selectedRecipe.name,
              description: selectedRecipe.description ?? undefined,
              totalTimeMinutes: selectedRecipe.totalTimeMinutes ?? undefined,
              baseServings: selectedRecipe.baseServings,
              ingredients: (selectedRecipe.ingredients as RecipeIngredient[]).map(ing => ({
                name: ing.name,
                amount: ing.amount != null ? String(ing.amount) : undefined,
                unit: ing.unit ?? undefined,
              })),
              steps: selectedRecipe.steps as RecipeStep[],
              tags: selectedRecipe.tags ?? undefined,
            }}
            // No onSave — recipe is already saved (it came from the cookbook)
          />
        </div>
      ) : (
        // Legacy recipe — fall back to existing layout (hero strip + body)
        <div className="flex-1 overflow-y-auto">
          <LegacyRecipeBody selectedRecipe={selectedRecipe} />
        </div>
      )}
    </div>
  );
}
