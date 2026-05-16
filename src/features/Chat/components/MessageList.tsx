"use client";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
} from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { Button } from "@/components/ui/button";
import {
  extractRecipeBlocks,
  getOpenRecipeFenceIdx,
  stripFences,
} from "@/lib/recipes/parseBlocks";
import type { RecipeBlock, RecipeWithId } from "@/lib/recipes/schemas";
import { fetcher } from "@/lib/utils/index";
import type { UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { generateTempId } from "../constants";
import { ChatLoader, SkeletonRecipeCard } from "./loaders";
import { RecipeLetter } from "./recipe/RecipeLetter";
import { SuggestionsBlock } from "./recipe/SuggestionsBlock";

interface MessageListProps {
  messages: UIMessage[];
  status: string;
  submittedAt: number | null;
  userId: string;
  onSend?: (text: string) => void;
  onRecipeDetected?: (title: string) => void;
}

// ── Parsed block types ────────────────────────────────────────────────────────

// ── SWR fetcher for save ──────────────────────────────────────────────────────

const saveRecipeCall = async (
  key: string,
  {
    arg,
  }: {
    arg: { recipeStr: string; name: string; userId: string; recipeId?: string };
  },
) => {
  const { recipeStr, name, userId, recipeId } = arg;
  const res = await fetch(key, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, name, instructions: recipeStr, recipeId }),
  });

  if (!res.ok) throw new Error("Failed to save recipe");
  return await res.json();
};

// ── Component ─────────────────────────────────────────────────────────────────

export const MessageList = ({
  messages,
  status,
  submittedAt,
  userId,
  onSend = () => {},
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
        userId,
        recipeId: recipeKey,
      });

      mutate(
        (current = []) =>
          current.map((r) => (r.id === optimisticRecipe.id ? saved : r)),
        { revalidate: false, populateCache: true },
      );

      toast.success(`Recipe ${name} saved!`);
    } catch (error) {
      console.error("Failed to save recipe:", error);
    }
  };

  const saveStructuredRecipe = async (
    recipeBlock: RecipeBlock,
    recipeKey: string,
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
      };

      mutate((current = []) => [...current, optimisticRecipe], {
        revalidate: false,
        populateCache: true,
      });

      const res = await fetch(`/api/recipe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          recipeId: recipeKey,
          recipe: recipeBlock,
        }),
      });
      if (!res.ok) throw new Error("Failed to save recipe");
      const saved = await res.json();

      mutate(
        (current = []) =>
          current.map((r) => (r.id === optimisticRecipe.id ? saved : r)),
        { revalidate: false, populateCache: true },
      );

      toast.success(`Recipe "${recipeBlock.title}" saved to cookbook!`);
    } catch (error) {
      console.error("Failed to save recipe:", error);
      toast.error("Could not save recipe. Try again.");
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
      <ConversationContent>
        <div
          ref={containerRef}
          className="space-y-4 overscroll-contain"
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
            const isStreamingLast =
              status === "streaming" &&
              isLastMsg &&
              message.role === "assistant";
            const openFenceIdx = isStreamingLast
              ? getOpenRecipeFenceIdx(textContent)
              : -1;
            const hasOpenFence = openFenceIdx !== -1;

            // For the open-fence case, parse the prefix so any completed blocks
            // (e.g. a closed ```suggestions```) still render as interactive components.
            const prefixText = hasOpenFence
              ? textContent.slice(0, openFenceIdx)
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
                        <SuggestionsBlock
                          key={blockKey}
                          data={block.payload}
                          allMessages={messages}
                          messageIndex={messageIndex}
                          onSend={onSend}
                        />
                      );
                    }
                    if (block.kind === "recipe") {
                      const recipeKey = `${message.id}-${bi}`;
                      const isSaved =
                        recipeSaved?.some((r) => r.recipeId === recipeKey) ??
                        false;
                      return (
                        <RecipeLetter
                          key={blockKey}
                          recipe={block.payload}
                          onSave={() =>
                            saveStructuredRecipe(block.payload, recipeKey)
                          }
                          isSaved={isSaved}
                          onSend={onSend}
                        />
                      );
                    }
                    return null;
                  })}

                  {/* Skeleton appended while recipe fence is still open */}
                  {hasOpenFence && <SkeletonRecipeCard />}

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
                                {saved ? "Saved" : "Save"}: {recipeName}
                              </Button>
                            );
                          })}
                      </div>
                    )}
                </MessageContent>
              </Message>
            );
          })}

          {/* Ghost loader bubble — visible only during submitted state */}
          {status === "submitted" && (
            <div className="py-4">
              <ChatLoader
                submittedAt={submittedAt}
              />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
};
