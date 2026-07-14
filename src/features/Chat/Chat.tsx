"use client";

import { useChatSession } from "./hooks/useChatSession";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChatEmptyState } from "./components/ChatEmptyState";
import { MessageInput } from "./components/MessageInput";
import { MessageList } from "./components/MessageList";
import { HistorySkeleton } from "./components/loaders";
import { LOADING_MESSAGES } from "./constants";

const Chat = () => {
  const {
    userId,
    allMessages,
    status,
    submittedAt,
    isSending,
    messagesLoading,
    handleSendMessage,
    handleRecipeDetected,
  } = useChatSession();

  const router = useRouter();

  // Seed text for the composer (e.g. the substitutions nudge). The nonce lets
  // the same request re-fire; MessageInput re-seeds on every nonce change.
  const [seed, setSeed] = useState<{ text: string; nonce: number } | null>(null);
  const handleDraft = (text: string) =>
    setSeed({ text, nonce: Date.now() });

  const messageCount = allMessages.length - 1; // exclude initial
  // messagesLoading is true only while fetching a just-switched-to conversation's
  // saved history — gate on it so a mid-switch data gap never renders the
  // full-screen empty state (see #383/#384).
  const isEmpty =
    messageCount === 0 && status === "ready" && !isSending && !messagesLoading;

  const composer = (
    <MessageInput
      onSendMessage={handleSendMessage}
      disabled={status !== "ready" || isSending}
      seed={seed}
      // In the first-run hero the composer is inset by the centered column, so
      // drop the bottom-bar padding and let it align with the opener cards.
      className={isEmpty ? "px-0 pb-0 pt-0" : undefined}
    />
  );

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
      {messagesLoading ? (
        <>
          <HistorySkeleton />
          {composer}
        </>
      ) : isEmpty ? (
        <ChatEmptyState
          onSend={handleSendMessage}
          onCookWith={() => router.replace("/?tab=pantry&selectionMode=1")}
          composer={composer}
        />
      ) : (
        <>
          <MessageList
            messages={allMessages}
            status={status}
            submittedAt={submittedAt}
            isSending={isSending}
            userId={userId}
            onSend={handleSendMessage}
            onDraft={handleDraft}
            onRecipeDetected={handleRecipeDetected}
          />
          {composer}
        </>
      )}
    </div>
  );
};

export default Chat;
