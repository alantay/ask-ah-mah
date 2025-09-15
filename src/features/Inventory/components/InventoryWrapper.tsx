"use client";
import { useSessionContext } from "@/contexts/SessionContext";
import Inventory from "../Inventory";
import { INVENTORY_LOADING_MESSAGES } from "../constants";

export default function InventoryWrapper() {
  const { userId, isLoading } = useSessionContext();

  return (
    <>
      <h2 className="text-lg sm:text-lg md:text-xl font-bold mb-5 mt-5">
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
