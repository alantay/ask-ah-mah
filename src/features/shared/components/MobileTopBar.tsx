"use client";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import ConversationItemMenu from "@/features/Conversations/components/ConversationItemMenu";
import { useConversationContext } from "@/contexts/ConversationContext";
import { useActiveSection } from "@/hooks/useActiveSection";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { SidebarContent } from "./SidebarContent";

const SECTION_LABELS: Record<"pantry" | "shopping" | "cookbook", string> = {
  pantry: "Pantry",
  shopping: "Shopping List",
  cookbook: "Cookbook",
};

/**
 * Mobile-only top bar (`<lg`). Owns the nav drawer (a full mirror of the
 * desktop `AppSidebar` via `SidebarContent`) and renders a section-aware
 * title: the active conversation title on the Chat section, the section name
 * elsewhere. The rename/delete menu appears only on Chat.
 */
export function MobileTopBar() {
  const activeSection = useActiveSection();
  const pathname = usePathname();
  const router = useRouter();
  // Recipe detail is a pushed view under the Cookbook section — the top bar
  // acts as its back affordance (replacing the nav drawer trigger) instead of
  // duplicating a back button inside the recipe's own action row.
  const isRecipeDetail = pathname.startsWith("/recipe");
  const {
    activeConversation,
    activeConversationId,
    renameConversation,
    deleteConversation,
  } = useConversationContext();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  // Set when Escape cancels the rename, so the resulting blur doesn't commit.
  const cancelRenameOnBlurRef = useRef(false);

  const isChat = activeSection === "chat";
  const conversationTitle = activeConversation?.title ?? "New chat";
  const canDelete = (activeConversation?._count?.messages ?? 0) > 0;

  const commitRename = async () => {
    setRenaming(false);
    if (cancelRenameOnBlurRef.current) {
      cancelRenameOnBlurRef.current = false;
      return;
    }
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== conversationTitle && activeConversationId) {
      await renameConversation(activeConversationId, trimmed);
    }
  };

  return (
    <>
      <div className="lg:hidden flex items-center gap-1 px-3 py-2 border-b border-border shrink-0">
        {isRecipeDetail ? (
          <button
            onClick={() => router.push("/?tab=cookbook")}
            className="flex items-center gap-1.5 min-h-11 -ml-2 px-2 rounded-lg text-ink-faint hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Back to cookbook"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="shrink-0">
              <path d="M9 3.5 4.5 8 9 12.5M4.5 8H13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-display italic font-medium text-base text-foreground leading-tight tracking-tight">
              Cookbook
            </span>
          </button>
        ) : (
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center justify-center w-11 h-11 -ml-2 rounded-lg text-ink-faint hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
            aria-label="Open navigation"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}

        {!isRecipeDetail && (isChat ? (
          renaming ? (
            <input
              autoFocus
              className="flex-1 mx-1 font-display italic font-medium text-base text-foreground bg-transparent border-b border-primary outline-none"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  cancelRenameOnBlurRef.current = true;
                  setRenaming(false);
                }
              }}
            />
          ) : (
            <>
              <span className="flex-1 mx-1 font-display italic font-medium text-base text-foreground leading-tight tracking-tight truncate">
                {conversationTitle}
              </span>
              <ConversationItemMenu
                conversationTitle={conversationTitle}
                onStartRename={() => {
                  setRenameValue(conversationTitle);
                  setRenaming(true);
                }}
                onDelete={() => activeConversationId ? deleteConversation(activeConversationId) : Promise.resolve()}
                canDelete={canDelete}
              />
            </>
          )
        ) : (
          <span className="flex-1 mx-1 font-display italic font-medium text-base text-foreground leading-tight tracking-tight truncate">
            {SECTION_LABELS[activeSection]}
          </span>
        ))}
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-[280px] p-0 bg-muted paper" showCloseButton={false}>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent onNavigate={() => setDrawerOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
