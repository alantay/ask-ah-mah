"use client";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { Button } from "@/components/ui/button";
import {
  extractRecipeBlocks,
  getOpenFence,
  parsePartialBlock,
  stripFences,
} from "@/lib/recipes/parseBlocks";
import type { OpenFenceKind } from "@/lib/recipes/parseBlocks";
import type {
  RecipeBlock,
  RecipeWithId,
  SuggestionsBlockData,
} from "@/lib/recipes/schemas";
import { recipeWithIdToBlock } from "@/lib/recipes/schemas";
import { fetcher } from "@/lib/utils";
import type { UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { generateTempId } from "../constants";
import { ChatLoader } from "./loaders";
import { RecipeLetter } from "./recipe/RecipeLetter";
import { SuggestionsBlock } from "./recipe/SuggestionsBlock";

interface MessageListProps {
  messages: UIMessage[];
  status: string;
  submittedAt: number | null;
  isSending?: boolean;
  userId: string;
  onSend?: (text: string) => void;
  // Drops text into the composer without sending — used by the recipe card's
  // substitutions nudge so the user can edit before sending.
  onDraft?: (text: string) => void;
  onRecipeDetected?: (title: string) => void;
}

// ── Parsed block types ────────────────────────────────────────────────────────

function messageText(message: UIMessage): string {
  return message.parts
    .filter(
      (p): p is { type: "text"; text: string } =>
        p.type === "text" && typeof (p as { text?: string }).text === "string",
    )
    .map((p) => p.text)
    .join("");
}

// Loader stays visible while submitted, and while streaming until the last
// assistant message has emitted something we can render: prose before any open
// block, a completed block, or — once a fence opens — the first parseable field
// of the streaming block (`hasStreamingPartial`). This bridges the sliver
// between fence-open and first field so we never flash a raw-JSON-free dead gap.
function shouldShowLoader(
  status: string,
  messages: UIMessage[],
  hasStreamingPartial: boolean,
): boolean {
  if (status === "submitted") return true;
  if (status !== "streaming") return false;
  const last = messages[messages.length - 1];
  if (!last || last.role !== "assistant") return true;
  const text = messageText(last);
  const openFence = getOpenFence(text);
  const prefix = openFence ? text.slice(0, openFence.index) : text;
  if (stripFences(prefix).trim().length > 0) return false;
  if (extractRecipeBlocks(prefix).length > 0) return false;
  if (openFence && hasStreamingPartial) return false;
  return true;
}

// ── SWR fetcher for save ──────────────────────────────────────────────────────

const saveRecipeCall = async (
  key: string,
  {
    arg,
  }: {
    arg: { recipeStr: string; name: string; recipeId?: string };
  },
) => {
  const { recipeStr, name, recipeId } = arg;
  const res = await fetch(key, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, instructions: recipeStr, recipeId }),
  });

  if (!res.ok) throw new Error("Failed to save recipe");
  return await res.json();
};

// ── Component ─────────────────────────────────────────────────────────────────

