"use client";

import { useChatSession } from "./hooks/useChatSession";
import { useRouter } from "next/navigation";
import { ChatEmptyState } from "./components/ChatEmptyState";
import { MessageInput } from "./components/MessageInput";
import { MessageList } from "./components/MessageList";
import { LOADING_MESSAGES } from "./constants";

const Chat = () => {
  const {
    userId,
    allMessages,
    status,
    submittedAt,
    isSending,
    handleSendMessage,
    handleRecipeDetected,
  } = useChatSession();

  const router = useRouter();

  const messageCount = allMessages.length - 1; // exclude initial

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
      {messageCount === 0 && status === "ready" && !isSending ? (
        <ChatEmptyState
          onSend={handleSendMessage}
          onCookWith={() => router.replace("/?tab=pantry&selectionMode=1")}
        />
      ) : (
        <MessageList
          messages={allMessages}
          status={status}
          submittedAt={submittedAt}
          isSending={isSending}
          userId={userId}
          onSend={handleSendMessage}
          onRecipeDetected={handleRecipeDetected}
        />
      )}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={status !== "ready" || isSending}
      />
    </div>
  );
};

export default Chat;
