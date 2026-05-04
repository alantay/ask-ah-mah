"use client";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConversationProvider } from "@/contexts/ConversationContext";
import { RecipeProvider, useRecipeContext } from "@/contexts/RecipeContext";
import ChatWrapper from "@/features/Chat/components/ChatWrapper";
import InventoryWrapper from "@/features/Inventory/components/InventoryWrapper";
import RecipeDisplay from "@/features/RecipeDisplay/RecipeDisplay";
import RecipeList from "@/features/RecipeList/RecipeList";
import { useState } from "react";

function HomeContent() {
  const { selectedRecipe, exitRecipe } = useRecipeContext();
  const [pantryOpen, setPantryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");

  return (
    <div className="bg-background">
      <main className="xl:container mx-auto h-[calc(100dvh-6rem)] sm:h-[calc(100dvh-6.5rem)] md:h-[calc(100dvh-8rem)]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col pt-2">
          <TabsList>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="cookbook">Cookbook</TabsTrigger>
          </TabsList>

          {/* ── Chat tab ── */}
          <TabsContent value="chat" className="flex-1 min-h-0 mt-0">
            <div className="flex h-full border border-border rounded-lg overflow-hidden">
              <section className="flex-7 min-w-0 relative flex flex-col bg-chat border-r border-border paper">
                <ChatWrapper />
                {/* Mobile: pantry button above the input */}
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute bottom-[72px] right-4 lg:hidden z-10 cursor-pointer gap-1.5"
                  onClick={() => setPantryOpen(true)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 21V22H7V21C6.46957 21 5.96086 20.7893 5.58579 20.4142C5.21071 20.0391 5 19.5304 5 19V4C5 3.46957 5.21071 2.96086 5.58579 2.58579C5.96086 2.21071 6.46957 2 7 2H17C17.5304 2 18.0391 2.21071 18.4142 2.58579C18.7893 2.96086 19 3.46957 19 4V19C19 19.5304 18.7893 20.0391 18.4142 20.4142C18.0391 20.7893 17.5304 21 17 21V22H15V21H9ZM7 4V9H17V4H7ZM7 19H17V11H7V19ZM8 12H10V15H8V12ZM8 6H10V8H8V6Z" fill="currentColor" />
                  </svg>
                  Pantry
                </Button>
              </section>

              {/* Desktop: inventory sidebar */}
              <aside className="flex-3 min-w-0 hidden lg:flex flex-col overflow-y-auto bg-muted paper">
                <InventoryWrapper />
              </aside>
            </div>
          </TabsContent>

          {/* ── Cookbook tab ── */}
          <TabsContent value="cookbook" className="flex-1 min-h-0 mt-0 overflow-hidden border border-border rounded-lg">
            <RecipeList onChatClick={() => setActiveTab("chat")} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Mobile: pantry bottom sheet */}
      <Drawer open={pantryOpen} onOpenChange={setPantryOpen} direction="bottom">
        <DrawerContent aria-label="Pantry">
          <DrawerTitle className="sr-only">Pantry</DrawerTitle>
          <div className="px-4 pt-6 pb-8 overflow-y-auto max-h-[75vh]">
            <InventoryWrapper />
          </div>
        </DrawerContent>
      </Drawer>

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
