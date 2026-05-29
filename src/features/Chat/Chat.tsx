"use client";

import { useConversationContext } from "@/contexts/ConversationContext";
import { ConversationsMobileSheet } from "@/features/Conversations";
import { useChatSession } from "./hooks/useChatSession";
import { useRef, useState } from "react";
import ConversationItemMenu from "@/features/Conversations/components/ConversationItemMenu";
import { MessageInput } from "./components/MessageInput";
import { MessageList } from "./components/MessageList";
import { LOADING_MESSAGES, SUGGESTIONS } from "./constants";

const Chat = () => {
  const {
    userId,
    activeConversationId,
    allMessages,
    status,
    submittedAt,
    handleSendMessage,
    handleRecipeDetected,
  } = useChatSession();

  const {
    activeConversation,
    renameConversation,
    deleteConversation,
  } = useConversationContext();

  const [convSheetOpen, setConvSheetOpen] = useState(false);
  const [mobileRenaming, setMobileRenaming] = useState(false);
  const [mobileRenameValue, setMobileRenameValue] = useState("");
  const mobileCommittingRef = useRef(false);

  const messageCount = allMessages.length - 1; // exclude initial

  const commitMobileRename = async () => {
    if (mobileCommittingRef.current) return;
    mobileCommittingRef.current = true;
    const trimmed = mobileRenameValue.trim();
    if (trimmed && trimmed !== (activeConversation?.title ?? "New chat") && activeConversationId) {
      await renameConversation(activeConversationId, trimmed);
    }
    setMobileRenaming(false);
    mobileCommittingRef.current = false;
  };

  if (!userId) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div className="animate-pulse">
          {LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col animate-in fade-in duration-300 h-full"
    >
      {/* Mobile bar — hidden when persistent rail is present */}
      <div className="lg:hidden flex items-center justify-between px-3 py-2 border-b border-dashed border-border shrink-0">
        <button
          onClick={() => setConvSheetOpen(true)}
          className="flex items-center justify-center w-11 h-11 rounded-lg text-ink-faint hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
          aria-label="Open conversations"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        {mobileRenaming ? (
          <input
            autoFocus
            className="flex-1 mx-2 font-display italic font-medium text-[16.5px] text-foreground bg-transparent border-b border-primary outline-none"
            value={mobileRenameValue}
            onChange={(e) => setMobileRenameValue(e.target.value)}
            onBlur={commitMobileRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); commitMobileRename(); }
              if (e.key === "Escape") setMobileRenaming(false);
            }}
          />
        ) : (
          <>
            <span className="flex-1 mx-2 font-display italic font-medium text-[16.5px] text-foreground leading-tight tracking-tight truncate">
              {activeConversation?.title ?? "New chat"}
            </span>
            <ConversationItemMenu
              conversationTitle={activeConversation?.title ?? "New chat"}
              onStartRename={() => {
                setMobileRenameValue(activeConversation?.title ?? "New chat");
                setMobileRenaming(true);
              }}
              onDelete={() => activeConversationId ? deleteConversation(activeConversationId) : Promise.resolve()}
              canDelete={messageCount > 0}
            />
          </>
        )}
      </div>
      <MessageList
        messages={allMessages}
        status={status}
        submittedAt={submittedAt}
        userId={userId}
        onSend={handleSendMessage}
        onRecipeDetected={handleRecipeDetected}
      />
      {status === "ready" && messageCount === 0 && (
        <div className="px-4 pb-1">
          <div className="flex gap-2 flex-wrap max-w-5xl mx-auto">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSendMessage(s)}
              className="inline-flex items-center min-h-11 px-3.5 text-[12.5px] text-muted-foreground border border-border rounded-full hover:border-border-soft hover:text-foreground transition-colors cursor-pointer"
            >
              {s}
            </button>
          ))}
          </div>
        </div>
      )}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={status !== "ready"}
      />
      <ConversationsMobileSheet open={convSheetOpen} onOpenChange={setConvSheetOpen} />
    </div>
  );
};

export default Chat;
