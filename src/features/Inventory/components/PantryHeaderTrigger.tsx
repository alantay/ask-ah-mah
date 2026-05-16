"use client";

import { useState } from "react";
import { PantryMobileSheet } from "./PantryMobileSheet";

export function PantryHeaderTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-ink-faint hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
        aria-label="Open pantry"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M9 21V22H7V21C6.46957 21 5.96086 20.7893 5.58579 20.4142C5.21071 20.0391 5 19.5304 5 19V4C5 3.46957 5.21071 2.96086 5.58579 2.58579C5.96086 2.21071 6.46957 2 7 2H17C17.5304 2 18.0391 2.21071 18.4142 2.58579C18.7893 2.96086 19 3.46957 19 4V19C19 19.5304 18.7893 20.0391 18.4142 20.4142C18.0391 20.7893 17.5304 21 17 21V22H15V21H9ZM7 4V9H17V4H7ZM7 19H17V11H7V19ZM8 12H10V15H8V12ZM8 6H10V8H8V6Z" fill="currentColor" />
        </svg>
      </button>
      <PantryMobileSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
