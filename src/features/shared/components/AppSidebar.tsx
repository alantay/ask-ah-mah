"use client";

import AboutPopOver from "@/components/AboutPopOver";
import { AuthButton } from "@/features/Auth";
import { Conversations } from "@/features/Conversations/Conversations";
import { useConversationContext } from "@/contexts/ConversationContext";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const ChatIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ChatIconFilled = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const PantryIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 01-8 0" />
  </svg>
);

const PantryIconFilled = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
  </svg>
);

const CookbookIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
  </svg>
);

const CookbookIconFilled = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
  </svg>
);

const NAV_ITEMS = [
  { id: "chat",     label: "New Chat",  Icon: ChatIcon,     IconFilled: ChatIconFilled },
  { id: "pantry",   label: "Pantry",    Icon: PantryIcon,   IconFilled: PantryIconFilled },
  { id: "cookbook", label: "Cookbook",  Icon: CookbookIcon, IconFilled: CookbookIconFilled },
] as const;

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { activeConversationId, pendingConversationId, conversations, startNewConversation } = useConversationContext();

  const VALID_TABS = ["chat", "pantry", "cookbook"] as const;
  const raw = searchParams.get("tab");
  const activeTab = pathname.startsWith("/recipe")
    ? "cookbook"
    : (VALID_TABS as readonly string[]).includes(raw ?? "")
    ? raw!
    : "chat";

  const navigate = (tab: string) => {
    router.replace(`/?tab=${tab}`, { scroll: false });
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
    <aside className="hidden lg:flex flex-col w-[240px] shrink-0 bg-muted paper border-r border-border h-dvh sticky top-0 overflow-hidden">
      {/* Brand */}
      <div className="px-4 py-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 shrink-0">
            <Image src="/granny-icon.png" alt="Ask Ah Mah" fill className="object-contain" />
          </div>
          <span className="text-xl font-bold font-logo text-primary leading-none">Ask Ah Mah</span>
        </div>
      </div>

      {/* Primary nav */}
      <nav className="px-2 pb-2 flex flex-col gap-0.5 shrink-0">
        {NAV_ITEMS.map(({ id, label, Icon, IconFilled }) => {
          const isActive = id === "chat" ? isNewChatActive : activeTab === id;
          return (
            <button
              key={id}
              onClick={() => handleNavClick(id)}
              className={[
                "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13.5px] font-medium transition-colors text-left cursor-pointer",
                isActive
                  ? "bg-card text-foreground font-semibold"
                  : "text-ink-faint hover:text-foreground hover:bg-card/70",
              ].join(" ")}
            >
              <span className={isActive ? "text-primary" : ""}>
                {isActive ? <IconFilled /> : <Icon />}
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
    </aside>
  );
}
