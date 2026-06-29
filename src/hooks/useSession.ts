"use client";
import { authClient } from "@/lib/auth-client";
import { useEffect, useRef, useState } from "react";

/**
 * Resolves the current user from the better-auth session — the single source of
 * identity. Every visitor has a real session: signed-in users via Google, and
 * everyone else via an anonymous session minted on first load. `userId` always
 * comes from that session (never a client-generated localStorage id), so the
 * server can trust the session cookie over any userId in a request.
 */
export default function useSession() {
  const { data: session, isPending } = authClient.useSession();
  // True only while we're minting the first anonymous session, so consumers keep
  // showing "loading" rather than briefly seeing a null userId.
  const [creatingGuest, setCreatingGuest] = useState(false);
  const attemptedRef = useRef(false);

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

  const userId = session?.user?.id ?? null;
  // "Authenticated" means a real account, not an anonymous guest session.
  const isAuthenticated = !!session?.user && !session.user.isAnonymous;
  const isLoading = isPending || creatingGuest;
  const user = session?.user ?? null;

  return { userId, isLoading, isAuthenticated, user };
}
