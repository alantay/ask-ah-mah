"use client";

import { usePathname, useSearchParams } from "next/navigation";

export type ActiveTab = "chat" | "pantry" | "shopping" | "cookbook";

const VALID_TABS = ["chat", "pantry", "shopping", "cookbook"] as const satisfies readonly ActiveTab[];

/**
 * Single source of truth for which top-level tab is currently active.
 * - /recipe/* routes → "cookbook"
 * - ?tab= query param (if valid) → that tab
 * - fallback → "chat"
 */
export function useActiveTab(): ActiveTab {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (pathname.startsWith("/recipe")) return "cookbook";

  const raw = searchParams.get("tab");
  if (raw && (VALID_TABS as readonly string[]).includes(raw)) {
    return raw as ActiveTab;
  }

  return "chat";
}
