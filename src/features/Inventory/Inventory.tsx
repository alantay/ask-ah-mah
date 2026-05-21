"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSessionContext } from "@/contexts/SessionContext";
import {
  Category,
  GetInventoryResponse,
  InventoryItem,
} from "@/lib/inventory/schemas";
import { fetcher } from "@/lib/utils/index";
import { useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { InventoryItemRow } from "./components/InventoryItemRow";

const CATEGORY_ORDER: Category[] = [
  "Protein",
  "Vegetable",
  "Carbs",
  "Condiments",
  "Spice",
  "Misc",
];

const CategoryCard = ({
  label,
  items,
  onRemove,
}: {
  label: string;
  items: InventoryItem[];
  onRemove: (name: string) => void;
}) => (
  <section className="bg-card border border-border rounded-lg p-4 shadow-[0_1px_0_var(--color-border-soft)]">
    <div className="flex items-baseline justify-between border-b border-dashed border-border pb-2 mb-2">
      <span className="font-sans text-[10.5px] font-bold tracking-[0.18em] uppercase text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-[11px] text-ink-faint tabular-nums">
        · {items.length}
      </span>
    </div>
    <ul className="list-none p-0 m-0">
      {items.map((item) => (
        <InventoryItemRow key={item.id} item={item} onRemove={onRemove} />
      ))}
    </ul>
  </section>
);

function groupIngredients(items: InventoryItem[]) {
  const map = new Map<Category, InventoryItem[]>(
    CATEGORY_ORDER.map((c) => [c, []]),
  );
  for (const item of items) {
    const key: Category = (item.category as Category) ?? "Misc";
    map.get(key)?.push(item);
  }
  return CATEGORY_ORDER.map((label) => ({
    label,
    items: (map.get(label) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((g) => g.items.length > 0);
}

const Inventory = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { userId } = useSessionContext();

  const { data, error, isLoading } = useSWR<GetInventoryResponse>(
    userId ? `/api/inventory?userId=${userId}` : null,
    fetcher,
    {
      shouldRetryOnError: true,
      revalidateOnMount: true,
    },
  );

  const onSubmit = async () => {
    if (!userId || !draft.trim() || submitting) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/inventory/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft, userId }),
      });

      if (response.ok) {
        const { items } = (await response.json()) as {
          items: { name: string }[];
        };
        setDraft("");
        setIsAdding(false);
        mutate(`/api/inventory?userId=${userId}`);
        toast.success(
          items.length === 1
            ? `${items[0].name} added`
            : `${items.length} items added`,
        );
      } else {
        toast.error("Couldn't parse that — try rephrasing");
      }
    } catch (e) {
      console.error("Failed to add items:", e);
      toast.error("Couldn't add items, try again");
    } finally {
      setSubmitting(false);
    }
  };

  const removeItem = async (itemName: string) => {
    if (!userId) return;
    try {
      const response = await fetch("/api/inventory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemNames: [itemName], userId }),
      });
      if (response.ok) {
        mutate(`/api/inventory?userId=${userId}`);
        toast.success(`${itemName} removed from inventory`);
      } else {
        const detail = await response.text().catch(() => "");
        console.error(`DELETE /api/inventory ${response.status}:`, detail);
        toast.error(`${itemName} failed to remove from inventory`);
      }
    } catch (e) {
      console.error("Failed to remove item:", e);
      toast.error(`${itemName} failed to remove from inventory`);
    }
  };

  if (error) return <div>Error: {error.message}</div>;

  const { ingredientInventory = [], kitchenwareInventory = [] } = data || {};
  const ingredientGroups = groupIngredients(ingredientInventory);
  const equipmentItems = [...kitchenwareInventory].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const totalCount = ingredientInventory.length + kitchenwareInventory.length;

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 sm:px-9 pt-4 sm:pt-7 pb-5">
        {/* Header — hidden on mobile (tab strip already labels this surface) */}
        <div className="hidden sm:flex sm:items-end sm:justify-between sm:gap-6 mb-5">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
              What Ah Mah sees
            </div>
            <h1 className="font-display font-semibold text-[40px] text-foreground leading-none tracking-tight">
              Your kitchen, today
            </h1>
            <p className="font-display italic text-[15px] text-muted-foreground mt-2">
              {totalCount} thing{totalCount !== 1 ? "s" : ""}. She jots them
              down as you chat.
            </p>
            {ingredientInventory.some((i) => i.shelfLife === "short") && (
              <div className="mt-2 flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="inline-block h-1.5 w-1.5 rounded-full bg-tertiary shrink-0"
                />
                <span className="font-sans text-[10.5px] font-bold tracking-[0.18em] uppercase text-muted-foreground">
                  Use soon
                </span>
              </div>
            )}
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold text-primary-foreground bg-primary border border-primary rounded-lg cursor-pointer shadow-[0_1px_0_oklch(0.46_0.135_35)] hover:opacity-90 transition-opacity shrink-0"
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path
                  d="M6 1.5V10.5M1.5 6H10.5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
              Add to pantry
            </button>
          )}
        </div>

        {/* Mobile-only add button (header is hidden) */}
        {!isAdding && (
          <div className="sm:hidden mb-3 flex justify-end">
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-semibold text-primary-foreground bg-primary border border-primary rounded-lg cursor-pointer shadow-[0_1px_0_oklch(0.46_0.135_35)]"
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path
                  d="M6 1.5V10.5M1.5 6H10.5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
              Add to pantry
            </button>
          </div>
        )}

        {isAdding && (
          <Card className="mb-5">
            <CardHeader>
              <CardTitle className="font-display text-xl tracking-tight">
                What did you get?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="e.g., 2 chicken breasts, some bok choy, 500g rice noodles, eggs, a wok"
                rows={4}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none"
                disabled={submitting}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false);
                    setDraft("");
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={onSubmit}
                  disabled={submitting || !draft.trim()}
                >
                  {submitting ? "Adding…" : "Add"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <p className="font-display italic text-[14px] text-muted-foreground">
            Looking in the pantry…
          </p>
        )}

        {!isLoading && totalCount === 0 && !isAdding && (
          <p className="font-display italic text-[14px] text-muted-foreground">
            Nothing in yet. Tell Ah Mah what you&rsquo;ve got &mdash; &ldquo;a bit of ginger, some eggs&rdquo; is enough.
          </p>
        )}

        {/* Category masonry — CSS columns let cards flow and pack vertical gaps */}
        {totalCount > 0 && (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 [&>*]:break-inside-avoid [&>*]:mb-3">
            {ingredientGroups.map((group) => (
              <CategoryCard
                key={group.label}
                label={group.label}
                items={group.items}
                onRemove={removeItem}
              />
            ))}
            {equipmentItems.length > 0 && (
              <CategoryCard
                label="Equipment"
                items={equipmentItems}
                onRemove={removeItem}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
