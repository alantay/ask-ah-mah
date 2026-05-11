"use client";
import { authClient } from "@/lib/auth-client";
import { generateShortId } from "@/lib/utils/index";
import { useEffect, useState } from "react";

export default function useSession() {
  const { data: session, isPending: authPending } = authClient.useSession();
  const [guestId, setGuestId] = useState<string | null>(null);
  const [guestLoading, setGuestLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let sessionId = localStorage.getItem("ask-ah-mah-session");
    const isNew = !sessionId;
    if (!sessionId) {
      sessionId = generateShortId();
      localStorage.setItem("ask-ah-mah-session", sessionId);
    }
    setGuestId(sessionId);
    setGuestLoading(false);

    if (isNew) {
      fetch("/api/inventory/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: sessionId }),
      });
    }
  }, []);

  const isAuthenticated = !!session?.user;
  const userId = isAuthenticated ? session!.user.id : guestId;
  const isLoading = authPending || guestLoading;

  return { userId, isLoading, isAuthenticated };
}
