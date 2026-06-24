"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSessionContext } from "@/contexts/SessionContext";
import ShoppingList from "@/features/ShoppingList";
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

  // The Pantry has two faces (ADR-0014): Have = current stock, Need = the
  // standing Shopping List. The list is mounted here, inside Pantry, so it can
  // be promoted to its own Section later with no data change.
  return (
    <Tabs defaultValue="have" className="h-full flex flex-col overflow-hidden">
      <div className="px-4 sm:px-9 pt-3 sm:pt-5">
        <TabsList>
          <TabsTrigger value="have">Have</TabsTrigger>
          <TabsTrigger value="need">Need</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent
        value="have"
        className="flex-1 min-h-0 mt-0 overflow-hidden data-[state=inactive]:hidden"
      >
        <Inventory />
      </TabsContent>
      <TabsContent
        value="need"
        className="flex-1 min-h-0 mt-0 overflow-hidden data-[state=inactive]:hidden"
      >
        <ShoppingList />
      </TabsContent>
    </Tabs>
  );
}
