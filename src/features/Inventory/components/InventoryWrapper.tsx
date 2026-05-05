"use client";
import { useSessionContext } from "@/contexts/SessionContext";
import Inventory from "../Inventory";
import { INVENTORY_LOADING_MESSAGES } from "../constants";

export default function InventoryWrapper({ onClose }: { onClose?: () => void }) {
  const { userId, isLoading } = useSessionContext();

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
        <Inventory onClose={onClose} />
      )}
    </div>
  );
}
