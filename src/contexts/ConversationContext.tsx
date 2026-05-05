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
import { toast } from "sonner";
import useSWR, { mutate as globalMutate } from "swr";

const LOCAL_STORAGE_KEY = "ask-ah-mah-active-conversation";

interface ConversationContextType {
  activeConversationId: string | null;
  activeConversation: ConversationEntity | null;
  isLoading: boolean;
  setActiveConversation: (id: string) => void;
  startNewConversation: () => Promise<void>;
  renameActiveConversation: (title: string) => Promise<void>;
  autoTitleActiveConversation: (title: string) => Promise<boolean>;
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
    ? `/api/conversation?active=true&userId=${userId}`
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

  // Always fetch the conversations list so activeConversation reflects title updates
  const { data: listData } = useSWR<{ conversations: ConversationEntity[] }>(
    userId ? `/api/conversation?userId=${userId}` : null,
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch conversations");
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

  // Derive activeConversation from the list so title updates reflect immediately
  const activeConversation = activeConversationId
    ? (listData?.conversations?.find(c => c.id === activeConversationId) ?? null)
    : null;

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
    const res = await fetch(`/api/conversation/${activeConversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) return;
    // Revalidate all conversation-related SWR keys (swrKey may be null when
    // activeConversationId was loaded from localStorage, so we use a predicate).
    globalMutate(
      (key: unknown) => typeof key === "string" && key.includes("/api/conversation"),
      undefined,
      { revalidate: true }
    );
  };

  const autoTitleActiveConversation = async (title: string) => {
    if (!activeConversationId) return false;
    try {
      const res = await fetch(`/api/conversation/${activeConversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, autoTitle: true }),
      });
      if (!res.ok) return false;
      globalMutate(
        (key: unknown) => typeof key === "string" && key.includes("/api/conversation"),
        undefined,
        { revalidate: true }
      );
      return true;
    } catch (error) {
      console.error("Failed to auto-title conversation:", error);
      return false;
    }
  };

  const archiveActiveConversation = async () => {
    if (!activeConversationId) return;
    const res = await fetch(`/api/conversation/${activeConversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: true }),
    });
    if (!res.ok) return;
    toast.success("Conversation archived");
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
        autoTitleActiveConversation,
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
