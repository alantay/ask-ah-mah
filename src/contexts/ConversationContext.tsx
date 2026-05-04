"use client";

import { useSessionContext } from "@/contexts/SessionContext";
import type { ConversationEntity } from "@/lib/conversations";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import useSWR, { mutate as globalMutate } from "swr";

const LOCAL_STORAGE_KEY = "ask-ah-mah-active-conversation";

interface ConversationContextType {
  activeConversationId: string | null;
  activeConversation: ConversationEntity | null;
  isLoading: boolean;
  setActiveConversation: (id: string) => void;
  startNewConversation: () => Promise<void>;
  renameActiveConversation: (title: string) => Promise<void>;
  archiveActiveConversation: () => Promise<void>;
}

const ConversationContext = createContext<ConversationContextType | undefined>(
  undefined
);

export function ConversationProvider({ children }: { children: ReactNode }) {
  const { userId } = useSessionContext();

  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(LOCAL_STORAGE_KEY);
  });

  // Only fetch from API if we don't already have a stored conversation id
  const shouldFetch = userId && !activeConversationId;
  const swrKey = shouldFetch
    ? `/api/conversation/active?userId=${userId}`
    : null;

  const { data, isLoading } = useSWR<{ conversation: ConversationEntity }>(
    swrKey,
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch active conversation");
      return res.json();
    },
    { revalidateOnFocus: false }
  );

  // When the API returns a conversation, store it
  useEffect(() => {
    if (data?.conversation?.id && !activeConversationId) {
      setActiveConversationId(data.conversation.id);
      localStorage.setItem(LOCAL_STORAGE_KEY, data.conversation.id);
    }
  }, [data, activeConversationId]);

  // The active conversation entity — from the SWR data (when we fetched it) or null
  // We expose the full entity only when it came from the API response
  const activeConversation = data?.conversation ?? null;

  const setActiveConversation = (id: string) => {
    setActiveConversationId(id);
    localStorage.setItem(LOCAL_STORAGE_KEY, id);
  };

  const startNewConversation = async () => {
    if (!userId) return;
    const res = await fetch("/api/conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error("Failed to create conversation");
    const { conversation } = await res.json();
    setActiveConversation(conversation.id);
    // Refresh the conversations list rail
    globalMutate(`/api/conversation?userId=${userId}`);
  };

  const renameActiveConversation = async (title: string) => {
    if (!activeConversationId) return;
    await fetch(`/api/conversation/${activeConversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    globalMutate(swrKey);
    if (userId) globalMutate(`/api/conversation?userId=${userId}`);
  };

  const archiveActiveConversation = async () => {
    if (!activeConversationId) return;
    await fetch(`/api/conversation/${activeConversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: true }),
    });
    // Clear stored id so startNewConversation creates fresh
    setActiveConversationId(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    await startNewConversation();
  };

  const contextIsLoading =
    isLoading || (!!userId && !activeConversationId && !data);

  return (
    <ConversationContext.Provider
      value={{
        activeConversationId,
        activeConversation,
        isLoading: contextIsLoading,
        setActiveConversation,
        startNewConversation,
        renameActiveConversation,
        archiveActiveConversation,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversationContext() {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error(
      "useConversationContext must be used within a ConversationProvider"
    );
  }
  return context;
}
