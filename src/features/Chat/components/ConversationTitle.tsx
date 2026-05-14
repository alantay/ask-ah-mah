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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { useRef, useState } from "react";

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getTitleFallback(): string {
  return "New chat";
}

// ── ConversationTitle ─────────────────────────────────────────────────────────

interface ConversationTitleProps {
  title: string | null | undefined;
  onRename: (title: string) => Promise<void>;
  onDelete: () => Promise<void>;
  canDelete: boolean;
}

export default function ConversationTitle({
  title,
  onRename,
  onDelete,
  canDelete,
}: ConversationTitleProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const committingRef = useRef(false);

  const displayTitle = title ?? getTitleFallback();

  const startEditing = () => {
    setValue(displayTitle);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitRename = async () => {
    if (committingRef.current) return;
    committingRef.current = true;
    const trimmed = value.trim();
    if (trimmed && trimmed !== displayTitle) {
      await onRename(trimmed);
    }
    setEditing(false);
    committingRef.current = false;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitRename();
    } else if (e.key === "Escape") {
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="font-display italic font-medium text-[19px] text-foreground leading-tight tracking-tight bg-transparent border-b border-border outline-none w-full max-w-[280px]"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commitRename}
        onKeyDown={handleKeyDown}
        autoFocus
      />
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-display italic font-medium text-[19px] text-foreground leading-tight tracking-tight">
        {displayTitle}
      </span>
      <button
        onClick={startEditing}
        className="text-ink-faint hover:text-muted-foreground transition-colors cursor-pointer"
        aria-label="Rename conversation"
      >
        {/* Pencil icon 12×12 */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            disabled={!canDelete}
            aria-label="Delete conversation"
            title={!canDelete ? "Nothing to delete yet" : undefined}
            className="text-ink-faint hover:text-destructive hover:bg-destructive/10 rounded-sm p-0.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 size={12} />
          </button>
        </AlertDialogTrigger>
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
    </div>
  );
}
