"use client";

import { usePathname, useSearchParams } from "next/navigation";

export type Section = "chat" | "pantry" | "shopping" | "cookbook";

const VALID_SECTIONS = ["chat", "pantry", "shopping", "cookbook"] as const satisfies readonly Section[];

/**
 * Single source of truth for which top-level Section is currently active.
 * - /recipe/* routes → "cookbook"
 * - ?tab= query param (if valid) → that Section
 * - fallback → "chat"
 *
 * The `?tab=` query key is kept as-is (URL/bookmark contract; see ADR-0019)
 * even though the code-level concept is a Section, not a tab.
 */
export function useActiveSection(): Section {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (pathname.startsWith("/recipe")) return "cookbook";

  const raw = searchParams.get("tab");
  if (raw && (VALID_SECTIONS as readonly string[]).includes(raw)) {
    return raw as Section;
  }

  return "chat";
}
