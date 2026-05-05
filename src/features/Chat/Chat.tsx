"use client";

import { Button } from "@/components/ui/button";
import { useConversationContext } from "@/contexts/ConversationContext";
import { useSessionContext } from "@/contexts/SessionContext";
import { ConversationsMobileSheet } from "@/features/Conversations";
import {
  AddInventoryItemSchemaObj,
  RemoveInventoryItemSchemaObj,
} from "@/lib/inventory/schemas";
import { SavedMessage } from "@/lib/messages/schemas";
import { upperCaseFirstLetter } from "@/lib/utils";
import { fetcher } from "@/lib/utils/index";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { z } from "zod";
import ConversationTitle from "./components/ConversationTitle";
import { MessageInput } from "./components/MessageInput";
import { MessageList } from "./components/MessageList";
import { INITIAL_MESSAGE, LOADING_MESSAGES } from "./constants";
import { convertToUIMessage, getRandomThinkingMessage } from "./utils";

const SUGGESTIONS = [
  "What can I cook tonight?",
  "I just got groceries",
  "Something quick for one",
];

// ── Chat ──────────────────────────────────────────────────────────────────────

const Chat = () => {
  const { userId } = useSessionContext();
  const {
    activeConversationId,
    activeConversation,
    startNewConversation,
    renameActiveConversation,
    autoTitleActiveConversation,
    archiveActiveConversation,
  } = useConversationContext();
  const [convSheetOpen, setConvSheetOpen] = useState(false);
  const autoTitledConversations = useRef<Set<string>>(new Set());
  const autoTitlingConversations = useRef<Set<string>>(new Set());

  const { messages, sendMessage, status } = useChat({
    id: activeConversationId ?? undefined,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        userId,
        conversationId: activeConversationId,
      },
    }),
    onError: (error) => {
      console.error("Chat error:", error);

      if (error.message.includes("503")) {
        toast.error(
          "Sorry lah, Ah Mah's cooking brain is taking a break! Try again in a few minutes."
        );
      } else {
        toast.error("Aiyah, something went wrong! Please try again later.");
      }
    },
    onFinish: async (options) => {
      const { message } = options;
      let toolCalled = false;

      if (message.role === "assistant") {
        const content = message.parts
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("");
        if (content) {
          await saveMessage("assistant", content);
        }
      }

      message.parts.forEach((part) => {
        if (part.type.startsWith("tool-")) {
          console.log(part.type, " called");
          const { input } = part as {
            input:
              | z.infer<typeof AddInventoryItemSchemaObj>
              | z.infer<typeof RemoveInventoryItemSchemaObj>;
          };

          switch (part.type) {
            case "tool-addInventoryItem":
              {
                const addInput = input as z.infer<
                  typeof AddInventoryItemSchemaObj
                >;

                toast.success(
                  `${addInput.items
                    .map((i) => upperCaseFirstLetter(i.name))
                    .join(", ")} added to inventory!`
                );
                mutate(`/api/inventory?userId=${userId}`);
              }
              break;
            case "tool-removeInventoryItem":
              {
                const removeInput = input as z.infer<
                  typeof RemoveInventoryItemSchemaObj
                >;

                toast.success(
                  `${removeInput.itemNames
                    .map((i) => upperCaseFirstLetter(i))
                    .join(", ")} removed from inventory!`
                );
                mutate(`/api/inventory?userId=${userId}`);
              }
              break;
            case "tool-getInventory":
              break;
          }
          toolCalled = true;
        }
      });
      if (!toolCalled) console.log("No tool called");
    },
  });

  const { data, isLoading: messagesLoading } = useSWR<SavedMessage[]>(
    userId && activeConversationId
      ? `/api/message?conversationId=${activeConversationId}`
      : null,
    fetcher,
    {
      shouldRetryOnError: true,
      revalidateOnMount: true,
    }
  );

  const saveMessage = async (role: "user" | "assistant", content: string) => {
    try {
      await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          conversationId: activeConversationId,
          role,
          content,
        }),
      });
      mutate(`/api/message?conversationId=${activeConversationId}`);
    } catch (error) {
      console.error("Failed to save message:", error);
    }
  };

  const thinkingMessage = useMemo(() => {
    return getRandomThinkingMessage();
  }, []);

  const handleRecipeDetected = useCallback((recipeTitle: string) => {
    if (!activeConversationId) return;
    if (autoTitledConversations.current.has(activeConversationId)) return;
    if (autoTitlingConversations.current.has(activeConversationId)) return;
    autoTitlingConversations.current.add(activeConversationId);
    void autoTitleActiveConversation(recipeTitle).then((success) => {
      autoTitlingConversations.current.delete(activeConversationId);
      if (success) {
        autoTitledConversations.current.add(activeConversationId);
      }
    });
  }, [activeConversationId, autoTitleActiveConversation]);

  // Show loading state while session or conversation is loading
  if (messagesLoading || !userId || !activeConversationId) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div className="animate-pulse">
          {
            LOADING_MESSAGES[
              Math.floor(Math.random() * LOADING_MESSAGES.length)
            ]
          }
        </div>
      </div>
    );
  }

  const savedMessages = (data || []).map(convertToUIMessage);
  const currentMessages = messages.filter((currentMsg) => {
    const currentContent = currentMsg.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("");

    return !savedMessages.some((savedMsg) => {
      const savedContent = savedMsg.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("");

      return (
        savedContent === currentContent && savedMsg.role === currentMsg.role
      );
    });
  });

  const allMessages = [INITIAL_MESSAGE, ...savedMessages, ...currentMessages];
  const messageCount = allMessages.length - 1; // exclude initial

  const startedAt = activeConversation?.createdAt
    ? new Date(activeConversation.createdAt).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : null;

  const handleSendMessage = async (message: string) => {
    sendMessage({ text: message });
    await saveMessage("user", message);
  };

  return (
    <div
      key={activeConversationId}
      className="flex flex-col animate-in fade-in duration-300 h-full"
    >
      <div className="hidden sm:flex items-center justify-between px-7 py-3.5 border-b border-dashed border-border shrink-0">
        <div className="flex items-center gap-3">
          {/* Active indicator dot */}
          <div
            className="w-2 h-2 rounded-full bg-primary shrink-0"
            style={{ boxShadow: "oklch(0.56 0.135 35 / 0.18) 0 0 0 4px" }}
          />
          <div>
            <ConversationTitle
              title={activeConversation?.title}
              createdAt={activeConversation?.createdAt}
              onRename={renameActiveConversation}
            />
            <div className="text-[11.5px] text-ink-faint mt-0.5 tracking-wide">
              {messageCount > 0
                ? `${messageCount} message${messageCount !== 1 ? "s" : ""}${startedAt ? ` · started ${startedAt}` : ""}`
                : "Start a conversation"}
            </div>
          </div>
        </div>
        {/* Mobile: conversations button */}
          <button
            onClick={() => setConvSheetOpen(true)}
            className="lg:hidden p-1.5 text-ink-faint hover:text-foreground transition-colors cursor-pointer"
            aria-label="Open conversations"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={archiveActiveConversation}
            disabled={messageCount === 0}
            title={messageCount === 0 ? "Nothing to archive yet" : undefined}
            className="cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Archive
          </Button>
          <Button
            size="sm"
            onClick={() => startNewConversation()}
            disabled={messageCount === 0}
            title={messageCount === 0 ? "Start a conversation first" : undefined}
            className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            + New conversation
          </Button>
        </div>
      </div>
      <MessageList
        messages={allMessages}
        status={status}
        userId={userId}
        thinkingMessage={thinkingMessage}
        onSend={handleSendMessage}
        onRecipeDetected={handleRecipeDetected}
      />
      {status === "ready" && messageCount === 0 && (
        <div className="flex gap-2 px-4 pb-1 flex-wrap">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSendMessage(s)}
              className="px-3 py-1.5 text-[12.5px] text-muted-foreground border border-border rounded-full hover:border-border-soft hover:text-foreground transition-colors cursor-pointer"
            >
              {s}
            </button>
          ))}
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
