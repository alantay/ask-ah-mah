"use client";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import InventoryWrapper from "./InventoryWrapper";

interface PantryMobileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PantryMobileSheet({ open, onOpenChange }: PantryMobileSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[320px] sm:w-[360px] p-0 bg-muted paper"
        showCloseButton={false}
      >
        <SheetTitle className="sr-only">Pantry</SheetTitle>
        <div className="flex flex-col h-full overflow-y-auto">
          <InventoryWrapper onClose={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
