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
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "rounded-[10px] p-3 cursor-pointer border transition-colors",
        isActive
          ? "bg-secondary border-[oklch(0.78_0.10_88)] shadow-[0_1px_0_oklch(0.78_0.10_88)]"
          : "bg-transparent border-transparent hover:border-[oklch(0.78_0.10_88)]/40"
      )}
    >
      <span className="block font-display font-medium text-base text-foreground leading-tight tracking-tight truncate">
        {title}
      </span>
    </div>
  );
}
