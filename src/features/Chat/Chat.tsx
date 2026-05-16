"use client";

import { useConversationContext } from "@/contexts/ConversationContext";
import { useSessionContext } from "@/contexts/SessionContext";
import { ConversationsMobileSheet } from "@/features/Conversations";
import { PantryMobileSheet } from "@/features/Inventory";
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
import ConversationTitle, { ConversationActionsMenu } from "./components/ConversationTitle";
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
    startNewConversation,
    renameActiveConversation,
    autoTitleActiveConversation,
    deleteActiveConversation,
  } = useConversationContext();
  const [convSheetOpen, setConvSheetOpen] = useState(false);
  const [pantrySheetOpen, setPantrySheetOpen] = useState(false);
  const [titleEditing, setTitleEditing] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<number | null>(null);
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

  const handleDeleteConversation = async () => {
    await deleteActiveConversation();
  };

  return (
    <div
      key={activeConversationId}
      className="flex flex-col animate-in fade-in duration-300 h-full"
    >
      {/* Chat header — single row at all widths */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-dashed border-border shrink-0">
        {/* Hamburger — hidden when persistent sidebar is present */}
        <button
          onClick={() => setConvSheetOpen(true)}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-ink-faint hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
          aria-label="Open conversations"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Active indicator dot */}
        <div className="w-2 h-2 rounded-full bg-primary shrink-0 shadow-[0_0_0_4px_oklch(0.56_0.135_35/0.18)]" />

        {/* Title — flex-1 min-w-0 ensures truncation before buttons */}
        <div className="flex min-w-0 flex-1 overflow-hidden">
          <ConversationTitle
            title={activeConversation?.title}
            editing={titleEditing}
            onEditingChange={setTitleEditing}
            onRename={renameActiveConversation}
          />
        </div>

        {/* Pantry — mobile entry point; hidden at lg+ where the persistent rail shows */}
        <button
          onClick={() => setPantrySheetOpen(true)}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-ink-faint hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
          aria-label="Open pantry"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 21V22H7V21C6.46957 21 5.96086 20.7893 5.58579 20.4142C5.21071 20.0391 5 19.5304 5 19V4C5 3.46957 5.21071 2.96086 5.58579 2.58579C5.96086 2.21071 6.46957 2 7 2H17C17.5304 2 18.0391 2.21071 18.4142 2.58579C18.7893 2.96086 19 3.46957 19 4V19C19 19.5304 18.7893 20.0391 18.4142 20.4142C18.0391 20.7893 17.5304 21 17 21V22H15V21H9ZM7 4V9H17V4H7ZM7 19H17V11H7V19ZM8 12H10V15H8V12ZM8 6H10V8H8V6Z" fill="currentColor" />
          </svg>
        </button>

        {/* Overflow menu — new / rename / delete */}
        <ConversationActionsMenu
          onNewConversation={() => startNewConversation()}
          canStartNew={messageCount > 0}
          onStartRename={() => setTitleEditing(true)}
          onDelete={handleDeleteConversation}
          canDelete={messageCount > 0}
        />
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
      <PantryMobileSheet open={pantrySheetOpen} onOpenChange={setPantrySheetOpen} />
    </div>
  );
};

export default Chat;
