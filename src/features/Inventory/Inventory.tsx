"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConversationContext } from "@/contexts/ConversationContext";
import { useSessionContext } from "@/contexts/SessionContext";
import {
  Category,
  InventoryItem,
} from "@/lib/inventory/schemas";

type GetInventoryResponse = {
  kitchenwareInventory: InventoryItem[];
  ingredientInventory: InventoryItem[];
};
import { cn } from "@/lib/utils";
import { fetcher } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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
  selectionMode,
  selectedIds,
  onToggle,
}: {
  label: string;
  items: InventoryItem[];
  onRemove: (name: string) => void;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggle?: (id: string) => void;
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
        <InventoryItemRow
          key={item.id}
          item={item}
          onRemove={onRemove}
          selectionMode={selectionMode}
          selected={selectedIds?.has(item.id)}
          onToggle={onToggle}
        />
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

/** Composes the synthetic user message for Cook With What You Have. */
export function buildCookWithMessage(
  selectedIngredients: InventoryItem[],
  selectedEquipment: InventoryItem[],
): string {
  const names = selectedIngredients.map((i) => i.name).join(", ");
  const equipment = selectedEquipment.map((i) => i.name).join(", ");
  const ingredientClause = names || "no featured ingredients";
  if (equipment) {
    return `Suggest recipes using: ${ingredientClause}. Kitchenware: ${equipment}`;
  }
  return `Suggest recipes using: ${ingredientClause}`;
}

const Inventory = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { userId } = useSessionContext();
  const { queueCookWithMessage, startNewConversation } = useConversationContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Auto-enter selection mode when routed from Chat chip (?selectionMode=1)
  useEffect(() => {
    if (searchParams.get("selectionMode") === "1") {
      setSelectionMode(true);
      setSelectedIds(new Set());
      // Clear the param without re-rendering the parent
      router.replace("/?tab=pantry", { scroll: false });
    }
  }, [searchParams, router]);

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

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const enterSelectionMode = () => {
    setSelectionMode(true);
    setSelectedIds(new Set());
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleCookWithSubmit = () => {
    const allItems = [
      ...(data?.ingredientInventory ?? []),
      ...(data?.kitchenwareInventory ?? []),
    ];
    const selectedIngredients = allItems.filter(
      (i) => selectedIds.has(i.id) && i.type !== "kitchenware",
    );
    const selectedEquipment = allItems.filter(
      (i) => selectedIds.has(i.id) && i.type === "kitchenware",
    );

    if (selectedIngredients.length === 0 && selectedEquipment.length === 0) return;

    const message = buildCookWithMessage(selectedIngredients, selectedEquipment);

    // Reset selection — Conversation owns context from here
    exitSelectionMode();

    // Put Chat in staging state and queue the message
    startNewConversation();
    queueCookWithMessage(message);

    // Navigate to chat tab
    router.replace("/?tab=chat");
  };

  if (error) return <div>Error: {error.message}</div>;

  const { ingredientInventory = [], kitchenwareInventory = [] } = data || {};
  const ingredientGroups = groupIngredients(ingredientInventory);
  const equipmentItems = [...kitchenwareInventory].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const totalCount = ingredientInventory.length + kitchenwareInventory.length;

  // Selection counts
  const allItems = [...ingredientInventory, ...kitchenwareInventory];
  const selectedIngredients = allItems.filter(
    (i) => selectedIds.has(i.id) && i.type !== "kitchenware",
  );
  const selectedEquipment = allItems.filter(
    (i) => selectedIds.has(i.id) && i.type === "kitchenware",
  );
  const totalSelected = selectedIds.size;

  const ctaLabel = (() => {
    if (totalSelected === 0) return "Select items to cook";
    if (selectedIngredients.length === 0 && selectedEquipment.length > 0) {
      const names = selectedEquipment.map((i) => i.name).join(" & ");
      return `Surprise me with ${names}`;
    }
    return `Suggest recipe (${totalSelected} selected)`;
  })();

  return (
    <div className={cn("h-full overflow-y-auto", selectionMode && "pb-24")}>
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
              <p className="mt-1 font-display italic text-[13px] text-muted-foreground flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="inline-block h-1.5 w-1.5 rounded-full bg-tertiary shrink-0"
                />
                use soon
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!selectionMode ? (
              <>
                {totalCount > 0 && (
                  <button
                    onClick={enterSelectionMode}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold text-foreground bg-card border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                  >
                    Cook with what you have
                  </button>
                )}
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
              </>
            ) : (
              <button
                onClick={exitSelectionMode}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold text-muted-foreground bg-card border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors"
              >
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Mobile header row */}
        <div className="sm:hidden mb-3 flex items-center justify-between gap-2">
          {!selectionMode ? (
            <>
              {totalCount > 0 && (
                <button
                  onClick={enterSelectionMode}
                  className="inline-flex items-center gap-1.5 min-h-11 px-3 py-1.5 text-[12.5px] font-semibold text-foreground bg-card border border-border rounded-lg cursor-pointer"
                >
                  Cook with what you have
                </button>
              )}
              {!isAdding && (
                <button
                  onClick={() => setIsAdding(true)}
                  className="inline-flex items-center gap-1.5 min-h-11 px-3 py-1.5 text-[12.5px] font-semibold text-primary-foreground bg-primary border border-primary rounded-lg cursor-pointer shadow-[0_1px_0_oklch(0.46_0.135_35)] ml-auto"
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
              )}
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="font-display italic text-[14px] text-muted-foreground">
                {totalSelected > 0 ? `${totalSelected} selected` : "Tap items to select"}
              </span>
              <button
                onClick={exitSelectionMode}
                className="inline-flex items-center gap-1.5 min-h-11 px-3 py-1.5 text-[12.5px] font-semibold text-muted-foreground bg-card border border-border rounded-lg cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Use-soon legend — mobile only */}
        {!selectionMode && ingredientInventory.some((i) => i.shelfLife === "short") && (
          <p className="sm:hidden mb-3 font-display italic text-[13px] text-muted-foreground flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block h-1.5 w-1.5 rounded-full bg-tertiary shrink-0"
            />
            use soon
          </p>
        )}

        {/* Selection mode banner — desktop */}
        {selectionMode && (
          <div className="hidden sm:flex items-center justify-between gap-2 mb-4 px-3 py-2.5 bg-primary/5 border border-dashed border-primary/30 rounded-lg">
            <div className="flex items-center gap-2">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="text-primary shrink-0">
                <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-display italic text-[13px] text-muted-foreground">
                {totalSelected === 0
                  ? "Tap items to feature them — Ah Mah will build recipes around your picks."
                  : `${totalSelected} item${totalSelected !== 1 ? "s" : ""} selected`}
              </span>
            </div>
            {ingredientInventory.some((i) => i.shelfLife === "short") && (
              <button
                onClick={() => {
                  const shortIds = ingredientInventory
                    .filter((i) => i.shelfLife === "short")
                    .map((i) => i.id);
                  setSelectedIds((prev) => {
                    const next = new Set(prev);
                    shortIds.forEach((id) => next.add(id));
                    return next;
                  });
                }}
                className="shrink-0 inline-flex items-center gap-1 font-sans text-[10.5px] font-semibold text-[oklch(0.5_0.12_50)] border border-dashed border-[oklch(0.7_0.08_50)] rounded-full px-2 py-0.5 hover:bg-[oklch(0.97_0.03_60)] transition-colors cursor-pointer"
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-tertiary" />
                Select use-soon
              </button>
            )}
          </div>
        )}

        {/* Selection mode short-shelf shortcut — mobile */}
        {selectionMode && ingredientInventory.some((i) => i.shelfLife === "short") && (
          <div className="sm:hidden mb-3">
            <button
              onClick={() => {
                const shortIds = ingredientInventory
                  .filter((i) => i.shelfLife === "short")
                  .map((i) => i.id);
                setSelectedIds((prev) => {
                  const next = new Set(prev);
                  shortIds.forEach((id) => next.add(id));
                  return next;
                });
              }}
              className="inline-flex items-center gap-1 font-sans text-[11px] font-semibold text-[oklch(0.5_0.12_50)] border border-dashed border-[oklch(0.7_0.08_50)] rounded-full px-2.5 py-1 hover:bg-[oklch(0.97_0.03_60)] transition-colors cursor-pointer"
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-tertiary" />
              Select use-soon items
            </button>
          </div>
        )}

        {isAdding && !selectionMode && (
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

        {!isLoading && totalCount === 0 && !isAdding && !selectionMode && (
          <p className="font-display italic text-[14px] text-muted-foreground">
            Nothing in yet. Tell Ah Mah what you&rsquo;ve got &mdash; &ldquo;a bit of ginger, some eggs&rdquo; is enough.
          </p>
        )}

        {!isLoading && totalCount === 0 && selectionMode && (
          <p className="font-display italic text-[14px] text-muted-foreground">
            Your pantry is empty. Add some items first and Ah Mah can suggest what to cook.
          </p>
        )}

        {/* Category masonry */}
        {totalCount > 0 && (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 [&>*]:break-inside-avoid [&>*]:mb-3">
            {ingredientGroups.map((group) => (
              <CategoryCard
                key={group.label}
                label={group.label}
                items={group.items}
                onRemove={removeItem}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                onToggle={toggleItem}
              />
            ))}
            {equipmentItems.length > 0 && (
              <CategoryCard
                label="Equipment"
                items={equipmentItems}
                onRemove={removeItem}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                onToggle={toggleItem}
              />
            )}
          </div>
        )}
      </div>

      {/* Sticky bottom CTA — only in selection mode */}
      {selectionMode && (
        <div className="fixed bottom-0 left-0 right-0 z-20 px-4 py-3 bg-background/90 backdrop-blur-sm border-t border-border sm:absolute sm:bottom-0 sm:left-0 sm:right-0">
          <div className="max-w-5xl mx-auto">
            <button
              onClick={handleCookWithSubmit}
              disabled={totalSelected === 0}
              className={cn(
                "w-full py-3 px-4 rounded-xl font-semibold text-[14px] transition-all",
                totalSelected > 0
                  ? "bg-primary text-primary-foreground shadow-[0_1px_0_oklch(0.46_0.135_35)] hover:opacity-90 cursor-pointer"
                  : "bg-muted text-muted-foreground cursor-not-allowed",
              )}
            >
              {ctaLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
