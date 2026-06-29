"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSessionContext } from "@/contexts/SessionContext";
import { Eyebrow } from "@/features/shared/components/recipe";
import { TipsToggle } from "@/features/shared/components/TipsToggle";
import { useMarketTips } from "@/hooks/useMarketTips";
import { useTipsPreference } from "@/hooks/useTipsPreference";
import { MARKET_TIPS_PREF_KEY } from "@/lib/marketTips/preferences";
import { canonicalTipKey } from "@/lib/marketTips/canonicalKey";
import { groupByAisle } from "@/lib/shoppingList";
import { cn, fetcher } from "@/lib/utils";
import { Check, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";

type ShoppingListRow = {
  id: string;
  name: string;
  bought: boolean;
  category?: string | null;
};

type GetShoppingListResponse = { items: ShoppingListRow[] };

const ShoppingList = () => {
  const { userId } = useSessionContext();
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Pending-row signature we've already asked the API to classify, so the
  // effect fires once per distinct set of uncategorised rows (no loop).
  const classifyRequestedRef = useRef("");

  const key = userId
    ? `/api/shopping-list?userId=${encodeURIComponent(userId)}`
    : null;
  const { data, isLoading, error } = useSWR<GetShoppingListResponse>(
    key,
    fetcher,
    { revalidateOnMount: true },
  );

  const onSubmit = async () => {
    const name = draft.trim();
    if (!userId || !name || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ name }] }),
      });
      if (res.ok) {
        setDraft("");
        mutate(`/api/shopping-list?userId=${encodeURIComponent(userId)}`);
        toast.success(`${name} — on the list.`);
      } else {
        toast.error("Aiyah, couldn't add that. Try again?");
      }
    } catch (e) {
      console.error("Failed to add to shopping list:", e);
      toast.error("Aiyah, couldn't add that. Try again?");
    } finally {
      setSubmitting(false);
    }
  };

  const revalidate = () => {
    if (userId) {
      mutate(`/api/shopping-list?userId=${encodeURIComponent(userId)}`);
    }
  };

  const mutateList = async (
    method: "PATCH" | "DELETE",
    body: Record<string, unknown>,
  ) => {
    if (!userId) return;
    try {
      const res = await fetch("/api/shopping-list", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        revalidate();
      } else {
        toast.error("Aiyah, that didn't work. Try again?");
      }
    } catch (e) {
      console.error("Failed to update shopping list:", e);
      toast.error("Aiyah, that didn't work. Try again?");
    }
  };

  const toggleBought = (item: ShoppingListRow) =>
    mutateList("PATCH", { id: item.id, bought: !item.bought });

  const removeItem = (item: ShoppingListRow) =>
    mutateList("DELETE", { id: item.id });

  const clearBought = () => mutateList("DELETE", { clearBought: true });

  const items = data?.items ?? [];
  const hasBought = items.some((item) => item.bought);

  // A typed-in item lands with no category and rests in "Other"; once the list
  // is loaded, ask the API to assign it an aisle, then revalidate so it shifts.
  // Mirrors the Market Tip fetch — the add never blocks on classification.
  const pendingSig = items
    .filter((item) => !item.category)
    .map((item) => item.id)
    .sort()
    .join(",");
  useEffect(() => {
    if (!userId || !pendingSig) return;
    if (classifyRequestedRef.current === pendingSig) return;
    classifyRequestedRef.current = pendingSig;
    fetch("/api/shopping-list/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => {
        if (res.ok) revalidate();
        // Clear the guard on failure so the next revalidation can retry,
        // instead of parking these items in "Other" until a reload.
        else classifyRequestedRef.current = "";
      })
      .catch((e) => {
        classifyRequestedRef.current = "";
        console.error("Failed to classify shopping list:", e);
      });
    // revalidate is stable enough; key the effect on the pending set + user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSig, userId]);

  const aisleGroups = groupByAisle(items);

  // Ah Mah's picking tips at the moment of buying. The hook only asks the model
  // about pickable items, so staples (salt, sugar, flour) return no tip.
  // Default ON; toggling off skips the fetch entirely.
  const [tipsOn, setTipsOn] = useTipsPreference(MARKET_TIPS_PREF_KEY, true);
  const tips = useMarketTips(
    items.map((item) => ({ name: item.name, category: item.category })),
    tipsOn,
  );

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 sm:px-9 pt-4 sm:pt-7 pb-5">
        <div className="hidden sm:block mb-5">
          <Eyebrow className="block mb-1.5">What to get</Eyebrow>
          <h1 className="font-display font-semibold text-display text-foreground leading-none tracking-tight">
            Your shopping list
          </h1>
          <p className="font-display italic text-emphasis text-muted-foreground mt-2">
            {items.length} thing{items.length !== 1 ? "s" : ""} to pick up.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="flex gap-2 mb-5"
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g., apples, oranges, shallots"
            disabled={submitting}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={submitting || !draft.trim()}
            className="gap-1.5 font-semibold shrink-0"
          >
            <Plus className="size-[15px]" />
            Add
          </Button>
        </form>

        {isLoading && (
          <p className="font-display italic text-emphasis text-muted-foreground">
            Looking at the list…
          </p>
        )}

        {!isLoading && items.length === 0 && (
          <p className="font-display italic text-emphasis text-muted-foreground">
            Nothing to buy yet. Add what you need above &mdash; or tap the cart
            on a recipe&rsquo;s missing ingredient.
          </p>
        )}

        {items.length > 0 && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-end">
              <TipsToggle
                enabled={tipsOn}
                onChange={setTipsOn}
                label="Tips"
              />
            </div>
            {aisleGroups.map((group) => (
              <section key={group.aisle}>
                <Eyebrow className="block mb-2 px-1">{group.aisle}</Eyebrow>
                <ul className="list-none p-0 m-0 bg-card border border-border rounded-lg divide-y divide-dashed divide-border">
                  {group.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 px-4 py-3 font-display text-emphasis"
                    >
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={item.bought}
                        aria-label={item.name}
                        onClick={() => toggleBought(item)}
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                          item.bought
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-border text-transparent hover:border-primary",
                        )}
                      >
                        <Check className="size-3" strokeWidth={3} />
                      </button>
                      <span
                        className={cn(
                          "flex-1",
                          item.bought
                            ? "line-through text-muted-foreground"
                            : "text-foreground",
                        )}
                      >
                        {item.name}
                        {tipsOn && !item.bought && tips[canonicalTipKey(item.name)] && (
                          <span className="block font-display italic text-dense text-muted-foreground leading-snug">
                            — {tips[canonicalTipKey(item.name)]}
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => removeItem(item)}
                        className="shrink-0 -mr-1 flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      >
                        <X className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        {hasBought && (
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={clearBought}
              className="font-display text-muted-foreground hover:text-foreground"
            >
              Clear bought
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingList;
