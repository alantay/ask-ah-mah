"use client";
import useSession from "@/hooks/useSession";
import { createContext, ReactNode, useContext } from "react";

interface SessionContextType {
  userId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  user: { id: string; name: string; email: string; image?: string | null } | null;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { userId, isLoading, isAuthenticated, user } = useSession();

  return (
    <SessionContext.Provider value={{ userId, isLoading, isAuthenticated, user }}>
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
