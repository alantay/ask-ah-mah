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
import { Input } from "@/components/ui/input";
import { useSessionContext } from "@/contexts/SessionContext";
import {
  AddInventoryItemSchemaObj,
  RemoveInventoryItemSchemaObj,
} from "@/lib/inventory/schemas";
import { SavedMessage } from "@/lib/messages/schemas";
import { RecipeWithId } from "@/lib/recipes/schemas";
import { upperCaseFirstLetter } from "@/lib/utils";
import { fetcher } from "@/lib/utils/index";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { z } from "zod";
import { INITIAL_MESSAGE, LOADING_MESSAGES } from "./constants";
import { convertToUIMessage, getRandomThinkingMessage } from "./utils";

const Chat = () => {
  const [input, setInput] = useState("");
  const { userId, isLoading } = useSessionContext();
  const { data: recipeSaved } = useSWR<RecipeWithId[]>(
    userId ? `/api/recipe?userId=${userId}` : null,
    fetcher,
    {
      shouldRetryOnError: true,
      revalidateOnMount: true,
    }
  );

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        userId,
      },
    }),
    onFinish: async (options) => {
      const { message } = options;
      let toolCalled = false;

      console.log("message", message);

      if (message.role === "assistant") {
        const content = message.parts
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("");
        if (content) {
          await saveMessage("assistant", content);
        }
      }
      // const metadata = message.metadata as MetadataWithToolCalls;
      // Example: Inspect metadata or parts for tool usage info
      // console.log("Full message meta", metadata);

      // If toolCalls array is present:
      // Leaving this here for now. Didn't seem to hit this condition.
      // if (metadata?.toolCalls?.length) {
      //   console.log("Tools used in this message:", metadata.toolCalls);
      // } else {
      //   console.log("No tools used in this message.");
      // }

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
              // we mutate for other tools
              break;
          }
          toolCalled = true;
        }
      });
      if (!toolCalled) console.log("No tool called");
    },
  });

  const { data, isLoading: messagesLoading } = useSWR<SavedMessage[]>(
    userId ? `/api/message?userId=${userId}` : null,
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
        body: JSON.stringify({ userId, role, content }),
      });
      mutate(`/api/message?userId=${userId}`);
    } catch (error) {
      console.error("Failed to save message:", error);
    }
  };

  const thinkingMessage = useMemo(() => {
    return getRandomThinkingMessage();
  }, [status === "streaming"]);

  // Show loading state while session is loading
  if (messagesLoading || !userId) {
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
  // Only show saved messages if there are no current UI messages (to avoid duplicates)
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

  const saveRecipe = async (recipeStr: string) => {
    const nameMatch = recipeStr.match(/^##\s+(.*)/m);
    const name = nameMatch
      ? nameMatch[1].trim().replace(/\*\*/g, "")
      : "Untitled Recipe";
    try {
      await fetch("/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, name, instructions: recipeStr }),
      });
      mutate(`/api/recipe?userId=${userId}`);
    } catch (error) {
      console.error("Failed to save recipe:", error);
    }
  };

  const allMessages = [INITIAL_MESSAGE, ...savedMessages, ...currentMessages];

  return (
    <div className="flex flex-col animate-in fade-in  duration-300 h-full">
      <Conversation>
        <ConversationContent>
          {
            <div className="space-y-4">
              {allMessages.map((message) => {
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
                            onClick={() => saveRecipe(recipe)}
                          >
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
                            Save Recipe
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

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (input.trim()) {
            await saveMessage("user", input); // Save user message
            sendMessage({ text: input });
            setInput("");
          }
        }}
        className="border-t p-4"
      >
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={status !== "ready"}
            placeholder="Ask Ah Mah a question..."
            className="flex-1"
          />
          <Button
            type="submit"
            aria-label="Send message"
            className="disabled:cursor-not-allowed"
            disabled={status !== "ready"}
          >
            <svg
              aria-hidden="true"
              focusable="false"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20.235 5.68609C20.667 4.49109 19.509 3.33309 18.314 3.76609L3.70904 9.04809C2.51004 9.48209 2.36504 11.1181 3.46804 11.7571L8.13004 14.4561L12.293 10.2931C12.4816 10.1109 12.7342 10.0101 12.9964 10.0124C13.2586 10.0147 13.5095 10.1199 13.6949 10.3053C13.8803 10.4907 13.9854 10.7415 13.9877 11.0037C13.99 11.2659 13.8892 11.5185 13.707 11.7071L9.54404 15.8701L12.244 20.5321C12.882 21.6351 14.518 21.4891 14.952 20.2911L20.235 5.68609Z"
                fill="currentColor"
              />
            </svg>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
