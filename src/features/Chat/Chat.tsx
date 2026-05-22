"use client";

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
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { z } from "zod";
import ConversationItemMenu from "@/features/Conversations/components/ConversationItemMenu";
import { MessageInput } from "./components/MessageInput";
import { MessageList } from "./components/MessageList";
import { INITIAL_MESSAGE, LOADING_MESSAGES } from "./constants";
import { convertToUIMessage } from "./utils";

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
    renameConversation,
    autoTitleActiveConversation,
    deleteConversation,
  } = useConversationContext();
  const [convSheetOpen, setConvSheetOpen] = useState(false);
  const [mobileRenaming, setMobileRenaming] = useState(false);
  const [mobileRenameValue, setMobileRenameValue] = useState("");
  const [submittedAt, setSubmittedAt] = useState<number | null>(null);
  const autoTitledConversations = useRef<Set<string>>(new Set());
  const autoTitlingConversations = useRef<Set<string>>(new Set());
  const mobileCommittingRef = useRef(false);

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

  // Clear loader state once the response starts streaming
  useEffect(() => {
    if (status !== "submitted") {
      setSubmittedAt(null);
    }
  }, [status]);

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

  // Prefer the rich useChat version (which may have tool parts) over the text-only saved version.
  // Filter savedMessages to exclude any message whose text is already represented in the
  // live useChat messages — avoids duplicates while keeping tool-call parts visible.
  const savedMessagesFiltered = savedMessages.filter((savedMsg) => {
    const savedContent = savedMsg.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("");

    return !messages.some((currentMsg) => {
      const currentContent = currentMsg.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("");

      return (
        savedContent === currentContent && savedMsg.role === currentMsg.role
      );
    });
  });

  const allMessages = [INITIAL_MESSAGE, ...savedMessagesFiltered, ...messages];
  const messageCount = allMessages.length - 1; // exclude initial

  const handleSendMessage = async (message: string) => {
    setSubmittedAt(Date.now());
    sendMessage({ text: message });
    await saveMessage("user", message);
  };

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

  return (
    <div
      key={activeConversationId}
      className="flex flex-col animate-in fade-in duration-300 h-full"
    >
      {/* Mobile bar — hidden when persistent rail is present */}
      <div className="lg:hidden flex items-center justify-between px-3 py-2 border-b border-dashed border-border shrink-0">
        {/* Hamburger */}
        <button
          onClick={() => setConvSheetOpen(true)}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-ink-faint hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
          aria-label="Open conversations"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Active conversation actions — inline rename or 3-dot menu */}
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
          <ConversationItemMenu
            conversationTitle={activeConversation?.title ?? "New chat"}
            onStartRename={() => {
              setMobileRenameValue(activeConversation?.title ?? "New chat");
              setMobileRenaming(true);
            }}
            onDelete={() => activeConversationId ? deleteConversation(activeConversationId) : Promise.resolve()}
            canDelete={messageCount > 0}
          />
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
        <div className="flex gap-2 px-4 pb-1 flex-wrap">
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
