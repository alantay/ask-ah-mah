"use client";
import useSession from "@/hooks/useSession";
import { createContext, ReactNode, useContext } from "react";

interface SessionContextType {
  userId: string | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { userId, isLoading } = useSession();

  return (
    <SessionContext.Provider value={{ userId, isLoading }}>
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
