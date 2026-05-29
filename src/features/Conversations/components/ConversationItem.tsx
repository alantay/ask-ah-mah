"use client";

import type { ConversationEntity } from "@/lib/conversations";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import ConversationItemMenu from "./ConversationItemMenu";

interface ConversationItemProps {
  conversation: ConversationEntity;
  isActive: boolean;
  onClick: () => void;
  onRename: (title: string) => Promise<void>;
  onDelete: () => Promise<void>;
  canDelete: boolean;
}

export function ConversationItem({
  conversation,
  isActive,
  onClick,
  onRename,
  onDelete,
  canDelete,
}: ConversationItemProps) {
  const title = conversation.title ?? "New chat";

  const [editing, setEditing] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const committingRef = useRef(false);

  const commitRename = async () => {
    if (committingRef.current) return;
    committingRef.current = true;
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== title) {
      await onRename(trimmed);
    }
    setEditing(false);
    committingRef.current = false;
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={editing ? undefined : onClick}
      onKeyDown={(e) => {
        if (!editing && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "group rounded-lg py-1 px-3 cursor-pointer border transition-colors flex items-center gap-2",
        isActive
          ? "bg-secondary border-[oklch(0.78_0.10_88)] shadow-[0_1px_0_oklch(0.78_0.10_88)]"
          : "bg-transparent border-transparent hover:border-[oklch(0.78_0.10_88)]/40",
      )}
    >
      {/* Title area */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            className="font-display font-medium text-sm leading-tight bg-transparent border-b border-primary outline-none w-full min-w-0"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitRename();
              }
              if (e.key === "Escape") setEditing(false);
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="block font-display font-medium text-sm text-foreground leading-tight tracking-tight truncate">
            {title}
          </span>
        )}
      </div>

      {/* Right slot: 3-dot menu */}
      <div
        className={`shrink-0 transition-opacity ${isActive || menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <ConversationItemMenu
          conversationTitle={title}
          onStartRename={() => {
            setRenameValue(title);
            setEditing(true);
          }}
          onDelete={onDelete}
          canDelete={canDelete}
          onOpenChange={setMenuOpen}
        />
      </div>
    </div>
  );
}
