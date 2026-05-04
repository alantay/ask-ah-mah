"use client";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Conversations } from "../Conversations";

interface ConversationsMobileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConversationsMobileSheet({ open, onOpenChange }: ConversationsMobileSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] p-0 bg-muted paper">
        <SheetTitle className="sr-only">Conversations</SheetTitle>
        <div className="flex flex-col gap-3 p-4 overflow-y-auto h-full">
          <Conversations onItemClick={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
