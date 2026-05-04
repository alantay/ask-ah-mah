"use client";

import { getTitleFallback } from "@/features/Chat/components/ConversationTitle";
import type { ConversationEntity } from "@/lib/conversations";
import { cn } from "@/lib/utils";
import { formatWhen } from "../utils";

interface ConversationItemProps {
  conversation: ConversationEntity;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
  const title = conversation.title ?? getTitleFallback(new Date(conversation.createdAt));
  const when = formatWhen(conversation.updatedAt);
  const msgCount = conversation._count?.messages;

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
      <div className="flex items-start justify-between gap-1">
        <span className="font-display italic font-medium text-base text-foreground leading-tight tracking-tight flex-1 min-w-0 truncate">
          {title}
        </span>
        <span className="font-mono text-[10.5px] text-ink-faint tabular-nums shrink-0 mt-0.5">
          {when}
        </span>
      </div>
      {msgCount !== undefined && (
        <div className="text-[11px] text-ink-faint mt-1">{msgCount} msg</div>
      )}
    </div>
  );
}
