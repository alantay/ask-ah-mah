"use client";

import { useConversationContext } from "@/contexts/ConversationContext";
import { useSessionContext } from "@/contexts/SessionContext";
import type { ConversationEntity } from "@/lib/conversations";
import { fetcher } from "@/lib/utils/index";
import { useState } from "react";
import useSWR from "swr";
import { CONVERSATIONS_SEARCH_PLACEHOLDER } from "./constants";
import { ConversationItem } from "./components/ConversationItem";

interface ConversationsProps {
  onItemClick?: () => void;
}

type ConversationsResponse = {
  conversations: ConversationEntity[];
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

  const allConversations = data?.conversations ?? [];

  const filtered = search.trim()
    ? allConversations.filter((c) =>
        (c.title ?? "New chat").toLowerCase().includes(search.toLowerCase())
      )
    : allConversations;

  const handleItemClick = (id: string) => {
    setActiveConversation(id);
    onItemClick?.();
  };

  const handleNewConversation = () => {
    const active = allConversations.find((c) => c.id === activeConversationId);
    if ((active?._count?.messages ?? 1) === 0) return;
    startNewConversation();
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-display italic font-medium text-[22px] text-foreground leading-tight">
            Conversations
          </div>
          <div className="text-xs text-ink-faint mt-0.5">Each kitchen session, kept</div>
        </div>
        <button
          onClick={handleNewConversation}
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
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          <div className="italic text-ink-faint text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="italic text-ink-faint text-sm">
            {search ? "No results" : "No conversations yet"}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeConversationId}
                onClick={() => handleItemClick(conv.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
