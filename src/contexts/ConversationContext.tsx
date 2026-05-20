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

type ConversationListResponse = {
  conversations: ConversationEntity[];
};

interface ConversationContextType {
  activeConversationId: string | null;
  activeConversation: ConversationEntity | null;
  isLoading: boolean;
  setActiveConversation: (id: string) => void;
  startNewConversation: () => Promise<void>;
  renameActiveConversation: (title: string) => Promise<void>;
  autoTitleActiveConversation: (title: string) => Promise<boolean>;
  deleteActiveConversation: () => Promise<void>;
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
  const listKey = userId ? `/api/conversation?userId=${userId}` : null;

  const { data: listData } = useSWR<ConversationListResponse>(
    listKey,
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

  const persistActiveConversation = (id: string | null) => {
    setActiveConversationId(id);
    if (id) {
      localStorage.setItem(LOCAL_STORAGE_KEY, id);
      return;
    }
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const revalidateConversationKeys = () =>
    globalMutate(
      (key: unknown) =>
        typeof key === "string" && key.includes("/api/conversation"),
    );

  const startNewConversation = async (options?: { revalidate?: boolean }) => {
    if (!userId) return;
    const res = await fetch("/api/conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error("Failed to create conversation");
    const { conversation } = await res.json();
    setActiveConversation(conversation.id);
    if (listKey) {
      await globalMutate(
        listKey,
        (current?: ConversationListResponse) => {
          const existing = current?.conversations ?? [];
          const withoutConversation = existing.filter(
            (item) => item.id !== conversation.id
          );

          return {
            conversations: [conversation, ...withoutConversation],
          };
        },
        false
      );
    }
    if (options?.revalidate !== false) {
      await revalidateConversationKeys();
    }
  };

  const renameActiveConversation = async (title: string) => {
    if (!activeConversationId) return;
    const res = await fetch(`/api/conversation/${activeConversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) return;
    await revalidateConversationKeys();
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
      await revalidateConversationKeys();
      return true;
    } catch (error) {
      console.error("Failed to auto-title conversation:", error);
      return false;
    }
  };

  const deleteActiveConversation = async (): Promise<void> => {
    if (
      !userId ||
      !activeConversationId ||
      !activeConversation ||
      (activeConversation._count?.messages ?? 0) === 0
    ) {
      return;
    }

    const previousConversations = listData?.conversations ?? [];
    const previousActiveConversationId = activeConversationId;
    const optimisticConversations = previousConversations.filter(
      (conversation) => conversation.id !== activeConversationId
    );
    const nextConversation =
      optimisticConversations.find(
        (conversation) => (conversation._count?.messages ?? 0) > 0
      ) ??
      optimisticConversations.find(
        (conversation) =>
          conversation.title === null &&
          (conversation._count?.messages ?? 0) === 0
      ) ??
      null;

    if (listKey) {
      await globalMutate(
        listKey,
        { conversations: optimisticConversations },
        false
      );
    }

    if (nextConversation) {
      persistActiveConversation(nextConversation.id);
    } else {
      persistActiveConversation(null);
      await startNewConversation({ revalidate: false });
    }

    try {
      const res = await fetch(
        `/api/conversation/${previousActiveConversationId}?userId=${encodeURIComponent(userId)}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        throw new Error("Failed to delete conversation");
      }

      await revalidateConversationKeys();
    } catch {
      if (listKey) {
        await globalMutate(
          listKey,
          { conversations: previousConversations },
          false
        );
      }
      persistActiveConversation(previousActiveConversationId);
      toast.error("Could not delete conversation. Try again.");
    }
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
        deleteActiveConversation,
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
