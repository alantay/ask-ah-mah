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
import { RecipeWithId } from "@/lib/recipes/schemas";
import { fetcher } from "@/lib/utils/index";
import { UIMessage } from "ai";
import { toast } from "sonner";
import useSWR from "swr";

interface MessageListProps {
  messages: UIMessage[];
  status: string;
  thinkingMessage: string;
  userId: string;
}

const saveRecipeCall = async (
  recipeStr: string,
  name: string,
  userId: string,
  recipeSaved: RecipeWithId[]
) => {
  const res = await fetch("/api/recipe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, name, instructions: recipeStr }),
  });

  if (!res.ok) throw new Error("Failed to save recipe");
  const newRecipe = await res.json();
  return [...(recipeSaved ?? []), newRecipe];
};

export const MessageList = ({
  messages,
  status,
  userId,
  thinkingMessage,
}: MessageListProps) => {
  const { data: recipeSaved, mutate } = useSWR<RecipeWithId[]>(
    `/api/recipe?userId=${userId}`,
    fetcher
  );

  const extractRecipeName = (recipeStr: string): string => {
    const nameMatch = recipeStr.match(/^##\s+(.*)/m);
    return nameMatch
      ? nameMatch[1].trim().replace(/\*\*/g, "")
      : "Untitled Recipe";
  };

  const saveRecipe = async (recipeStr: string) => {
    const name = extractRecipeName(recipeStr);
    try {
      // await mutate(addTodo(newTodo), {
      //   optimisticData: [...data, newTodo],
      //   rollbackOnError: true,
      //   populateCache: true,
      //   revalidate: false
      // });
      const optimisticRecipe = {
        id: `temp-${Date.now()}`,
        userId,
        name,
        instructions: recipeStr,
      };

      await mutate(saveRecipeCall(recipeStr, name, userId, recipeSaved ?? []), {
        optimisticData: [...(recipeSaved ?? []), optimisticRecipe],
        rollbackOnError: true,
        populateCache: true,
        revalidate: false,
      });

      // await fetch("/api/recipe", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ userId, name, instructions: recipeStr }),
      // });
      // mutate();
      toast.success(`Recipe ${name} saved!`);
    } catch (error) {
      console.error("Failed to save recipe:", error);
    }
  };

  return (
    <Conversation>
      <ConversationContent>
        {
          <div className="space-y-4">
            {messages.map((message) => {
              let recipe: string = "";
              const hasRecipe = message.parts.filter(
                (part) => part.type === "text" && part.text.includes("-----")
              )[0] as { type: "text"; text: string };
              if (hasRecipe) {
                recipe = hasRecipe.text.split("-----")[1];
              }
              const isRecipeSaved =
                recipeSaved?.some((r) => r.instructions === recipe) ?? false;
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
                  <MessageContent>
                    {message.parts.map((part, index) =>
                      part.type === "text" ? (
                        <Response key={`${message.id}-${index}`}>
                          {part.text}
                        </Response>
                      ) : null
                    )}
                    {!!hasRecipe && status === "ready" && (
                      <div>
                        <Button
                          className="cursor-pointer my-2"
                          onClick={() => !!isRecipeSaved || saveRecipe(recipe)}
                        >
                          {isRecipeSaved ? (
                            <svg
                              width="24"
                              height="24"
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
                              width="24"
                              height="24"
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
                          {isRecipeSaved ? "Saved Recipe" : "Save Recipe"}
                        </Button>
                      </div>
                    )}
                    {status === "streaming" &&
                      message === messages[messages.length - 1] &&
                      message.role === "assistant" && ( // don't show thinking message for user messages
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
          </div>
        }
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
};
