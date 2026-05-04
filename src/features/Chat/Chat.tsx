"use client";

import { Button } from "@/components/ui/button";
import { useConversationContext } from "@/contexts/ConversationContext";
import { useSessionContext } from "@/contexts/SessionContext";
import {
  AddInventoryItemSchemaObj,
  RemoveInventoryItemSchemaObj,
} from "@/lib/inventory/schemas";
import { SavedMessage } from "@/lib/messages/schemas";
import { upperCaseFirstLetter } from "@/lib/utils";
import { fetcher } from "@/lib/utils/index";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { z } from "zod";
import { MessageInput } from "./components/MessageInput";
import { MessageList } from "./components/MessageList";
import { INITIAL_MESSAGE, LOADING_MESSAGES } from "./constants";
import { convertToUIMessage, getRandomThinkingMessage } from "./utils";

const SUGGESTIONS = [
  "What can I cook tonight?",
  "I just got groceries",
  "Something quick for one",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function getTitleFallback(createdAt: Date | undefined): string {
  if (!createdAt) return "Today's kitchen";
  const day = new Date(createdAt).toLocaleDateString("en-US", {
    weekday: "long",
  });
  return `${day}'s kitchen`;
}

// ── ConversationTitle ─────────────────────────────────────────────────────────

interface ConversationTitleProps {
  title: string | null | undefined;
  createdAt: Date | string | undefined;
  onRename: (title: string) => Promise<void>;
}

function ConversationTitle({ title, createdAt, onRename }: ConversationTitleProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const displayTitle = title ?? getTitleFallback(createdAt ? new Date(createdAt) : undefined);

  const startEditing = () => {
    setValue(displayTitle);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitRename = async () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== displayTitle) {
      await onRename(trimmed);
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitRename();
    } else if (e.key === "Escape") {
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="font-display italic font-medium text-[19px] text-foreground leading-tight tracking-tight bg-transparent border-b border-border outline-none w-full max-w-[280px]"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commitRename}
        onKeyDown={handleKeyDown}
        autoFocus
      />
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-display italic font-medium text-[19px] text-foreground leading-tight tracking-tight">
        {displayTitle}
      </span>
      <button
        onClick={startEditing}
        className="text-ink-faint hover:text-muted-foreground transition-colors cursor-pointer"
        aria-label="Rename conversation"
      >
        {/* Pencil icon 12×12 */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

// ── Chat ──────────────────────────────────────────────────────────────────────

const Chat = () => {
  const { userId } = useSessionContext();
  const {
    activeConversationId,
    activeConversation,
    startNewConversation,
    renameActiveConversation,
    archiveActiveConversation,
  } = useConversationContext();

  const { messages, sendMessage, status } = useChat({
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
        {/* TODO Slice 3: Mobile conversations button */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={archiveActiveConversation}
            className="cursor-pointer"
          >
            Archive
          </Button>
          <Button
            size="sm"
            onClick={startNewConversation}
            className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
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
    </div>
  );
};

export default Chat;
