import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRecipeContext } from "@/contexts/RecipeContext";
import { useSessionContext } from "@/contexts/SessionContext";
import {
  GetInventoryResponse,
  InventoryItem,
} from "@/lib/inventory/schemas";
import { RecipeIngredient } from "@/lib/recipes/schemas";
import { tagClasses } from "@/lib/recipes/tagColors";
import { fetcher } from "@/lib/utils/index";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import useSWR from "swr";

const formatAmount = (n: number) => {
  if (Number.isInteger(n)) return String(n);
  return Number(n.toFixed(2)).toString();
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
  // Strict match: both must have numeric quantity, identical unit string.
  if (!inv) return null;
  if (inv.quantity == null) return null; // unquantified inventory = unlimited
  if (!recipeUnit || !inv.unit) return null;
  if (recipeUnit.toLowerCase() !== inv.unit.toLowerCase()) return null;
  const diff = scaledAmount - inv.quantity;
  return diff > 0 ? diff : null;
};

export default function RecipeDisplay() {
  const { selectedRecipe } = useRecipeContext();
  const { userId } = useSessionContext();
  const [servings, setServings] = useState<number>(
    selectedRecipe?.baseServings ?? 2,
  );

  // Reset stepper when the user switches recipes.
  useEffect(() => {
    setServings(selectedRecipe?.baseServings ?? 2);
  }, [selectedRecipe?.id, selectedRecipe?.baseServings]);

  const { data: inventoryData } = useSWR<GetInventoryResponse>(
    userId ? `/api/inventory?userId=${userId}` : null,
    fetcher,
  );

  const copyRecipe = async () => {
    try {
      await navigator.clipboard.writeText(selectedRecipe?.instructions || "");
      toast.success("Recipe copied to clipboard!");
    } catch {
      toast.error("Failed to copy recipe");
    }
  };

  if (!selectedRecipe) return null;

  const baseServings = selectedRecipe.baseServings || 2;
  const ingredients = (selectedRecipe.ingredients || []) as RecipeIngredient[];
  const allInventory = [
    ...(inventoryData?.ingredientInventory ?? []),
    ...(inventoryData?.kitchenwareInventory ?? []),
  ];
  const scale = servings / baseServings;

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end p-4 pb-0">
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={copyRecipe}
          aria-label="Copy recipe to clipboard"
        >
          Copy
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto pt-4 pb-10 px-4">
        {selectedRecipe.tags && selectedRecipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedRecipe.tags.map((tag: string) => (
              <Badge key={tag} variant="outline" className={tagClasses(tag)}>
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {ingredients.length > 0 && (
          <div className="mb-6 rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold tracking-tight">Ingredients</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Servings</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setServings((s) => Math.max(1, s - 1))}
                  disabled={servings <= 1}
                  aria-label="Decrease servings"
                >
                  −
                </Button>
                <span className="w-8 text-center font-medium">{servings}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setServings((s) => Math.min(20, s + 1))}
                  disabled={servings >= 20}
                  aria-label="Increase servings"
                >
                  +
                </Button>
              </div>
            </div>

            <ul className="space-y-1.5 text-sm">
              {ingredients.map((ing, idx) => {
                const scaled =
                  ing.amount != null ? ing.amount * scale : undefined;
                const inv = findInventoryMatch(ing, allInventory);
                const short =
                  scaled != null
                    ? computeShortfall(scaled, ing.unit, inv)
                    : null;
                return (
                  <li key={idx} className="flex items-baseline gap-2">
                    <span>
                      {scaled != null && (
                        <span className="font-medium">
                          {formatAmount(scaled)}
                          {ing.unit ? ` ${ing.unit}` : ""}{" "}
                        </span>
                      )}
                      <span>{ing.name}</span>
                    </span>
                    {short != null && (
                      <span
                        className="text-xs text-destructive bg-destructive/10 border border-destructive/30 px-1.5 py-0.5 rounded"
                        title={`You have ${inv?.quantity}${inv?.unit ? ` ${inv.unit}` : ""}`}
                      >
                        short {formatAmount(short)}
                        {ing.unit ? ` ${ing.unit}` : ""}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <Streamdown>{selectedRecipe.instructions || ""}</Streamdown>
      </div>
    </div>
  );
}
