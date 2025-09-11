import Chat from "@/features/Chat";
import Inventory from "@/features/Inventory";
import { Suspense } from "react";

// Loading components
function ChatLoading() {
  return (
    <div className="flex h-[600px] items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p>Loading chat...</p>
      </div>
    </div>
  );
}

function InventoryLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Inventory</h1>
      </div>
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p>Loading inventory...</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Ask Ah Mah</h1>
              <p className="text-muted-foreground">
                Your friendly cooking assistant
              </p>
            </div>
            <Suspense fallback={<ChatLoading />}>
              <Chat />
            </Suspense>
          </div>
          <div className="lg:col-span-1">
            <Suspense fallback={<InventoryLoading />}>
              <Inventory />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
