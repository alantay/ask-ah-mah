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
import { ReactNode, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { InventoryItemBadge } from "./components/InventoryItemBadge";

const CATEGORY_ORDER: Category[] = ["Protein", "Carbs", "Vegetable", "Condiments", "Spice", "Misc"];

function groupByCategory(items: InventoryItem[]): { label: Category; items: InventoryItem[] }[] {
  const map = new Map<Category, InventoryItem[]>(CATEGORY_ORDER.map((c) => [c, []]));
  for (const item of items) {
    const key: Category = (item.category as Category) ?? "Misc";
    map.get(key)?.push(item);
  }
  return CATEGORY_ORDER.map((label) => ({ label, items: map.get(label)! })).filter(
    (g) => g.items.length > 0,
  );
}

const SectionLabel = ({ children, count }: { children: ReactNode; count?: number }) => (
  <div className="flex items-center justify-between border-b border-dashed border-border pb-2.5 mb-3">
    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{children}</span>
    {count !== undefined && (
      <span className="font-mono text-[11px] text-ink-faint tabular-nums">{count}</span>
    )}
  </div>
);

const Inventory = ({ onClose }: { onClose?: () => void }) => {
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
    }
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
        const { items } = (await response.json()) as { items: { name: string }[] };
        setDraft("");
        setIsAdding(false);
        mutate(`/api/inventory?userId=${userId}`);
        toast.success(
          items.length === 1
            ? `${items[0].name} added`
            : `${items.length} items added`
        );
      } else {
        toast.error("Couldn't parse that — try rephrasing");
      }
    } catch (error) {
      console.error("Failed to add items:", error);
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemNames: [itemName], userId }),
      });
      if (response.ok) {
        mutate(`/api/inventory?userId=${userId}`);
        toast.success(`${itemName} removed from inventory`);
      }
    } catch (error) {
      console.error("Failed to remove item:", error);
      toast.error(`${itemName} failed to remove from inventory`);
    }
  };

  if (error) return <div>Error: {error.message}</div>;

  const { kitchenwareInventory, ingredientInventory } = data || {};
  const ingredientsSorted = ingredientInventory?.sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const kitchenwareSorted = kitchenwareInventory?.sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const hasShortShelfItem =
    (ingredientInventory ?? []).some((i) => i.shelfLife === "short") ||
    (kitchenwareInventory ?? []).some((i) => i.shelfLife === "short");

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300 p-5 h-full">
      {/* Pantry header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-display italic font-medium text-[22px] text-foreground leading-tight tracking-tight">
            Pantry
          </div>
          <div className="text-xs text-ink-faint mt-0.5">What&rsquo;s in your kitchen</div>
          {hasShortShelfItem && (
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-ink-faint">
              <span className="inline-block h-2 w-2 rounded-full bg-tertiary shrink-0" />
              Short shelf life — use soon
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {onClose && (
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-md bg-card border border-border flex items-center justify-center text-ink-faint hover:text-foreground transition-colors cursor-pointer"
              aria-label="Close pantry"
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-foreground bg-card border border-border rounded-lg shadow-[0_1px_0_oklch(0.82_0.04_70)] hover:bg-background transition-colors cursor-pointer"
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M6 1.5V10.5M1.5 6H10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              Add
            </button>
          )}
        </div>
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl tracking-tight">What did you get?</CardTitle>
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
                {submitting ? "Adding..." : "Add"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ingredients card — grouped by category */}
      <section className="bg-card border border-border rounded-xl p-3.5 shadow-[0_1px_0_oklch(0.87_0.03_72),0_8px_18px_-16px_oklch(0.3_0.05_50/0.4)]">
        <SectionLabel count={ingredientsSorted?.length ?? 0}>Ingredients</SectionLabel>
        {isLoading && <p className="text-xs text-muted-foreground font-display italic">Looking in the pantry…</p>}
        {!isLoading && ingredientsSorted?.length === 0 ? (
          <p className="text-[13px] font-display italic text-ink-faint leading-snug">
            Add what&rsquo;s in your fridge — Ah Mah understands &ldquo;a bit of ginger&rdquo;.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {groupByCategory(ingredientsSorted ?? []).map((group) => (
              <div key={group.label}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-sans text-[9.5px] font-bold tracking-[0.18em] uppercase text-ink-faint shrink-0">
                    {group.label}
                  </span>
                  <span className="flex-1 border-t border-dotted border-border" />
                  <span className="font-mono text-[10px] text-ink-faint tabular-nums shrink-0">
                    {group.items.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <InventoryItemBadge key={item.id} item={item} onRemove={removeItem} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Equipment card */}
      <section className="bg-card border border-border rounded-xl p-3.5 shadow-[0_1px_0_oklch(0.87_0.03_72),0_8px_18px_-16px_oklch(0.3_0.05_50/0.4)]">
        <SectionLabel count={kitchenwareSorted?.length ?? 0}>Equipment</SectionLabel>
        {isLoading && <p className="text-xs text-muted-foreground font-display italic">Rummaging through the cupboards…</p>}
        {!isLoading && kitchenwareSorted?.length === 0 ? (
          <p className="text-[13px] font-display italic text-ink-faint leading-snug">
            Got a wok? A pressure cooker? Tell Ah Mah what you cook with.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {kitchenwareSorted?.map((item: InventoryItem) => (
              <InventoryItemBadge key={item.id} item={item} onRemove={removeItem} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Inventory;
