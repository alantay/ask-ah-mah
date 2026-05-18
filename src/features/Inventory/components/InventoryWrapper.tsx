"use client";
import { useSessionContext } from "@/contexts/SessionContext";
import Inventory from "../Inventory";
import { INVENTORY_LOADING_MESSAGES } from "../constants";

export default function InventoryWrapper() {
  const { userId, isLoading } = useSessionContext();

  return (
    <div className="h-full overflow-hidden">
      {isLoading || !userId ? (
        <div className="animate-pulse p-4" suppressHydrationWarning>
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
