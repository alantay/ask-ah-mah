"use client";

import { useConversationContext } from "@/contexts/ConversationContext";
import { useSessionContext } from "@/contexts/SessionContext";
import {
  AddInventoryItemSchemaObj,
  RemoveInventoryItemSchemaObj,
} from "@/lib/inventory/schemas";
import { SavedMessage } from "@/lib/messages/schemas";
import { inventoryKey, messageKey } from "@/lib/swr/keys";
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

  // Set for exactly one render right before we call commitConversation
  // ourselves (see onFinish below), so the chatId-sync effect can tell "our
  // own commit just landed" apart from "the user switched conversations" and
  // skip that one activeConversationId change.
  const skipNextChatIdSyncRef = useRef(false);

  // The id passed to useChat below. Deliberately does NOT mirror
  // activeConversationId while a staging send's stream is still in flight or
  // just completing — changing useChat's `id` mid-flight resets its internal
  // message store, wiping whatever was just sent/streamed from view for a
  // beat (see #383/#384). It only re-syncs to activeConversationId for a
  // genuine conversation switch (e.g. the sidebar), never for the staging
  // conversation catching up to its own freshly-committed id.
  const [chatId, setChatId] = useState<string>(
    () => activeConversationId ?? "staging"
  );
  useEffect(() => {
    if (skipNextChatIdSyncRef.current) {
      skipNextChatIdSyncRef.current = false;
      return;
    }
    setChatId(activeConversationId ?? "staging");
  }, [activeConversationId]);

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
          conversationId: inFlightConvIdRef.current,
        },
      }),
    })
  ).current;

  const { messages, sendMessage, status } = useChat({
    id: chatId,
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

      // Safely read the string names out of a data-capturedInventory part —
      // guards against a malformed payload (missing data/items, non-array,
      // non-string entries) so a structure change can't crash the handler.
      const capturedItemsOf = (part: { type: string }): string[] => {
        const data = (part as { data?: { items?: unknown } }).data;
        if (!data || !Array.isArray(data.items)) return [];
        return data.items.filter((item): item is string => typeof item === "string");
      };

      // Names already added by the server-side capture this turn. The model
      // may still call addInventoryItem for the same items — dedupe against
      // these so the user doesn't get two toasts for one add.
      const capturedNames = new Set(
        message.parts
          .filter((part) => part.type === "data-capturedInventory")
          .flatMap(capturedItemsOf)
          .map((name) => name.toLowerCase())
      );

      const notifyInventory = (names: string[], verb: "added to" | "removed from") => {
        if (names.length === 0) return;
        toast.success(
          `${names.map((name) => upperCaseFirstLetter(name)).join(", ")} ${verb} inventory!`
        );
        if (userId) mutate(inventoryKey(userId));
      };

      message.parts.forEach((part) => {
        // Items captured server-side (deterministic pre-extraction) — no tool
        // call fired for these, so surface them here.
        if (part.type === "data-capturedInventory") {
          notifyInventory(capturedItemsOf(part), "added to");
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
              // Skip items already surfaced by server-side capture.
              const fresh = addInput.items
                .map((item) => item.name)
                .filter((name) => !capturedNames.has(name.toLowerCase()));
              notifyInventory(fresh, "added to");
              break;
            }
            case "tool-removeInventoryItem": {
              const removeInput = input as z.infer<typeof RemoveInventoryItemSchemaObj>;
              notifyInventory(removeInput.itemNames, "removed from");
              break;
            }
          }
        }
      });

      // Commit pending conversation after stream completes. This changes
      // activeConversationId to the id chatId already implicitly represents
      // (the "staging" session that was live this whole time) — skip the
      // resulting chatId re-sync so useChat's store isn't reset right as the
      // just-streamed reply finishes.
      const pendingId = pendingConvIdRef.current;
      if (pendingId) {
        pendingConvIdRef.current = null;
        skipNextChatIdSyncRef.current = true;
        commitConversation(pendingId);
      }
    },
  });

  const { data, isLoading: messagesLoading } = useSWR<SavedMessage[]>(
    userId && activeConversationId
      ? messageKey(activeConversationId)
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
          conversationId: targetConvId,
          role,
          content,
        }),
      });
      if (!response.ok)
        throw new Error(
          `Save failed: ${response.status} (conversationId: ${targetConvId})`
        );
      mutate(messageKey(targetConvId));
    } catch (error) {
      console.error("Failed to save message:", error);
      throw error;
    }
  };

  useEffect(() => {
    // Keep submittedAt through "submitted" AND early "streaming": the loader
    // stays up until the first renderable content, and its dots→segmented-
    // progress phase is timed from this stamp. Clearing it on "streaming" (the
    // first token) would reset the clock and snap the loader back to dots. Only
    // clear once the generation is actually over.
    if (status === "ready" || status === "error") setSubmittedAt(null);
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
