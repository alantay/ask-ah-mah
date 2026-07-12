"use client";

import { canonicalTipKey } from "@/lib/marketTips/canonicalKey";
import { isPickableCategory } from "@/lib/marketTips/pickable";
import { marketTipKey, storageTipKey } from "@/lib/swr/keys";
import useSWR from "swr";

interface TipItem {
  name: string;
  category?: string | null;
  type?: string | null;
}

type TipsKind = "market" | "storage";

const TIPS_CONFIG: Record<
  TipsKind,
  {
    endpoint: string;
    buildKey: (canonicalNames: string[]) => string;
    // Market tips only ask about pickable items (staples like salt, sugar
    // return no tip); storage tips cover every item, so no filter.
    filter?: (item: TipItem) => boolean;
  }
> = {
  market: {
    endpoint: "/api/market-tip",
    buildKey: marketTipKey,
    filter: (item) => isPickableCategory(item.category),
  },
  storage: {
    endpoint: "/api/storage-tip",
    buildKey: storageTipKey,
  },
};

/**
 * Fetches Ah Mah's tips (market picking tips or home-storage tips) for a set
 * of items. The SWR key is the sorted canonical names, so identical lists
 * dedupe and tips are cached for an hour. Returns a canonical-key → tip map
 * ("" means no tip) alongside `isLoading`, which stays true for the duration
 * of any in-flight request (initial fetch or revalidation after the item
 * list changes) — callers use it to show a placeholder instead of leaving a
 * toggled-on tip line silently blank.
 *
 * Pass `enabled = false` (e.g. when the surface's tips toggle is off) to
 * skip the request entirely — the SWR key goes null, so no network call is
 * made.
 */
export function useTips(
  kind: TipsKind,
  items: TipItem[],
  enabled = true,
): { tips: Record<string, string>; isLoading: boolean } {
  const { endpoint, buildKey, filter } = TIPS_CONFIG[kind];
  const relevant = filter ? items.filter(filter) : items;
  const swrKey =
    enabled && relevant.length
      ? buildKey(relevant.map((i) => canonicalTipKey(i.name)))
      : null;

  const { data, isValidating } = useSWR<{ tips: Record<string, string> }>(
    swrKey,
    async () => {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: relevant }),
      });
      if (!res.ok) throw new Error(`${kind}-tip fetch failed`);
      return res.json();
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 1000 * 60 * 60,
      // Adding/removing a list item changes the key; keep the prior tips on
      // screen while the new request resolves instead of blanking every row.
      keepPreviousData: true,
    },
  );

  // keepPreviousData holds the last tips even after the key goes null, so the
  // disabled return must be gated explicitly — otherwise toggling off never
  // clears the tips already on screen.
  return enabled
    ? { tips: data?.tips ?? {}, isLoading: isValidating }
    : { tips: {}, isLoading: false };
}
