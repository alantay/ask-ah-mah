"use client";

import type { ConversationEntity } from "@/lib/conversations";
import { cn } from "@/lib/utils";

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
      <span className="font-display italic font-medium text-base text-foreground leading-tight tracking-tight block truncate">
        {title}
      </span>
    </div>
  );
}
