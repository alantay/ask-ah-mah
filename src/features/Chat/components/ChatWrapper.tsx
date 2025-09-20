"use client";
import { useSessionContext } from "@/contexts/SessionContext";
import Chat from "../Chat";
import { LOADING_MESSAGES } from "../constants";

export default function ChatWrapper({ className }: { className?: string }) {
  const { userId, isLoading } = useSessionContext();

  return (
    <>
      {isLoading || !userId ? (
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
        <Chat />
      )}
    </>
  );
}
