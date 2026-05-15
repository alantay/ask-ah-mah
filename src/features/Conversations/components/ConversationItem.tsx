"use client";

import type { ConversationEntity } from "@/lib/conversations";
import { cn } from "@/lib/utils";

function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
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
  const snippet = conversation.lastMessageSnippet;

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
        <p className="mt-0.5 font-sans text-[11px] text-ink-faint leading-snug truncate">
          {snippet}
        </p>
      )}

      {/* Footer — message count */}
      {messageCount > 0 && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="font-sans text-[10px] text-ink-faint tabular-nums">
            {messageCount} msg
          </span>
        </div>
      )}
    </div>
  );
}
