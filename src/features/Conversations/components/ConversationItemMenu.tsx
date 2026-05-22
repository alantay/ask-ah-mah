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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";

interface ConversationItemMenuProps {
  /** Title shown inside the confirmation copy e.g. Delete "Cozy Minced Pork Delights"? */
  conversationTitle: string;
  onStartRename: () => void;
  onDelete: () => Promise<void> | void;
  canDelete: boolean;
  /** Notify parent so it can keep the 3-dot visible while open */
  onOpenChange?: (open: boolean) => void;
}

export default function ConversationItemMenu({
  conversationTitle,
  onStartRename,
  onDelete,
  canDelete,
  onOpenChange,
}: ConversationItemMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  return (
    <>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Conversation actions"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center w-6 h-6 rounded-md text-ink-faint hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="3" cy="8" r="1.4" />
              <circle cx="8" cy="8" r="1.4" />
              <circle cx="13" cy="8" r="1.4" />
            </svg>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="bottom"
          className="w-40 p-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted cursor-pointer"
            onClick={() => {
              setOpen(false);
              onStartRename();
            }}
          >
            Rename
          </button>
          <button
            type="button"
            disabled={!canDelete}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            onClick={() => {
              setOpen(false);
              setConfirmOpen(true);
            }}
          >
            Delete
          </button>
        </PopoverContent>
      </Popover>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{conversationTitle}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              Gone for good. Your saved recipes stay safe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete()}
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
