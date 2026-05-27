"use client";
import { useConversationContext } from "@/contexts/ConversationContext";
import { useSessionContext } from "@/contexts/SessionContext";
import Chat from "../Chat";
import { LOADING_MESSAGES } from "../constants";

export default function ChatWrapper() {
  const { userId, isLoading: sessionLoading } = useSessionContext();
  const { activeConversationId } =
    useConversationContext();

  const isLoading = sessionLoading || !userId;

  return (
    <>
      {isLoading ? (
        <div className="flex h-[600px] items-center justify-center">
          <div className="animate-pulse" suppressHydrationWarning>
            {
              LOADING_MESSAGES[
                Math.floor(Math.random() * LOADING_MESSAGES.length)
              ]
            }
          </div>
        </div>
      ) : (
        <Chat key={activeConversationId ?? "staging"} />
      )}
    </>
  );
}
