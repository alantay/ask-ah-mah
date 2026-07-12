"use client";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import ChatWrapper from "@/features/Chat/components/ChatWrapper";
import InventoryWrapper from "@/features/Inventory/components/InventoryWrapper";
import RecipeList from "@/features/RecipeList/RecipeList";
import ShoppingList from "@/features/ShoppingList";
import { useActiveTab } from "@/hooks/useActiveTab";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

function HomeContent() {
  const router = useRouter();
  const urlTab = useActiveTab();
  const searchParams = useSearchParams();

  // A failed/expired auth callback (e.g. a stale magic link) redirects back
  // here with an `?error=` param. Surface it once, then strip it so a refresh
  // doesn't re-toast.
  useEffect(() => {
    if (!searchParams.get("error")) return;
    toast.error(
      "That sign-in link didn't work — it may have expired. Request a new one.",
    );
    const tab = searchParams.get("tab");
    router.replace(tab ? `/?tab=${tab}` : "/", { scroll: false });
  }, [searchParams, router]);

  // Drive the visible tab from local state so switching is instant; the URL is
  // synced in the background. Without this, the active tab is derived from the
  // URL and every switch waits on a router round-trip (feels like it hangs).
  const [activeTab, setLocalTab] = useState(urlTab);

  // Re-sync when the URL-derived tab changes externally (e.g. /recipe/* → cookbook).
  useEffect(() => {
    setLocalTab(urlTab);
  }, [urlTab]);

  const setActiveTab = (tab: string) => {
    setLocalTab(tab as typeof urlTab);
    router.replace(`/?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="bg-background paper h-full lg:h-full flex flex-col">
      <main className="w-full xl:container 2xl:max-w-screen-xl mx-auto h-[calc(100dvh-3.25rem)] sm:h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] lg:flex-1 lg:min-h-0">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
        >
          {/* Nav is driven by the AppSidebar (desktop) and MobileTopBar drawer (mobile);
              the Tabs container only switches the content panels below. */}

          {/* ── Chat tab ── */}
          <TabsContent
            value="chat"
            forceMount
            className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden"
          >
            <div className="flex h-full overflow-hidden relative lg:border lg:border-border">
              {/* Chat panel */}
              <section className="flex-1 min-w-0 relative flex flex-col bg-chat">
                <ChatWrapper />
              </section>
            </div>
          </TabsContent>

          {/* ── Pantry tab ── */}
          <TabsContent
            value="pantry"
            forceMount
            className="flex-1 min-h-0 mt-0 overflow-hidden border border-border bg-muted paper data-[state=inactive]:hidden"
          >
            <InventoryWrapper />
          </TabsContent>

          {/* ── Shopping List tab ── */}
          <TabsContent
            value="shopping"
            forceMount
            className="flex-1 min-h-0 mt-0 overflow-hidden border border-border bg-muted paper data-[state=inactive]:hidden"
          >
            <ShoppingList />
          </TabsContent>

          {/* ── Cookbook tab ── */}
          <TabsContent
            value="cookbook"
            forceMount
            className="flex-1 min-h-0 mt-0 overflow-hidden border border-border data-[state=inactive]:hidden"
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