export const MessageList = ({
  messages,
  status,
  submittedAt,
  isSending = false,
  userId,
  onSend = () => {},
  onDraft = () => {},
  onRecipeDetected,
}: MessageListProps) => {
  const { data: recipeSaved, mutate } = useSWR<RecipeWithId[]>(
    `/api/recipe?userId=${userId}`,
    fetcher,
  );

  const { trigger } = useSWRMutation(
    `/api/recipe?userId=${userId}`,
    saveRecipeCall,
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Progressive reveal (ADR-0009): the single trailing open fence of the last
  // streaming assistant message is partial-parsed here, centrally, so the loader
  // and the streaming block share one source of truth and never flicker apart.
  const [streamingPartial, setStreamingPartial] = useState<{
    messageId: string;
    kind: OpenFenceKind;
    data: Record<string, unknown>;
  } | null>(null);

  const lastMessage = messages[messages.length - 1];
  const isStreamingLast =
    status === "streaming" && lastMessage?.role === "assistant";
  const lastText = isStreamingLast ? messageText(lastMessage) : "";

  useEffect(() => {
    if (!isStreamingLast) {
      setStreamingPartial(null);
      return;
    }
    const fence = getOpenFence(lastText);
    if (!fence) {
      setStreamingPartial(null);
      return;
    }
    let cancelled = false;
    parsePartialBlock(fence.json)
      .then((data) => {
        // null → unparseable frame; hold the last good partial (don't reset),
        // tokens arrive near-continuously so the gap is invisible.
        if (cancelled || data === null) return;
        setStreamingPartial({
          messageId: lastMessage.id,
          kind: fence.kind,
          data,
        });
      })
      .catch(() => {
        // Defensive: parsePartialBlock already swallows parse errors, but guard
        // the chain so a future change can't leak an unhandled rejection.
      });
    return () => {
      cancelled = true;
    };
  }, [isStreamingLast, lastText, lastMessage?.id]);

  // Only trust the partial for the message that is actually streaming now.
  const activePartial =
    streamingPartial && streamingPartial.messageId === lastMessage?.id
      ? streamingPartial
      : null;

  useEffect(() => {
    if (!onRecipeDetected) return;
    for (const msg of messages) {
      if (msg.role !== "assistant") continue;
      const text = msg.parts
        .filter((p) => p.type === "text")
        .map((p) => p.text)
        .join("");
      const blocks = extractRecipeBlocks(text);
      const recipe = blocks.find((b) => b.kind === "recipe");
      if (recipe && recipe.kind === "recipe") {
        onRecipeDetected(recipe.payload.title);
        return;
      }
    }
  }, [messages, onRecipeDetected]);

  const extractRecipeName = (recipeStr: string): string => {
    const nameMatch = recipeStr.match(/^##\s+(.*)/m);
    return nameMatch
      ? nameMatch[1].trim().replace(/\*\*/g, "")
      : "Untitled Recipe";
  };

  const saveRecipe = async (recipeStr: string, recipeKey: string) => {
    const name = extractRecipeName(recipeStr);

    try {
      const optimisticRecipe = {
        id: generateTempId(),
        userId,
        name,
        instructions: recipeStr,
        recipeId: recipeKey,
        baseServings: 2,
        ingredients: [],
      };

      mutate((current = []) => [...current, optimisticRecipe], {
        revalidate: false,
        populateCache: true,
      });

      const saved = await trigger({
        recipeStr,
        name,
        recipeId: recipeKey,
      });

      mutate(
        (current = []) =>
          current.map((r) => (r.id === optimisticRecipe.id ? saved : r)),
        { revalidate: false, populateCache: true },
      );

      toast.success(`Saved — Ah Mah will remember this one.`);
    } catch (error) {
      console.error("Failed to save recipe:", error);
    }
  };

  const saveStructuredRecipe = async (
    recipeBlock: RecipeBlock,
    recipeKey: string,
    cooked = false,
  ) => {
    try {
      const optimisticRecipe = {
        id: generateTempId(),
        userId,
        name: recipeBlock.title,
        instructions: recipeBlock.description ?? "",
        recipeId: recipeKey,
        baseServings: recipeBlock.baseServings,
        ingredients: [],
        steps: recipeBlock.steps,
        cooked,
      };

      mutate((current = []) => [...current, optimisticRecipe], {
        revalidate: false,
        populateCache: true,
      });

      const res = await fetch(`/api/recipe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeId: recipeKey,
          recipe: { ...recipeBlock, cooked },
        }),
      });
      if (!res.ok) throw new Error("Failed to save recipe");
      const saved = await res.json();

      mutate(
        (current = []) =>
          current.map((r) => (r.id === optimisticRecipe.id ? saved : r)),
        { revalidate: false, populateCache: true },
      );

      toast.success(`"${recipeBlock.title}" — kept in your cookbook.`);
    } catch (error) {
      console.error("Failed to save recipe:", error);
      toast.error("Aiyah, didn't save. Try again?");
    }
  };

  const handleCookedChange = async (
    recipeBlock: RecipeBlock,
    recipeKey: string,
    next: boolean,
  ) => {
    const existing = recipeSaved?.find((r) => r.recipeId === recipeKey);
    if (!existing) {
      // Not in the cookbook yet — ticking saves it as cooked; there's nothing
      // to persist for an un-tick.
      if (next) await saveStructuredRecipe(recipeBlock, recipeKey, true);
      return;
    }
    try {
      const res = await fetch(`/api/recipe/${existing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe: { ...recipeWithIdToBlock(existing), cooked: next },
        }),
      });
      if (!res.ok) throw new Error("Failed to update cooked marker");

      mutate(
        (current = []) =>
          current.map((r) => (r.id === existing.id ? { ...r, cooked: next } : r)),
        { revalidate: false, populateCache: true },
      );

      if (next) toast.success("Marked as made — nice one.");
    } catch (error) {
      console.error("Failed to update cooked marker:", error);
      toast.error("Couldn't save that. Try again?");
    }
  };

  const handleScroll = () => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    shouldAutoScroll.current = isNearBottom;
  };

  useEffect(() => {
    if (messages.length === 0) return;

    // Only auto-scroll on initial load or when user is near bottom
    if (isInitialLoad) {
      // Instant scroll on initial load to avoid jarring effect
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      setIsInitialLoad(false);
    } else if (shouldAutoScroll.current && status === "streaming") {
      // Smooth scroll during streaming when user hasn't scrolled up
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, status, isInitialLoad]);

  return (
    <Conversation>
      <ConversationContent className="px-2 sm:p-4">
        <div
          ref={containerRef}
          className="space-y-4 overscroll-contain max-w-5xl mx-auto w-full"
          onScroll={handleScroll}
          data-conversation-content
        >
          {messages.map((message, messageIndex) => {
            const textContent = message.parts
              .filter(
                (p): p is { type: "text"; text: string } =>
                  p.type === "text" &&
                  typeof (p as { text?: string }).text === "string",
              )
              .map((p) => (p as { type: "text"; text: string }).text)
              .join("");

            const isLastMsg = message === messages[messages.length - 1];
            const isStreamingThis =
              status === "streaming" &&
              isLastMsg &&
              message.role === "assistant";
            const openFence = isStreamingThis
              ? getOpenFence(textContent)
              : null;
            const hasOpenFence = openFence !== null;

            // For the open-fence case, parse the prefix so any completed blocks
            // (e.g. a closed ```suggestions``` or the Mode 3 "close" recipe) still
            // render as interactive components.
            const prefixText = hasOpenFence
              ? textContent.slice(0, openFence.index)
              : textContent;
            const blocks = extractRecipeBlocks(prefixText);
            const hasNewBlocks = blocks.some((b) => b.kind !== "legacy");
            const proseText = hasNewBlocks
              ? stripFences(prefixText)
              : prefixText;

            return (
              <Message
                key={message.id}
                from={message.role}
                className={`flex-col md:flex-row ${
                  message.role === "user"
                    ? "items-end"
                    : "items-start md:flex-row-reverse"
                }`}
              >
                <MessageContent variant="flat">
                  {/* Prose — strip completed fences when new-style blocks present;
                      when an open fence is detected, prefixText is already trimmed */}
                  {hasNewBlocks ? (
                    proseText ? (
                      <Response key={`${message.id}-prose`}>
                        {proseText}
                      </Response>
                    ) : null
                  ) : hasOpenFence ? (
                    proseText ? (
                      <Response key={`${message.id}-prose`}>
                        {proseText}
                      </Response>
                    ) : null
                  ) : (
                    message.parts.map((part, index) => {
                      if (part.type === "text") {
                        const stripped = stripFences(
                          (part as { type: "text"; text: string }).text,
                        ).trim();
                        if (!stripped) return null;
                        return (
                          <Response key={`${message.id}-${index}`}>
                            {stripped}
                          </Response>
                        );
                      }
                      return null;
                    })
                  )}

                  {/* Parsed blocks (prefix text when fence open, full text otherwise) */}
                  {blocks.map((block, bi) => {
                    const blockKey = `${message.id}-block-${bi}`;
                    if (block.kind === "suggestions") {
                      return (
                        <div key={blockKey}>
                          <hr className="border-t border-border my-3" />
                          <SuggestionsBlock
                            data={block.payload}
                            allMessages={messages}
                            messageIndex={messageIndex}
                            onSend={onSend}
                          />
                        </div>
                      );
                    }
                    if (block.kind === "recipe") {
                      const recipeKey = `${message.id}-${bi}`;
                      const savedRecipe = recipeSaved?.find(
                        (r) => r.recipeId === recipeKey,
                      );
                      const isSaved = !!savedRecipe;
                      return (
                        <RecipeLetter
                          key={blockKey}
                          recipe={block.payload}
                          onSave={() =>
                            saveStructuredRecipe(block.payload, recipeKey)
                          }
                          isSaved={isSaved}
                          onDraft={onDraft}
                          cooked={savedRecipe?.cooked ?? false}
                          onCookedChange={(next) =>
                            handleCookedChange(block.payload, recipeKey, next)
                          }
                        />
                      );
                    }
                    return null;
                  })}

                  {/* Streaming block — the trailing open fence rendered through
                      the same presentational component as the final view, fed by
                      the centrally partial-parsed buffer (ADR-0009). The loader
                      bridges until the first field parses. */}
                  {hasOpenFence &&
                    activePartial &&
                    (activePartial.kind === "recipe" ? (
                      <RecipeLetter
                        key={`${message.id}-streaming`}
                        recipe={activePartial.data as Partial<RecipeBlock>}
                        isStreaming
                      />
                    ) : (
                      <div key={`${message.id}-streaming`}>
                        <hr className="border-t border-border my-3" />
                        <SuggestionsBlock
                          data={
                            activePartial.data as Partial<SuggestionsBlockData>
                          }
                          allMessages={messages}
                          messageIndex={messageIndex}
                          onSend={onSend}
                          isStreaming
                        />
                      </div>
                    ))}

                  {/* "More ideas" button — shown on completed Cook-With responses */}
                  {!hasOpenFence &&
                    status === "ready" &&
                    isLastMsg &&
                    blocks.some(
                      (b) => b.kind === "recipe" && b.payload.closeness,
                    ) && (
                      <div className="mt-3">
                        <button
                          onClick={() =>
                            onSend?.("More ideas — different from these")
                          }
                          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-muted-foreground border border-border rounded-full hover:border-border-soft hover:text-foreground transition-colors cursor-pointer"
                        >
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                            <path d="M2 8a6 6 0 1 0 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <path d="M5 5L2 8l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          More ideas like these
                        </button>
                      </div>
                    )}

                  {/* Legacy recipe save buttons */}
                  {!hasOpenFence &&
                    blocks.some((b) => b.kind === "legacy") &&
                    status === "ready" && (
                      <div className="flex flex-wrap gap-2">
                        {blocks
                          .filter((b) => b.kind === "legacy")
                          .map((block, idx) => {
                            if (block.kind !== "legacy") return null;
                            const recipeKey = `${message.id}-${idx}`;
                            const recipeName = extractRecipeName(
                              block.recipeStr,
                            );
                            const saved =
                              recipeSaved?.some(
                                (r) => r.recipeId === recipeKey,
                              ) ?? false;
                            return (
                              <Button
                                key={recipeKey}
                                className="cursor-pointer my-2"
                                onClick={() =>
                                  saved ||
                                  saveRecipe(block.recipeStr, recipeKey)
                                }
                              >
                                {saved ? (
                                  <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                  >
                                    <path
                                      d="M5 21V5C5 4.45 5.196 3.97933 5.588 3.588C5.98 3.19667 6.45067 3.00067 7 3H17C17.55 3 18.021 3.196 18.413 3.588C18.805 3.98 19.0007 4.45067 19 5V21L12 18L5 21Z"
                                      fill="currentColor"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                  >
                                    <path
                                      d="M17 18L12 15.82L7 18V5H17M17 3H7C6.46957 3 5.96086 3.21071 5.58579 3.58579C5.21071 3.96086 5 4.46957 5 5V21L12 18L19 21V5C19 4.46957 18.7893 3.96086 18.4142 3.58579C18.0391 3.21071 17.5304 3 17 3Z"
                                      fill="currentColor"
                                    />
                                  </svg>
                                )}
                                {saved ? "Kept" : "Keep this"} — {recipeName}
                              </Button>
                            );
                          })}
                      </div>
                    )}
                </MessageContent>
              </Message>
            );
          })}

          {/* Ghost loader bubble — visible during the pre-send gap (isSending),
              while submitted, and while streaming until the assistant has
              emitted visible content. */}
          {(isSending ||
            shouldShowLoader(status, messages, activePartial !== null)) && (
            <div className="py-4">
              <ChatLoader submittedAt={submittedAt} />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
};
