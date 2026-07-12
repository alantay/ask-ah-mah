"use client";

import { canonicalTipKey } from "@/lib/marketTips/canonicalKey";
import { storageTipKey } from "@/lib/swr/keys";
import useSWR from "swr";

interface TipItem {
  name: string;
  type?: string | null;
}

/**
 * Fetches Ah Mah's "keep it well at home" tips for a set of pantry items.
 * The SWR key is the sorted canonical names, so identical lists dedupe and
 * tips are cached for an hour. Returns a canonical-key → tip map ("" = no
 * tip) alongside `isLoading`, which stays true for the duration of any
 * in-flight request (initial fetch or revalidation after the item list
 * changes) — callers use it to show a placeholder instead of leaving a
 * toggled-on tip line silently blank.
 *
 * Pass `enabled = false` (the Pantry tips toggle is off, and defaults off) to
 * skip the request entirely — the SWR key goes null, so no network call fires.
 */
export function useStorageTips(
  items: TipItem[],
  enabled = true,
): { tips: Record<string, string>; isLoading: boolean } {
  const swrKey =
    enabled && items.length
      ? storageTipKey(items.map((i) => canonicalTipKey(i.name)))
      : null;

  const { data, isValidating } = useSWR<{ tips: Record<string, string> }>(
    swrKey,
    async () => {
      const res = await fetch("/api/storage-tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error("storage-tip fetch failed");
      return res.json();
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 1000 * 60 * 60,
      // Adding/removing an item changes the key; keep the prior tips on screen
      // while the new request resolves instead of blanking every row.
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
