"use client";

import { useTips } from "@/hooks/useTips";

interface TipItem {
  name: string;
  category?: string | null;
}

/**
 * Ah Mah's picking tips at the moment of buying — see useTips for the shared
 * implementation (SWR options, dedupe, enabled-gating). Market tips only ask
 * about pickable items; staples (salt, sugar, flour) return no tip.
 */
export function useMarketTips(
  items: TipItem[],
  enabled = true,
): { tips: Record<string, string>; isLoading: boolean } {
  return useTips("market", items, enabled);
}
