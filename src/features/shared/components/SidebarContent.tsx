"use client";

import AboutPopOver from "@/components/AboutPopOver";
import { AuthButton } from "@/features/Auth";
import { Conversations } from "@/features/Conversations";
import { useConversationContext } from "@/contexts/ConversationContext";
import { useActiveTab } from "@/hooks/useActiveTab";
import Image from "next/image";
import { useRouter } from "next/navigation";

const ChatIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const PantryIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 01-8 0" />
  </svg>
);

const CookbookIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
  </svg>
);

const ShoppingListIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m5 11 4-7" />
    <path d="m19 11-4-7" />
    <path d="M2 11h20" />
    <path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4" />
    <path d="m9 11 1 9" />
    <path d="m15 11-1 9" />
  </svg>
);

const NAV_ITEMS = [
  { id: "chat",     label: "New Chat",      Icon: ChatIcon         },
  { id: "pantry",   label: "Pantry",        Icon: PantryIcon       },
  { id: "shopping", label: "Shopping List", Icon: ShoppingListIcon },
  { id: "cookbook", label: "Cookbook",      Icon: CookbookIcon     },
] as const;

interface SidebarContentProps {
  /** Called after any navigation action — used by the mobile drawer to close itself. */
  onNavigate?: () => void;
}

/**
 * The shared inner content of the primary navigation: brand, section nav,
 * conversation list, and footer. Rendered by both the desktop `AppSidebar`
 * (`<aside>`) and the mobile nav drawer (`MobileTopBar`'s `Sheet`).
 */
export function SidebarContent({ onNavigate }: SidebarContentProps) {
  const router = useRouter();
  const { activeConversationId, pendingConversationId, conversations, startNewConversation } = useConversationContext();

  const activeTab = useActiveTab();

  const navigate = (tab: string) => {
    router.replace(`/?tab=${tab}`, { scroll: false });
    onNavigate?.();
  };

  const handleNavClick = (id: string) => {
    if (id === "chat") {
      startNewConversation();
    }
    navigate(id);
  };

  // "New Chat" nav is highlighted whenever the panel shows an empty/new chat experience:
  // staging (no active id), OR active id points to a conversation with no messages yet.
  const activeConvHasMessages = activeConversationId
    ? (conversations.find(c => c.id === activeConversationId)?._count?.messages ?? 0) > 0
    : false;
  const isNewChatActive =
    activeTab === "chat" && !activeConvHasMessages && pendingConversationId === null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Brand — click to start a new chat */}
      <div className="px-4 py-4 shrink-0">
        <button
          onClick={() => handleNavClick("chat")}
          aria-label="Ask Ah Mah — start a new chat"
          className="flex items-center gap-2.5 -mx-1 px-1 py-0.5 rounded-lg hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="relative w-8 h-8 shrink-0">
            <Image src="/granny-icon.png" alt="Ask Ah Mah" fill className="object-contain" />
          </div>
          <span className="text-xl font-display italic tracking-[-0.015em] leading-none">
            <span className="font-normal text-ink-faint">Ask </span><span className="font-semibold text-primary">Ah Mah</span>
          </span>
        </button>
      </div>

      {/* Primary nav */}
      <nav className="px-2 pb-2 flex flex-col gap-0.5 shrink-0">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = id === "chat" ? isNewChatActive : activeTab === id;
          return (
            <button
              key={id}
              onClick={() => handleNavClick(id)}
              className={[
                "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-dense font-medium transition-colors text-left cursor-pointer",
                isActive
                  ? "bg-card text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/70",
              ].join(" ")}
            >
              <span className={isActive ? "text-primary" : ""}>
                <Icon />
              </span>
              {label}
            </button>
          );
        })}
      </nav>

      {/* Conversations — always visible */}
      <div className="flex-1 min-h-0 px-3 pt-3 flex flex-col overflow-hidden border-t border-border">
        <Conversations onItemClick={() => navigate("chat")} />
      </div>

      {/* Footer */}
      <div className="shrink-0 px-4 py-3 border-t border-border flex items-center gap-2">
        <AboutPopOver className="flex" />
        <AuthButton />
      </div>
    </div>
  );
}
