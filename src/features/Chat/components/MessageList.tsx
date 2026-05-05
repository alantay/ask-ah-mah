"use client";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { Button } from "@/components/ui/button";
import type {
  GateData,
  RecipeBlock,
  RecipeWithId,
  SuggestionsBlockData,
} from "@/lib/recipes/schemas";
import {
  GateSchema,
  RecipeBlockSchema,
  SuggestionsBlockSchema,
} from "@/lib/recipes/schemas";
import { fetcher } from "@/lib/utils/index";
import type { UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { generateTempId } from "../constants";
import { IngredientGate } from "./recipe/IngredientGate";
import { RecipeLetter } from "./recipe/RecipeLetter";
import { SuggestionsBlock } from "./recipe/SuggestionsBlock";

interface MessageListProps {
  messages: UIMessage[];
  status: string;
  thinkingMessage: string;
  userId: string;
  onSend?: (text: string) => void;
}

// ── Parsed block types ────────────────────────────────────────────────────────

type ParsedBlock =
  | { kind: "suggestions"; payload: SuggestionsBlockData; index: number }
  | { kind: "gate"; payload: GateData; index: number }
  | { kind: "recipe"; payload: RecipeBlock; index: number }
  | { kind: "legacy"; recipeStr: string; index: number };

function extractRecipeBlocks(text: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];

  // Match complete fenced JSON blocks: ```suggestions\n{...}\n```
  const fenceRegex = /^```(suggestions|gate|recipe)\n([\s\S]*?)\n```/gm;
  let match: RegExpExecArray | null;

  while ((match = fenceRegex.exec(text)) !== null) {
    const kind = match[1] as "suggestions" | "gate" | "recipe";
    try {
      const payload = JSON.parse(match[2]);
      if (kind === "suggestions") {
        const result = SuggestionsBlockSchema.safeParse(payload);
        if (result.success)
          blocks.push({ kind: "suggestions", payload: result.data, index: match.index });
      } else if (kind === "gate") {
        const result = GateSchema.safeParse(payload);
        if (result.success)
          blocks.push({ kind: "gate", payload: result.data, index: match.index });
      } else if (kind === "recipe") {
        const result = RecipeBlockSchema.safeParse(payload);
        if (result.success)
          blocks.push({ kind: "recipe", payload: result.data, index: match.index });
      }
    } catch {
      /* invalid JSON — skip */
    }
  }

  // Legacy: -----...------ markdown recipes
  const legacyParts = text
    .split(/^-{5,}$/m)
    .map((p) => p.trim())
    .filter((p) => /^##\s+/m.test(p));

  // Only add legacy blocks if no new-style blocks were found (avoid double-rendering)
  if (blocks.length === 0 && legacyParts.length > 0) {
    legacyParts.forEach((recipeStr, i) => {
      blocks.push({ kind: "legacy", recipeStr, index: i });
    });
  }

  return blocks;
}

function stripFences(text: string): string {
  return text
    .replace(/^```(?:suggestions|gate|recipe)\n[\s\S]*?\n```/gm, "")
    .trim();
}

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
  userId,
  thinkingMessage,
  onSend = () => {},
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
                  p.type === "text" && typeof (p as { text?: string }).text === "string",
              )
              .map((p) => (p as { type: "text"; text: string }).text)
              .join("");

            const blocks = extractRecipeBlocks(textContent);
            const hasNewBlocks = blocks.some((b) => b.kind !== "legacy");
            const proseText = hasNewBlocks ? stripFences(textContent) : textContent;

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
                  {/* Prose text (fences stripped when new-style blocks present) */}
                  {hasNewBlocks
                    ? proseText
                      ? (
                        <Response key={`${message.id}-prose`}>
                          {proseText}
                        </Response>
                      )
                      : null
                    : message.parts.map((part, index) =>
                        part.type === "text" ? (
                          <Response key={`${message.id}-${index}`}>
                            {(part as { type: "text"; text: string }).text}
                          </Response>
                        ) : null,
                      )}

                  {/* New-style blocks */}
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
                    if (block.kind === "gate") {
                      return (
                        <IngredientGate
                          key={blockKey}
                          data={block.payload}
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
                        />
                      );
                    }
                    return null;
                  })}

                  {/* Legacy recipe save buttons */}
                  {blocks.some((b) => b.kind === "legacy") &&
                    status === "ready" && (
                      <div className="flex flex-wrap gap-2">
                        {blocks
                          .filter((b) => b.kind === "legacy")
                          .map((block, idx) => {
                            if (block.kind !== "legacy") return null;
                            const recipeKey = `${message.id}-${idx}`;
                            const recipeName = extractRecipeName(block.recipeStr);
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
                                    xmlns="http://www.w3.org/2000/svg"
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
                                    xmlns="http://www.w3.org/2000/svg"
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

                  {/* Thinking spinner */}
                  {status === "streaming" &&
                    message === messages[messages.length - 1] &&
                    message.role === "assistant" && (
                      <span className="animate-pulse text-muted-foreground">
                        {thinkingMessage}
                      </span>
                    )}
                </MessageContent>
                <MessageAvatar
                  src={
                    message.role === "user"
                      ? "/user-avatar.png"
                      : "/granny-avatar.png"
                  }
                  name={message.role === "user" ? "🙋‍♀️" : "👵"}
                />
              </Message>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
};
