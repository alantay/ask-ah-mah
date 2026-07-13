"use client";

import { useTips } from "@/hooks/useTips";

interface TipItem {
  name: string;
  type?: string | null;
}

/**
 * Ah Mah's "keep it well at home" tips — see useTips for the shared
 * implementation (SWR options, dedupe, enabled-gating). Storage tips cover
 * every item, no pickable-category filter.
 */
export function useStorageTips(
  items: TipItem[],
  enabled = true,
): { tips: Record<string, string>; isLoading: boolean } {
  return useTips("storage", items, enabled);
}
