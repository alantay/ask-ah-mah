"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSessionContext } from "@/contexts/SessionContext";
import { Eyebrow } from "@/features/shared/components/recipe";
import { cn, fetcher } from "@/lib/utils";
import { Check, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";

type ShoppingListRow = {
  id: string;
  name: string;
  bought: boolean;
};

type GetShoppingListResponse = { items: ShoppingListRow[] };

const ShoppingList = () => {
  const { userId } = useSessionContext();
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
        body: JSON.stringify({ userId, items: [{ name }] }),
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
        body: JSON.stringify({ userId, ...body }),
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
          <ul className="list-none p-0 m-0 bg-card border border-border rounded-lg divide-y divide-dashed divide-border">
            {items.map((item) => (
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
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${item.name}`}
                  onClick={() => removeItem(item)}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
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
