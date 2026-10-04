"use client";

import { LoadError } from "@/features/shared/components/LoadError";
import { useChatSession } from "./hooks/useChatSession";
import { useRouter } from "next/navigation";
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
    error,
    historyError,
    historyRetrying,
    retryHistory,
    retryReply,
    handleSendMessage,
    handleRecipeDetected,
  } = useChatSession();

  const router = useRouter();

  const messageCount = allMessages.length;
  // messagesLoading is true only while fetching a just-switched-to conversation's
  // saved history — gate on it so a mid-switch data gap never renders the
  // full-screen empty state (see #383/#384).
  const isEmpty =
    messageCount === 0 &&
    status === "ready" &&
    !isSending &&
    !messagesLoading &&
    !historyError;

  // Only show the history skeleton when there's genuinely nothing on screen yet
  // (a real conversation switch or a cold load). On the new-chat path the reply
  // is already in the useChat store when commitConversation flips the history
  // fetch on, so gating on an empty view suppresses the redundant post-stream
  // skeleton flash while leaving the real switch/cold-load case intact.
  const showHistorySkeleton = messagesLoading && messageCount === 0;

  const composer = (
    <MessageInput
      onSendMessage={handleSendMessage}
      disabled={
        status === "submitted" || status === "streaming" || isSending || !!historyError
      }
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
      {historyError && (
        <div className="p-4 shrink-0">
          <LoadError
            message="Couldn’t load this conversation. Try again before sending another message."
            retrying={historyRetrying}
            onRetry={retryHistory}
          />
        </div>
      )}
      {error && (
        <div className="p-4 shrink-0">
          <LoadError
            message="Aiyah, the reply didn’t come through. Try again, or send another message below."
            retrying={status === "submitted" || status === "streaming"}
            onRetry={retryReply}
          />
        </div>
      )}
      {showHistorySkeleton ? (
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
            onRecipeDetected={handleRecipeDetected}
          />
          {composer}
        </>
      )}
    </div>
  );
};

export default Chat;
