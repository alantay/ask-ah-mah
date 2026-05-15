"use client";

import type { ConversationEntity } from "@/lib/conversations";
import { cn } from "@/lib/utils";

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
      <span className="font-display font-medium text-base text-foreground leading-tight tracking-tight block truncate">
        {title}
      </span>
      <span className="font-sans text-[10.5px] text-ink-faint mt-0.5 block tabular-nums">
        {formatRelativeTime(conversation.createdAt)}
      </span>
    </div>
  );
}
