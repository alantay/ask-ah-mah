"use client";
import { authClient } from "@/lib/auth-client";
import { generateShortId } from "@/lib/utils/index";
import { useEffect, useState } from "react";

export default function useSession() {
  const { data: session, isPending: authPending } = authClient.useSession();
  const [guestId, setGuestId] = useState<string | null>(null);
  const [guestLoading, setGuestLoading] = useState(!session?.user);

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
      }).then((res) => {
        if (!res.ok) {
          console.error("Failed to seed inventory:", res.status, res.statusText);
        }
      }).catch((error) => {
        console.error("Failed to seed inventory:", error);
      });
    }
  }, []);

  const isAuthenticated = !!session?.user;
  const userId = session?.user?.id ?? guestId;
  const isLoading = authPending || guestLoading;
  const user = session?.user ?? null;

  return { userId, isLoading, isAuthenticated, user };
}
