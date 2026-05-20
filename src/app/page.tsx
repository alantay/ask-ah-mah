"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConversationProvider } from "@/contexts/ConversationContext";
import ChatWrapper from "@/features/Chat/components/ChatWrapper";
import { ConversationsRail } from "@/features/Conversations";
import InventoryWrapper from "@/features/Inventory/components/InventoryWrapper";
import RecipeList from "@/features/RecipeList/RecipeList";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

const VALID_TABS = ["chat", "pantry", "cookbook"] as const;

function HomeContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    initialTab && (VALID_TABS as readonly string[]).includes(initialTab) ? initialTab : "chat",
  );

  return (
    <div className="bg-background">
      <main className="xl:container mx-auto h-[calc(100dvh-3.25rem)] sm:h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col pt-2">
          <TabsList>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="pantry">Pantry</TabsTrigger>
            <TabsTrigger value="cookbook">Cookbook</TabsTrigger>
          </TabsList>

          {/* ── Chat tab ── */}
          <TabsContent
            value="chat"
            forceMount
            className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden"
          >
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
            forceMount
            className="flex-1 min-h-0 mt-0 overflow-hidden border border-border rounded-lg bg-muted paper data-[state=inactive]:hidden"
          >
            <InventoryWrapper />
          </TabsContent>

          {/* ── Cookbook tab ── */}
          <TabsContent
            value="cookbook"
            forceMount
            className="flex-1 min-h-0 mt-0 overflow-hidden border border-border rounded-lg data-[state=inactive]:hidden"
          >
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
      <Suspense fallback={null}>
        <HomeContent />
      </Suspense>
    </ConversationProvider>
  );
}
