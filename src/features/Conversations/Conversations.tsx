"use client";

import { useConversationContext } from "@/contexts/ConversationContext";
import type { ConversationEntity } from "@/lib/conversations";
import { useState } from "react";
import { CONVERSATIONS_SEARCH_PLACEHOLDER } from "./constants";
import { ConversationItem } from "./components/ConversationItem";
import { ConversationListSkeleton } from "./components/ConversationListSkeleton";

interface ConversationsProps {
  onItemClick?: () => void;
}

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
  const {
    activeConversationId,
    conversations: allConversations,
    conversationsLoading: isLoading,
    setActiveConversation,
    renameConversation,
    deleteConversation,
  } = useConversationContext();
  const [search, setSearch] = useState("");

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

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header */}
      <div>
        <div className="font-display italic font-medium text-[22px] text-foreground leading-tight">
          Conversations
        </div>
        <div className="text-xs text-ink-faint mt-0.5">Each kitchen session, kept</div>
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
        {isLoading && allConversations.length === 0 ? (
          <ConversationListSkeleton />
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
                      onRename={(newTitle) => renameConversation(conv.id, newTitle)}
                      onDelete={() => deleteConversation(conv.id)}
                      canDelete={(conv._count?.messages ?? 0) > 0}
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
