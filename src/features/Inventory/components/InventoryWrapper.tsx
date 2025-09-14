"use client";
import { useSessionContext } from "@/contexts/SessionContext";
import Inventory from "../Inventory";
import { INVENTORY_LOADING_MESSAGES } from "../constants";

export default function InventoryWrapper() {
  const { userId, isLoading } = useSessionContext();

  return (
    <>
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-5 mt-3">
        Your Inventory
      </h2>

      {isLoading || !userId ? (
        <div className="animate-pulse">
          {
            INVENTORY_LOADING_MESSAGES[
              Math.floor(Math.random() * INVENTORY_LOADING_MESSAGES.length)
            ]
          }
        </div>
      ) : (
        <Inventory />
      )}
    </>
  );
}
