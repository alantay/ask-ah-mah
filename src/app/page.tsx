"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatWrapper from "@/features/Chat/components/ChatWrapper";
import InventoryWrapper from "@/features/Inventory/components/InventoryWrapper";
import RecipeList from "@/features/RecipeList/RecipeList";
import { useActiveTab } from "@/hooks/useActiveTab";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

function HomeContent() {
  const router = useRouter();
  const activeTab = useActiveTab();

  const setActiveTab = (tab: string) => {
    router.replace(`/?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="bg-background paper h-full lg:h-full flex flex-col">
      <main className="xl:container 2xl:max-w-screen-xl mx-auto h-[calc(100dvh-3.25rem)] sm:h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] lg:flex-1 lg:min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col pt-2 lg:pt-0">
          {/* Tab strip — hidden on desktop (sidebar handles nav) */}
          <TabsList className="lg:hidden">
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
              {/* Chat panel */}
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
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
