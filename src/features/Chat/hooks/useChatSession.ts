"use client";

import { useConversationContext } from "@/contexts/ConversationContext";
import { useSessionContext } from "@/contexts/SessionContext";
import {
  AddInventoryItemSchemaObj,
  RemoveInventoryItemSchemaObj,
} from "@/lib/inventory/schemas";
import { SavedMessage } from "@/lib/messages/schemas";
import { fetcher, upperCaseFirstLetter } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { z } from "zod";
import { INITIAL_MESSAGE } from "../constants";
import { convertToUIMessage } from "../utils";

export function useChatSession() {
  const { userId } = useSessionContext();
  const {
    activeConversationId,
    setPendingConversation,
    commitConversation,
    autoTitleActiveConversation,
    pendingCookWithMessage,
    clearCookWithMessage,
  } = useConversationContext();

  const [submittedAt, setSubmittedAt] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  // Synchronous re-entrancy guard: prevents duplicate sends during the async
  // pre-send gap (conversation create + message save) before status flips.
  const sendingRef = useRef(false);
  const autoTitledConversations = useRef<Set<string>>(new Set());
  const autoTitlingConversations = useRef<Set<string>>(new Set());

  // Tracks the conversation id to inject at request time (may be null in staging).
  // Synced via effect (not during render) so an explicit set in handleSendMessage
  // isn't overwritten by a re-render triggered by setPendingConversation.
  const convIdRef = useRef<string | null>(activeConversationId);
  useEffect(() => {
    convIdRef.current = activeConversationId;
  }, [activeConversationId]);

  // Holds the pending conversation id during the first-message stream
  const pendingConvIdRef = useRef<string | null>(null);

  // Snapshot of the conversation id at send time — used in onFinish and transport
  // so mid-stream navigation cannot redirect messages to a different conversation.
  const inFlightConvIdRef = useRef<string | null>(null);

  // Stable transport that reads inFlightConvIdRef at send time via prepareSendMessagesRequest.
  // prepareSendMessagesRequest returns the COMPLETE body (not merged), so messages
  // must be explicitly included alongside our dynamic fields.
  const transport = useRef(
    new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ messages, body }) => ({
        body: {
          messages,
          ...body,
          userId,
          conversationId: inFlightConvIdRef.current,
        },
      }),
    })
  ).current;

  const { messages, sendMessage, status } = useChat({
    id: activeConversationId ?? "staging",
    transport,
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
      const convId = inFlightConvIdRef.current;

      if (message.role === "assistant") {
        const content = message.parts
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("");
        if (content && convId) await saveMessage("assistant", content, convId);
      }

      message.parts.forEach((part) => {
        // Items captured server-side (deterministic pre-extraction) — no tool
        // call fired for these, so surface them here.
        if (part.type === "data-capturedInventory") {
          const { items } = (part as { data: { items: string[] } }).data;
          if (items.length > 0) {
            toast.success(
              `${items.map((name) => upperCaseFirstLetter(name)).join(", ")} added to inventory!`
            );
            mutate(`/api/inventory?userId=${userId}`);
          }
          return;
        }

        if (part.type.startsWith("tool-")) {
          const { input } = part as {
            input:
              | z.infer<typeof AddInventoryItemSchemaObj>
              | z.infer<typeof RemoveInventoryItemSchemaObj>;
          };

          switch (part.type) {
            case "tool-addInventoryItem": {
              const addInput = input as z.infer<typeof AddInventoryItemSchemaObj>;
              toast.success(
                `${addInput.items.map((i) => upperCaseFirstLetter(i.name)).join(", ")} added to inventory!`
              );
              mutate(`/api/inventory?userId=${userId}`);
              break;
            }
            case "tool-removeInventoryItem": {
              const removeInput = input as z.infer<typeof RemoveInventoryItemSchemaObj>;
              toast.success(
                `${removeInput.itemNames.map((i) => upperCaseFirstLetter(i)).join(", ")} removed from inventory!`
              );
              mutate(`/api/inventory?userId=${userId}`);
              break;
            }
          }
        }
      });

      // Commit pending conversation after stream completes
      const pendingId = pendingConvIdRef.current;
      if (pendingId) {
        pendingConvIdRef.current = null;
        commitConversation(pendingId);
      }
    },
  });

  const { data, isLoading: messagesLoading } = useSWR<SavedMessage[]>(
    userId && activeConversationId
      ? `/api/message?conversationId=${activeConversationId}`
      : null,
    fetcher,
    { shouldRetryOnError: true, revalidateOnMount: true }
  );

  const saveMessage = async (
    role: "user" | "assistant",
    content: string,
    convId?: string | null
  ) => {
    const targetConvId = convId ?? convIdRef.current;
    if (!targetConvId) return;
    try {
      const response = await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          conversationId: targetConvId,
          role,
          content,
        }),
      });
      if (!response.ok)
        throw new Error(
          `Save failed: ${response.status} (conversationId: ${targetConvId})`
        );
      mutate(`/api/message?conversationId=${targetConvId}`);
    } catch (error) {
      console.error("Failed to save message:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (status !== "submitted") setSubmittedAt(null);
    // Once status leaves "ready" the AI SDK's own disable logic takes over.
    // Release the sync lock so it doesn't block re-sends after the response.
    if (status !== "ready") {
      sendingRef.current = false;
      setIsSending(false);
    }
  }, [status]);

  // Auto-send a Cook With What You Have message queued by the Pantry.
  // Fires once status is "ready" and the session is in staging state.
  useEffect(() => {
    if (!pendingCookWithMessage) return;
    if (status !== "ready") return;
    if (activeConversationId !== null) return; // only in staging
    const msg = pendingCookWithMessage;
    handleSendMessage(msg)
      .then(() => clearCookWithMessage())
      .catch((err) => console.error("Cook-with auto-send failed:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCookWithMessage, status, activeConversationId]);

  const handleRecipeDetected = useCallback(
    (recipeTitle: string) => {
      if (!activeConversationId) return;
      if (autoTitledConversations.current.has(activeConversationId)) return;
      if (autoTitlingConversations.current.has(activeConversationId)) return;
      autoTitlingConversations.current.add(activeConversationId);
      void autoTitleActiveConversation(recipeTitle).then((success) => {
        autoTitlingConversations.current.delete(activeConversationId!);
        if (success) autoTitledConversations.current.add(activeConversationId!);
      });
    },
    [activeConversationId, autoTitleActiveConversation]
  );

  const savedMessages = (data || []).map(convertToUIMessage);

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
      return savedContent === currentContent && savedMsg.role === currentMsg.role;
    });
  });

  const allMessages = [INITIAL_MESSAGE, ...savedMessagesFiltered, ...messages];

  const handleSendMessage = async (message: string) => {
    // Synchronous guard: bail immediately if a send is already in progress.
    if (sendingRef.current) return;
    sendingRef.current = true;
    setIsSending(true);
    setSubmittedAt(Date.now());

    try {
      if (!activeConversationId) {
        // Staging path: create conversation before sending
        const res = await fetch("/api/conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        if (!res.ok) {
          throw new Error(`Could not start conversation (${res.status})`);
        }
        const { conversation } = await res.json();

        // Update refs so transport injects the right id
        convIdRef.current = conversation.id;
        pendingConvIdRef.current = conversation.id;
        inFlightConvIdRef.current = conversation.id;

        // Optimistically show in sidebar with pending state
        setPendingConversation(conversation);

        // Save user message under the new conversation id
        await saveMessage("user", message, conversation.id);
      } else {
        inFlightConvIdRef.current = activeConversationId;
        await saveMessage("user", message);
      }

      // sendMessage flips status → "submitted", which releases the lock via
      // the status effect above and hands disable/loader back to status.
      sendMessage({ text: message });
    } catch (err) {
      console.error("Send failed:", err);
      toast.error("Aiyah, could not send your message. Please try again!");
      // Release lock so the user can retry.
      sendingRef.current = false;
      setIsSending(false);
      setSubmittedAt(null);
    }
  };

  return {
    userId,
    activeConversationId,
    allMessages,
    status,
    submittedAt,
    isSending,
    messagesLoading,
    handleSendMessage,
    handleRecipeDetected,
  };
}
