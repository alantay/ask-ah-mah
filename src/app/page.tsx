"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConversationProvider } from "@/contexts/ConversationContext";
import ChatWrapper from "@/features/Chat/components/ChatWrapper";
import { ConversationsRail } from "@/features/Conversations";
import InventoryWrapper from "@/features/Inventory/components/InventoryWrapper";
import RecipeList from "@/features/RecipeList/RecipeList";
import { useState } from "react";

function HomeContent() {
  const [activeTab, setActiveTab] = useState("chat");

  return (
    <div className="bg-background">
      <main className="xl:container mx-auto h-[calc(100dvh-3.25rem)] md:h-[calc(100dvh-3.5rem)]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col pt-2">
          <TabsList>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="pantry">Pantry</TabsTrigger>
            <TabsTrigger value="cookbook">Cookbook</TabsTrigger>
          </TabsList>

          {/* ── Chat tab ── */}
          <TabsContent value="chat" className="flex-1 min-h-0 mt-0">
            <div className="flex h-full border border-border rounded-lg overflow-hidden relative">
              {/* Left: Conversations rail — hidden on mobile */}
              <ConversationsRail />

              {/* Middle: Chat — flex-1 */}
              <section className="flex-1 min-w-0 relative flex flex-col bg-chat paper">
                <ChatWrapper />
              </section>
            </div>
          </TabsContent>

          {/* ── Pantry tab ── */}
          <TabsContent
            value="pantry"
            className="flex-1 min-h-0 mt-0 overflow-hidden border border-border rounded-lg bg-muted paper"
          >
            <InventoryWrapper />
          </TabsContent>

          {/* ── Cookbook tab ── */}
          <TabsContent value="cookbook" className="flex-1 min-h-0 mt-0 overflow-hidden border border-border rounded-lg">
            <RecipeList onChatClick={() => setActiveTab("chat")} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <ConversationProvider>
      <HomeContent />
    </ConversationProvider>
  );
}
