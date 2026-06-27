"use client";

import { canonicalTipKey } from "@/lib/marketTips/canonicalKey";
import useSWR from "swr";

interface TipItem {
  name: string;
  type?: string | null;
}

/**
 * Fetches Ah Mah's "keep it well at home" tips for a set of pantry items.
 * The SWR key is the sorted canonical names, so identical lists dedupe and
 * tips are cached for an hour. Returns a canonical-key → tip map ("" = no tip).
 *
 * Pass `enabled = false` (the Pantry tips toggle is off, and defaults off) to
 * skip the request entirely — the SWR key goes null, so no network call fires.
 */
export function useStorageTips(
  items: TipItem[],
  enabled = true,
): Record<string, string> {
  const swrKey =
    enabled && items.length
      ? `storage-tip:${items
          .map((i) => canonicalTipKey(i.name))
          .sort()
          .join("|")}`
      : null;

  const { data } = useSWR<{ tips: Record<string, string> }>(
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
    { revalidateOnFocus: false, dedupingInterval: 1000 * 60 * 60 },
  );

  return data?.tips ?? {};
}
