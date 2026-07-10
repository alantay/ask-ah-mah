"use client";

import { localStorageProvider } from "@/lib/swr-cache";
import type { ReactNode } from "react";
import { SWRConfig } from "swr";

/**
 * Gives every `useSWR` call a localStorage-backed cache so the app paints
 * last-seen content instantly on a cold return, then revalidates. See ADR-0023.
 * Sits above SessionProvider/ConversationProvider (both read SWR).
 */
export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ provider: localStorageProvider }}>{children}</SWRConfig>
  );
}
