"use client";

import { canonicalTipKey } from "@/lib/marketTips/canonicalKey";
import { isPickableCategory } from "@/lib/marketTips/pickable";
import useSWR from "swr";

interface TipItem {
  name: string;
  category?: string | null;
}

/**
 * Fetches Ah Mah's picking tips for a set of (missing) ingredients.
 * Only pickable items are requested; the SWR key is the sorted canonical
 * names, so identical lists dedupe and tips are cached for an hour.
 * Returns a canonical-key → tip map ("" means no tip).
 *
 * Pass `enabled = false` (e.g. when the surface's tips toggle is off) to skip
 * the request entirely — the SWR key goes null, so no network call is made.
 */
export function useMarketTips(
  items: TipItem[],
  enabled = true,
): Record<string, string> {
  const pickable = items.filter((i) => isPickableCategory(i.category));
  const swrKey =
    enabled && pickable.length
      ? `market-tip:${pickable
          .map((i) => canonicalTipKey(i.name))
          .sort()
          .join("|")}`
      : null;

  const { data } = useSWR<{ tips: Record<string, string> }>(
    swrKey,
    async () => {
      const res = await fetch("/api/market-tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: pickable }),
      });
      if (!res.ok) throw new Error("market-tip fetch failed");
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

  return data?.tips ?? {};
}
