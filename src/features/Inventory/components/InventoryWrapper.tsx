"use client";
import { useSessionContext } from "@/contexts/SessionContext";
import Inventory from "../Inventory";
import { INVENTORY_LOADING_MESSAGES } from "../constants";

export default function InventoryWrapper() {
  const { userId, isLoading } = useSessionContext();

  if (isLoading || !userId) {
    return (
      <div className="h-full overflow-hidden">
        <div className="animate-pulse p-4" suppressHydrationWarning>
          {
            INVENTORY_LOADING_MESSAGES[
              Math.floor(Math.random() * INVENTORY_LOADING_MESSAGES.length)
            ]
          }
        </div>
      </div>
    );
  }

  // The Pantry is current stock only. The standing Shopping List — once the
  // Pantry's "Need" tab — is now its own top-level Section (ADR-0015), so this
  // surface renders the inventory directly with no tab strip.
  return <Inventory />;
}
