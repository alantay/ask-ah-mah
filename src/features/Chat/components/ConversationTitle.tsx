"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRef, useState } from "react";

export function getTitleFallback(): string {
  return "New chat";
}

// ── ConversationTitle ─────────────────────────────────────────────────────────

interface ConversationTitleProps {
  title: string | null | undefined;
  /** When provided, title becomes a tappable button */
  onTap?: () => void;
  /** Show a ▾ chevron to signal tappability */
  withChevron?: boolean;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
  onRename: (title: string) => Promise<void>;
  /** Override default title typography (e.g. larger on mobile hero row) */
  titleClassName?: string;
}

const DEFAULT_TITLE_CLASS =
  "font-display italic font-medium text-[16.5px] text-foreground leading-tight tracking-tight truncate";

export default function ConversationTitle({
  title,
  onTap,
  withChevron,
  editing,
  onEditingChange,
  onRename,
  titleClassName,
}: ConversationTitleProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const committingRef = useRef(false);

  const displayTitle = title ?? getTitleFallback();

  const startEditing = () => {
    setValue(displayTitle);
    onEditingChange(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitRename = async () => {
    if (committingRef.current) return;
    committingRef.current = true;
    const trimmed = value.trim();
    if (trimmed && trimmed !== displayTitle) {
      await onRename(trimmed);
    }
    onEditingChange(false);
    committingRef.current = false;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitRename();
    } else if (e.key === "Escape") {
      onEditingChange(false);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className={`${DEFAULT_TITLE_CLASS} bg-transparent border-b border-border outline-none w-full`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commitRename}
        onKeyDown={handleKeyDown}
        autoFocus
      />
    );
  }

  const titleEl = (
    <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
      <span className={titleClassName ?? DEFAULT_TITLE_CLASS}>
        {displayTitle}
      </span>
      {withChevron && (
        <svg
          width="11"
          height="11"
          viewBox="0 0 16 16"
          fill="none"
          className="text-ink-faint shrink-0"
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );

  if (onTap) {
    return (
      <button
        onClick={onTap}
        className="flex flex-col items-start w-full min-w-0 overflow-hidden text-left bg-transparent border-none p-0 cursor-pointer"
      >
        {titleEl}
      </button>
    );
  }

  return titleEl;
}

// ── ConversationActionsMenu ───────────────────────────────────────────────────

interface ConversationActionsMenuProps {
  onNewConversation: () => void;
  canStartNew: boolean;
  onStartRename: () => void;
  onDelete: () => Promise<void>;
  canDelete: boolean;
}

export function ConversationActionsMenu({
  onNewConversation,
  canStartNew,
  onStartRename,
  onDelete,
  canDelete,
}: ConversationActionsMenuProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center justify-center w-11 h-11 rounded-lg text-ink-faint hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="More options"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="3" cy="8" r="1.4" />
              <circle cx="8" cy="8" r="1.4" />
              <circle cx="13" cy="8" r="1.4" />
            </svg>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={!canStartNew} onClick={onNewConversation}>
            New conversation
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onStartRename}>Rename</DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canDelete}
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Saved recipes are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
