"use client";
import { authClient } from "@/lib/auth-client";
import { clearSwrCache, USER_ID_KEY } from "@/lib/swr-cache";
import { useEffect, useRef, useState } from "react";
import { useSWRConfig } from "swr";

/**
 * Resolves the current user from the better-auth session — the single source of
 * identity. Every visitor has a real session: signed-in users via Google, and
 * everyone else via an anonymous session minted on first load.
 *
 * Identity is the session cookie; the server trusts only that (`src/lib/session.ts`).
 * As a display-only optimisation for fast cold returns, we also persist the
 * last-known userId to localStorage and use it before the session round-trip
 * settles, so cached data can paint without waiting on `/api/auth`. When the
 * real session resolves to a different id, we evict the stale cache. See ADR-0023.
 */
export default function useSession() {
  const { data: session, isPending } = authClient.useSession();
  const { mutate } = useSWRConfig();
  // True only while we're minting the first anonymous session, so consumers keep
  // showing "loading" rather than briefly seeing a null userId.
  const [creatingGuest, setCreatingGuest] = useState(false);
  // The last-known userId, read from localStorage after mount (not during render,
  // so the server's null userId matches the first client render — no hydration
  // mismatch). Lets SWR keys go live and paint cached data a tick later.
  const [persistedUserId, setPersistedUserId] = useState<string | null>(null);
  const attemptedRef = useRef(false);

  useEffect(() => {
    setPersistedUserId(localStorage.getItem(USER_ID_KEY));
  }, []);

  useEffect(() => {
    if (isPending) return; // wait for the session check to settle
    if (session?.user) return; // already have a session (anonymous or real)
    if (attemptedRef.current) return; // only ever mint once per mount
    attemptedRef.current = true;

    setCreatingGuest(true);
    authClient.signIn
      .anonymous()
      .then((res) => {
        // A brand-new anonymous user owns nothing yet — seed their starter pantry.
        // The session cookie is set by signIn.anonymous(), so the seed route
        // derives the userId from the session; no need to pass it in the body.
        if (res?.data?.user?.id) {
          fetch("/api/inventory/seed", { method: "POST" });
        }
      })
      .finally(() => setCreatingGuest(false));
  }, [isPending, session]);

  // Once the real session resolves, reconcile the persisted identity. On a
  // mismatch (expired anon session, sign-in upgrade, or a different user) drop
  // the previously painted user's cached data before revalidating under the new id.
  useEffect(() => {
    if (isPending) return;
    const resolved = session?.user?.id;
    if (!resolved) return; // no session yet (anon mint in flight)
    const stored = localStorage.getItem(USER_ID_KEY);
    if (stored !== resolved) {
      if (stored) clearSwrCache(mutate);
      localStorage.setItem(USER_ID_KEY, resolved);
      setPersistedUserId(resolved);
    }
  }, [isPending, session, mutate]);

  // Session id when known; the persisted id bridges the pre-auth window.
  const userId = session?.user?.id ?? persistedUserId;
  // "Authenticated" means a real account, not an anonymous guest session.
  const isAuthenticated = !!session?.user && !session.user.isAnonymous;
  const isLoading = isPending || creatingGuest;
  const user = session?.user ?? null;

  return { userId, isLoading, isAuthenticated, user };
}
