"use client";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConversationProvider } from "@/contexts/ConversationContext";
import { RecipeProvider, useRecipeContext } from "@/contexts/RecipeContext";
import ChatWrapper from "@/features/Chat/components/ChatWrapper";
import { ConversationsRail } from "@/features/Conversations";
import InventoryWrapper from "@/features/Inventory/components/InventoryWrapper";
import { PantryDrawer } from "@/features/Inventory";
import RecipeDisplay from "@/features/RecipeDisplay/RecipeDisplay";
import RecipeList from "@/features/RecipeList/RecipeList";
import { useEffect, useState } from "react";

function HomeContent() {
  const { selectedRecipe, exitRecipe } = useRecipeContext();
  const [activeTab, setActiveTab] = useState("chat");

  // Pantry tab is mobile-only; snap back to Chat if the viewport crosses to lg+ while on it
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const handleChange = () => {
      if (mq.matches && activeTab === "pantry") setActiveTab("chat");
    };
    handleChange();
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, [activeTab]);

  return (
    <div className="bg-background">
      <main className="xl:container mx-auto h-[calc(100dvh-6rem)] sm:h-[calc(100dvh-6.5rem)] md:h-[calc(100dvh-8rem)]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col pt-2">
          <TabsList>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="pantry" className="lg:hidden">Pantry</TabsTrigger>
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

              {/* Right: Pantry rail — hidden on mobile (mobile uses the Pantry tab instead) */}
              <PantryDrawer />
            </div>
          </TabsContent>

          {/* ── Pantry tab (mobile only) ── */}
          <TabsContent
            value="pantry"
            className="lg:hidden flex-1 min-h-0 mt-0 overflow-y-auto border border-border rounded-lg bg-muted paper"
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
