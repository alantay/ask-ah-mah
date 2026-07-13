"use client";
import { SectionSwitcher } from "@/features/shared/components/SectionSwitcher";
import ChatWrapper from "@/features/Chat/components/ChatWrapper";
import InventoryWrapper from "@/features/Inventory/components/InventoryWrapper";
import RecipeList from "@/features/RecipeList/RecipeList";
import ShoppingList from "@/features/ShoppingList";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

function HomeContent() {
  const router = useRouter();
  const urlSection = useActiveSection();
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

  // Drive the visible Section from local state so switching is instant; the URL
  // is synced in the background. Without this, the active Section is derived
  // from the URL and every switch waits on a router round-trip (feels like it
  // hangs).
  const [activeSection, setLocalSection] = useState(urlSection);

  // Re-sync when the URL-derived Section changes externally (e.g. /recipe/* → cookbook).
  useEffect(() => {
    setLocalSection(urlSection);
  }, [urlSection]);

  const setActiveSection = (section: string) => {
    setLocalSection(section as typeof urlSection);
    router.replace(`/?tab=${section}`, { scroll: false });
  };

  return (
    <div className="bg-background paper h-full lg:h-full flex flex-col">
      <main className="w-full xl:container 2xl:max-w-screen-xl mx-auto h-[calc(100dvh-3.25rem)] sm:h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] lg:flex-1 lg:min-h-0">
        {/* Nav is driven by the AppSidebar (desktop) and MobileTopBar drawer
            (mobile); this only switches the Section panels below. All panels
            stay mounted (inactive ones hidden) so in-flight state survives
            switching — see ADR-0019. */}
        <div className="h-full flex flex-col">
          <SectionSwitcher
            active={activeSection}
            sections={[
              {
                id: "chat",
                className: "flex-1 min-h-0",
                panel: (
                  <div className="flex h-full overflow-hidden relative lg:border lg:border-border">
                    <section className="flex-1 min-w-0 relative flex flex-col bg-chat">
                      <ChatWrapper />
                    </section>
                  </div>
                ),
              },
              {
                id: "pantry",
                className:
                  "flex-1 min-h-0 overflow-hidden border border-border bg-muted paper",
                panel: <InventoryWrapper />,
              },
              {
                id: "shopping",
                className:
                  "flex-1 min-h-0 overflow-hidden border border-border bg-muted paper",
                panel: <ShoppingList />,
              },
              {
                id: "cookbook",
                className: "flex-1 min-h-0 overflow-hidden border border-border",
                panel: <RecipeList onChatClick={() => setActiveSection("chat")} />,
              },
            ]}
          />
        </div>
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
