"use client";

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
 */
export function useMarketTips(items: TipItem[]): Record<string, string> {
  const pickable = items.filter((i) => isPickableCategory(i.category));
  const swrKey = pickable.length
    ? `market-tip:${pickable
        .map((i) => i.name.trim().toLowerCase())
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
    { revalidateOnFocus: false, dedupingInterval: 1000 * 60 * 60 },
  );

  return data?.tips ?? {};
}
