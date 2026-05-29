"use client";

import { useSessionContext } from "@/contexts/SessionContext";
import type { ConversationEntity } from "@/lib/conversations";
import {
  createContext,
  ReactNode,
  useContext,
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
  pendingConversationId: string | null;
  activeConversation: ConversationEntity | null;
  conversations: ConversationEntity[];
  conversationsLoading: boolean;
  isLoading: boolean;
  setActiveConversation: (id: string) => void;
  startNewConversation: () => void;
  setPendingConversation: (conversation: ConversationEntity) => void;
  commitConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => Promise<void>;
  autoTitleActiveConversation: (title: string) => Promise<boolean>;
  deleteConversation: (id: string) => Promise<void>;
  // Cook With What You Have: a pending synthetic message queued by the Pantry.
  // useChatSession watches this and auto-sends it once status is "ready".
  pendingCookWithMessage: string | null;
  queueCookWithMessage: (message: string) => void;
  clearCookWithMessage: () => void;
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

  const [pendingConversationId, setPendingConversationId] = useState<string | null>(null);
  const [pendingCookWithMessage, setPendingCookWithMessage] = useState<string | null>(null);

  // Fetch the conversations list
  const listKey = userId ? `/api/conversation?userId=${userId}` : null;

  const { data: listData, isLoading: listLoading } = useSWR<ConversationListResponse>(
    listKey,
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return res.json();
    },
    { revalidateOnFocus: false }
  );

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

  // Clear active conversation and enter staging state — no API call
  const startNewConversation = () => {
    persistActiveConversation(null);
    setPendingConversationId(null);
  };

  // Called when the first message is sent: optimistically add to list, track pending id
  const setPendingConversation = (conversation: ConversationEntity) => {
    setPendingConversationId(conversation.id);
    if (listKey) {
      globalMutate(
        listKey,
        (current?: ConversationListResponse) => {
          const existing = current?.conversations ?? [];
          const without = existing.filter(c => c.id !== conversation.id);
          return { conversations: [conversation, ...without] };
        },
        false
      );
    }
  };

  // Called in onFinish after stream completes: commit the pending conversation as active
  const commitConversation = (id: string) => {
    persistActiveConversation(id);
    setPendingConversationId(null);
    revalidateConversationKeys();
  };

  const renameConversation = async (id: string, title: string) => {
    try {
      const res = await fetch(`/api/conversation/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed to rename conversation");
      await revalidateConversationKeys();
    } catch {
      toast.error("Could not rename conversation. Try again.");
    }
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

  const deleteConversation = async (id: string): Promise<void> => {
    if (!userId) return;

    const previousConversations = listData?.conversations ?? [];
    const target = previousConversations.find((c) => c.id === id);
    if (!target || (target._count?.messages ?? 0) === 0) return;

    const optimisticConversations = previousConversations.filter(
      (c) => c.id !== id
    );

    if (id === activeConversationId) {
      const previousActiveConversationId = activeConversationId;
      const nextConversation =
        optimisticConversations.find(
          (c) => (c._count?.messages ?? 0) > 0
        ) ?? null;

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
        // No next conversation — go to staging state
        persistActiveConversation(null);
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
    } else {
      // Non-active conversation delete — optimistic remove, do NOT touch active id
      if (listKey) {
        await globalMutate(
          listKey,
          { conversations: optimisticConversations },
          false
        );
      }

      try {
        const res = await fetch(
          `/api/conversation/${id}?userId=${encodeURIComponent(userId)}`,
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
        toast.error("Could not delete conversation. Try again.");
      }
    }
  };

  return (
    <ConversationContext.Provider
      value={{
        activeConversationId,
        pendingConversationId,
        activeConversation,
        conversations: listData?.conversations ?? [],
        conversationsLoading: listLoading,
        isLoading: false,
        setActiveConversation,
        startNewConversation,
        setPendingConversation,
        commitConversation,
        renameConversation,
        autoTitleActiveConversation,
        deleteConversation,
        pendingCookWithMessage,
        queueCookWithMessage: setPendingCookWithMessage,
        clearCookWithMessage: () => setPendingCookWithMessage(null),
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
