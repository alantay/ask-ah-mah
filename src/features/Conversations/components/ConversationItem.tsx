"use client";

import type { ConversationEntity } from "@/lib/conversations";
import { cn } from "@/lib/utils";

const SNIPPET_MAX = 80;

function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface ConversationItemProps {
  conversation: ConversationEntity;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
  const title = conversation.title ?? "New chat";
  const messageCount = conversation._count?.messages ?? 0;
  const rawSnippet = conversation.lastMessage?.content ?? null;
  const snippet = rawSnippet
    ? rawSnippet.slice(0, SNIPPET_MAX) + (rawSnippet.length > SNIPPET_MAX ? "…" : "")
    : null;

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-[10px] p-3 cursor-pointer shadow-[0_1px_0_oklch(0.87_0.03_72)]",
        isActive
          ? "bg-chat border border-primary border-l-[3px]"
          : "bg-card border border-border"
      )}
    >
      {/* Title row */}
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-display font-medium text-base text-foreground leading-tight tracking-tight truncate">
          {title}
        </span>
        <span className="font-sans text-[10.5px] text-ink-faint shrink-0 tabular-nums">
          {formatRelativeTime(conversation.updatedAt)}
        </span>
      </div>

      {/* Snippet */}
      {snippet && (
        <p className="font-sans text-[11.5px] text-muted-foreground leading-snug mt-1 line-clamp-2">
          {snippet}
        </p>
      )}

      {/* Footer — message count */}
      {messageCount > 0 && (
        <div className="flex items-center gap-2 mt-1.5">
          <span className="font-sans text-[10px] text-ink-faint tabular-nums">
            {messageCount} {messageCount === 1 ? "msg" : "msg"}
          </span>
        </div>
      )}
    </div>
  );
}
