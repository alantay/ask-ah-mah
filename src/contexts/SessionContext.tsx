"use client";
import useSession from "@/hooks/useSession";
import { authClient } from "@/lib/auth-client";
import { createContext, ReactNode, useContext, useEffect, useRef } from "react";

interface SessionContextType {
  userId: string | null;
  isLoading: boolean;
  user: ReturnType<typeof authClient.useSession>["data"] | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { userId: guestId, isLoading: guestLoading } = useSession();
  const { data: session, isPending: sessionLoading } = authClient.useSession();

  const userId = session?.user?.id || guestId;
  const isLoading = guestLoading || sessionLoading;

  useEffect(() => {
    if (session?.user?.id && guestId && guestId !== session.user.id) {
      const storageKey = `ask-ah-mah-migrated-${guestId}`;
      if (localStorage.getItem(storageKey)) return;

      fetch("/api/auth/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId }),
      })
        .then((res) => {
          if (res.ok) localStorage.setItem(storageKey, "true");
        })
        .catch((err) => console.error("Auto-merge failed:", err));
    }
  }, [session, guestId]);

  const signIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });
  };

  const signOut = async () => {
    await authClient.signOut();
  };

  return (
    <SessionContext.Provider
      value={{ userId, isLoading, user: session, signIn, signOut }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }
  return context;
}
