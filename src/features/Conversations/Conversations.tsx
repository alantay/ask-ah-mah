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

type DateGroup = "Today" | "Yesterday" | "Earlier";
const DATE_GROUPS: DateGroup[] = ["Today", "Yesterday", "Earlier"];

function getDateGroup(date: Date | string): DateGroup {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86_400_000);
  const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (startOfDay >= startOfToday) return "Today";
  if (startOfDay >= startOfYesterday) return "Yesterday";
  return "Earlier";
}

function groupConversations(conversations: ConversationEntity[]) {
  const map = new Map<DateGroup, ConversationEntity[]>(
    DATE_GROUPS.map((g) => [g, []])
  );
  for (const conv of conversations) {
    map.get(getDateGroup(conv.updatedAt))!.push(conv);
  }
  return DATE_GROUPS.map((label) => ({ label, items: map.get(label)! })).filter(
    (g) => g.items.length > 0
  );
}

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

  const groups = groupConversations(filtered);

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
          className="w-11 h-11 rounded-lg bg-primary text-white flex items-center justify-center text-lg font-medium shrink-0 hover:bg-primary/90 transition-colors cursor-pointer"
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
          <div className="flex flex-col gap-3">
            {groups.map((group) => (
              <div key={group.label}>
                <div className="font-sans text-[9.5px] font-bold tracking-[0.18em] uppercase text-ink-faint mb-1.5 px-0.5">
                  {group.label}
                </div>
                <div className="flex flex-col gap-2">
                  {group.items.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      isActive={conv.id === activeConversationId}
                      onClick={() => handleItemClick(conv.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
