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
import { Eyebrow } from "@/features/shared/components/recipe";
import { TipsToggle } from "@/features/shared/components/TipsToggle";
import { useStorageTips } from "@/hooks/useStorageTips";
import { useTipsPreference } from "@/hooks/useTipsPreference";
import { canonicalTipKey } from "@/lib/marketTips/canonicalKey";
import { STORAGE_TIPS_PREF_KEY } from "@/lib/marketTips/preferences";
import { Check, CookingPot, Plus, X } from "lucide-react";
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
  tips,
  tipsLoading,
}: {
  label: string;
  items: InventoryItem[];
  onRemove: (name: string) => void;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggle?: (id: string) => void;
  tips?: Record<string, string>;
  tipsLoading?: boolean;
}) => (
  <section className="bg-card border border-border rounded-lg p-4 shadow-[0_1px_0_var(--color-border-soft)]">
    <div className="flex items-baseline justify-between border-b border-dashed border-border pb-2 mb-2">
      <span className="font-display italic text-dense text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-micro text-ink-faint tabular-nums">
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
          storageTip={tips?.[canonicalTipKey(item.name)]}
          storageTipLoading={tipsLoading && !tips?.[canonicalTipKey(item.name)]}
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
  // Set when we enter selection mode before inventory data is in hand (e.g.
  // routed from the Chat chip) — seeds "all selected" once the data lands.
  const [seedAllOnLoad, setSeedAllOnLoad] = useState(false);

  const { userId } = useSessionContext();
  const { queueCookWithMessage, startNewConversation } = useConversationContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data, error, isLoading } = useSWR<GetInventoryResponse>(
    userId ? `/api/inventory?userId=${userId}` : null,
    fetcher,
    {
      shouldRetryOnError: true,
      revalidateOnMount: true,
    },
  );

  // Auto-enter selection mode when routed from Chat chip (?selectionMode=1).
  // Data may not be loaded yet, so defer the all-select seed to the effect below.
  useEffect(() => {
    if (searchParams.get("selectionMode") === "1") {
      setSelectionMode(true);
      setSeedAllOnLoad(true);
      // Clear the param without re-rendering the parent
      router.replace("/?tab=pantry", { scroll: false });
    }
  }, [searchParams, router]);

  // Once data is available, seed the deferred "all selected" set exactly once.
  useEffect(() => {
    if (!seedAllOnLoad || !data) return;
    const ids = [...data.ingredientInventory, ...data.kitchenwareInventory].map(
      (i) => i.id,
    );
    setSelectedIds(new Set(ids));
    setSeedAllOnLoad(false);
  }, [seedAllOnLoad, data]);

  // Ah Mah's "keep it well at home" tips, shown per item. Default OFF (opt-in);
  // toggling off (or being in selection mode) nulls the fetch. See ADR-0017.
  const [tipsOn, setTipsOn] = useTipsPreference(STORAGE_TIPS_PREF_KEY, false);
  const tipItems = [
    ...(data?.ingredientInventory ?? []),
    ...(data?.kitchenwareInventory ?? []),
  ].map((i) => ({ name: i.name, type: i.type }));
  const showTips = tipsOn && !selectionMode;
  const { tips: storageTips, isLoading: storageTipsLoading } = useStorageTips(
    tipItems,
    showTips,
  );

  const onSubmit = async () => {
    if (!userId || !draft.trim() || submitting) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/inventory/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft }),
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
            ? `${items[0].name} — in the pantry now.`
            : `${items.length} things, all noted down.`,
        );
      } else {
        toast.error("Aiyah, didn't catch that — say it another way?");
      }
    } catch (e) {
      console.error("Failed to add items:", e);
      toast.error("Aiyah, couldn't note that down. Try again?");
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
        body: JSON.stringify({ itemNames: [itemName] }),
      });
      if (response.ok) {
        mutate(`/api/inventory?userId=${userId}`);
        toast.success(`Okay, took out the ${itemName}.`);
      } else {
        const detail = await response.text().catch(() => "");
        console.error(`DELETE /api/inventory ${response.status}:`, detail);
        toast.error(`Aiyah, ${itemName} won't budge. Try again?`);
      }
    } catch (e) {
      console.error("Failed to remove item:", e);
      toast.error(`Aiyah, ${itemName} won't budge. Try again?`);
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

  const allItemIds = () =>
    [
      ...(data?.ingredientInventory ?? []),
      ...(data?.kitchenwareInventory ?? []),
    ].map((i) => i.id);

  // Selection starts with the whole pantry checked; the user deselects what
  // they don't feel like cooking with tonight.
  const enterSelectionMode = () => {
    setSelectionMode(true);
    setSelectedIds(new Set(allItemIds()));
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
    // Cancel any pending deferred seed so it can't repopulate selection after
    // SWR data lands once we've already left selection mode.
    setSeedAllOnLoad(false);
  };

  const selectAll = () => setSelectedIds(new Set(allItemIds()));
  const clearAll = () => setSelectedIds(new Set());

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

    // The whole pantry checked == nothing featured: both send the relaxed
    // "cook from everything" request, never a kitchen-sink list of every item.
    // A genuine Featured Selection only exists for a proper subset. (ADR-0007)
    const isWholePantry = selectedIds.size === allItems.length;
    const message = isWholePantry
      ? buildCookWithMessage([], [])
      : buildCookWithMessage(selectedIngredients, selectedEquipment);

    // Reset selection — Conversation owns context from here
    exitSelectionMode();

    // Put Chat in staging state and queue the message
    startNewConversation();
    queueCookWithMessage(message);

    // Navigate to chat tab
    router.replace("/?tab=chat");
  };

  if (error) {
    console.error("[Inventory]", error);
    return <div>Aiyah, the pantry door is stuck — try again?</div>;
  }

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

  const allSelected = totalCount > 0 && totalSelected === totalCount;
  const ctaLabel = (() => {
    if (totalSelected === 0) return "Select items to cook";
    if (allSelected) return "Cook with everything";
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
            <Eyebrow className="block mb-1.5">What you&apos;ve got</Eyebrow>
            <h1 className="font-display font-semibold text-display text-foreground leading-none tracking-tight">
              Your kitchen, today
            </h1>
            <p className="font-display italic text-emphasis text-muted-foreground mt-2">
              {totalCount} thing{totalCount !== 1 ? "s" : ""}. Ah Mah jots them
              down as you chat.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!selectionMode ? (
              <>
                {totalCount > 0 && (
                  <Button
                    variant="cta"
                    onClick={enterSelectionMode}
                    className="gap-1.5 px-3.5 py-2 text-dense font-semibold shrink-0"
                  >
                    <CookingPot className="size-[15px]" />
                    Cook with what you have
                  </Button>
                )}
                {!isAdding && (
                  <Button
                    variant={totalCount > 0 ? "outline" : "cta"}
                    onClick={() => setIsAdding(true)}
                    className="gap-1.5 px-3.5 py-2 text-dense font-semibold shrink-0"
                  >
                    <Plus className="size-[15px]" />
                    Add to pantry
                  </Button>
                )}
              </>
            ) : (
              <Button
                variant="outline"
                onClick={exitSelectionMode}
                className="gap-1.5 px-3.5 py-2 text-dense font-semibold text-muted-foreground shrink-0"
              >
                <X className="size-[15px]" />
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Mobile header row */}
        <div className="sm:hidden mb-3 flex items-center justify-between gap-2">
          {!selectionMode ? (
            <>
              {totalCount > 0 && (
                <Button
                  variant="cta"
                  onClick={enterSelectionMode}
                  className="gap-1.5 min-h-11 px-3 py-1.5 text-xs font-semibold"
                >
                  <CookingPot className="size-[14px]" />
                  Cook with what you have
                </Button>
              )}
              {!isAdding && (
                <Button
                  variant={totalCount > 0 ? "outline" : "cta"}
                  onClick={() => setIsAdding(true)}
                  className="gap-1.5 min-h-11 px-3 py-1.5 text-xs font-semibold ml-auto"
                >
                  <Plus className="size-[14px]" />
                  Add to pantry
                </Button>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between w-full gap-2">
              <span className="font-display italic text-emphasis text-muted-foreground">
                {totalSelected > 0
                  ? `${totalSelected} of ${totalCount} selected`
                  : "Nothing selected"}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="ghost"
                  onClick={totalSelected > 0 ? clearAll : selectAll}
                  className="min-h-11 px-2.5 py-1.5 text-xs font-semibold text-primary-deep"
                >
                  {totalSelected > 0 ? "Clear all" : "Select all"}
                </Button>
                <Button
                  variant="outline"
                  onClick={exitSelectionMode}
                  className="gap-1.5 min-h-11 px-3 py-1.5 text-xs font-semibold text-muted-foreground"
                >
                  <X className="size-[14px]" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Selection mode banner — desktop */}
        {selectionMode && totalCount > 0 && (
          <div className="hidden sm:flex items-center justify-between gap-2 mb-4 px-3 py-2.5 bg-primary/5 border border-dashed border-primary/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Check className="size-[13px] text-primary shrink-0" />
              <span className="font-display italic text-dense text-muted-foreground">
                {totalSelected === 0
                  ? "Nothing selected — tick what you'd like to cook with."
                  : allSelected
                    ? "Cooking with everything. Untick anything you'd rather skip."
                    : `${totalSelected} of ${totalCount} selected`}
              </span>
            </div>
            <button
              onClick={totalSelected > 0 ? clearAll : selectAll}
              className="font-sans text-dense font-semibold text-primary-deep hover:text-primary cursor-pointer shrink-0"
            >
              {totalSelected > 0 ? "Clear all" : "Select all"}
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
          <p className="font-display italic text-emphasis text-muted-foreground">
            Looking in the pantry…
          </p>
        )}

        {!isLoading && totalCount === 0 && !isAdding && !selectionMode && (
          <p className="font-display italic text-emphasis text-muted-foreground">
            Nothing in yet. Tell Ah Mah what you&rsquo;ve got &mdash; &ldquo;a bit of ginger, some eggs&rdquo; is enough.
          </p>
        )}

        {!isLoading && totalCount === 0 && selectionMode && (
          <p className="font-display italic text-emphasis text-muted-foreground">
            Pantry&rsquo;s empty for now. Add a few things first, then Ah Mah can suggest what to cook.
          </p>
        )}

        {/* Storage tips toggle — opt-in, hidden during selection */}
        {totalCount > 0 && !selectionMode && (
          <div className="flex justify-end mb-3">
            <TipsToggle
              enabled={tipsOn}
              onChange={setTipsOn}
              label="Tips"
            />
          </div>
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
                tips={showTips ? storageTips : {}}
                tipsLoading={showTips && storageTipsLoading}
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
                tips={showTips ? storageTips : {}}
                tipsLoading={showTips && storageTipsLoading}
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
                "w-full py-3 px-4 rounded-xl font-semibold text-emphasis transition-all",
                totalSelected > 0
                  ? "bg-primary-deep text-white border border-primary-deep shadow-cta hover:opacity-90 cursor-pointer"
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
