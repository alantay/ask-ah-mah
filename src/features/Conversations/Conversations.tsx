"use client";

import { useConversationContext } from "@/contexts/ConversationContext";
import { useSessionContext } from "@/contexts/SessionContext";
import type { ConversationEntity } from "@/lib/conversations";
import { fetcher } from "@/lib/utils/index";
import { useState } from "react";
import useSWR from "swr";
import { BUCKET_LABELS, CONVERSATIONS_SEARCH_PLACEHOLDER } from "./constants";
import { ConversationItem } from "./components/ConversationItem";

interface ConversationsProps {
  onItemClick?: () => void;
}

type ConversationsResponse = {
  conversations: ConversationEntity[];
  grouped: {
    today: ConversationEntity[];
    yesterday: ConversationEntity[];
    earlier: ConversationEntity[];
  };
};

export function Conversations({ onItemClick }: ConversationsProps) {
  const { userId } = useSessionContext();
  const { activeConversationId, setActiveConversation, startNewConversation } =
    useConversationContext();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useSWR<ConversationsResponse>(
    userId ? `/api/conversation?userId=${userId}` : null,
    fetcher
  );

  const filterConversations = (conversations: ConversationEntity[]) => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) =>
      (c.title ?? "").toLowerCase().includes(q)
    );
  };

  const handleItemClick = (id: string) => {
    setActiveConversation(id);
    onItemClick?.();
  };

  const grouped = data?.grouped ?? { today: [], yesterday: [], earlier: [] };
  const buckets: [keyof typeof BUCKET_LABELS, ConversationEntity[]][] = [
    ["today", filterConversations(grouped.today)],
    ["yesterday", filterConversations(grouped.yesterday)],
    ["earlier", filterConversations(grouped.earlier)],
  ];
  const hasAny = buckets.some(([, items]) => items.length > 0);

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-display italic font-medium text-[22px] text-foreground leading-tight">
            Conversations
          </div>
          <div className="text-xs text-ink-faint mt-0.5">Each kitchen session, kept</div>
        </div>
        <button
          onClick={startNewConversation}
          className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-lg font-medium shrink-0 hover:bg-primary/90 transition-colors cursor-pointer"
          aria-label="New conversation"
        >
          +
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
        >
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={CONVERSATIONS_SEARCH_PLACEHOLDER}
          className="bg-card border border-border rounded-lg pl-7 pr-3 py-1.5 text-sm w-full outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="italic text-ink-faint text-sm">Loading…</div>
      ) : !hasAny ? (
        <div className="italic text-ink-faint text-sm">No conversations yet</div>
      ) : (
        <div className="flex flex-col">
          {buckets.map(([key, items]) =>
            items.length === 0 ? null : (
              <div key={key} className="mt-3 first:mt-0">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-2">
                  {BUCKET_LABELS[key]}
                </div>
                <div className="flex flex-col gap-2">
                  {items.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      isActive={conv.id === activeConversationId}
                      onClick={() => handleItemClick(conv.id)}
                    />
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </>
  );
}
