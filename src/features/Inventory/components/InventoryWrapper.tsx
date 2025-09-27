"use client";
import { useSessionContext } from "@/contexts/SessionContext";
import Inventory from "../Inventory";
import { INVENTORY_LOADING_MESSAGES } from "../constants";

export default function InventoryWrapper() {
  const { userId, isLoading } = useSessionContext();

  // flex  h-[calc(100dvh-6rem)] sm:h-[calc(100dvh-6.5rem)]  md:h-[calc(100dvh-8rem)]  flex-col animate-in fade-in  duration-300

  return (
    <div className="max-h-full overflow-y-auto pb-4 overscroll-contain ">
      {isLoading || !userId ? (
        <div className="animate-pulse" suppressHydrationWarning>
          {
            INVENTORY_LOADING_MESSAGES[
              Math.floor(Math.random() * INVENTORY_LOADING_MESSAGES.length)
            ]
          }
        </div>
      ) : (
        <Inventory />
      )}
    </div>
  );
}
