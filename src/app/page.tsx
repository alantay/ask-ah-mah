"use client";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConversationProvider } from "@/contexts/ConversationContext";
import { RecipeProvider, useRecipeContext } from "@/contexts/RecipeContext";
import ChatWrapper from "@/features/Chat/components/ChatWrapper";
import { ConversationsRail } from "@/features/Conversations";
import InventoryWrapper from "@/features/Inventory/components/InventoryWrapper";
import RecipeDisplay from "@/features/RecipeDisplay/RecipeDisplay";
import RecipeList from "@/features/RecipeList/RecipeList";
import { useState } from "react";

function HomeContent() {
  const { selectedRecipe, exitRecipe } = useRecipeContext();
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

      {/* Recipe detail sheet — wide right-side sheet over faded cookbook */}
      <Sheet open={!!selectedRecipe} onOpenChange={(open) => !open && exitRecipe()}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full sm:max-w-[min(900px,75vw)] overflow-hidden p-0 bg-chat paper"
        >
          <RecipeDisplay key={selectedRecipe?.id} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function Home() {
  return (
    <RecipeProvider>
      <ConversationProvider>
        <HomeContent />
      </ConversationProvider>
    </RecipeProvider>
  );
}
