import {
  addInventoryItem,
  getInventory,
  removeInventoryItem,
} from "@/lib/inventory/Inventory";
import {
  AddInventoryItemSchemaObj,
  RemoveInventoryItemSchemaObj,
} from "@/lib/inventory/schemas";
import { getMessages } from "@/lib/messages/messages";
import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  UIMessage,
  validateUIMessages,
} from "ai";
import { NextRequest } from "next/server";
import { z } from "zod";
import { CHAT_SYSTEM_PROMPT } from "./constants";

export const CONTEXT_WINDOW = 15; // ai can only remember 15 messages for context

export async function POST(req: NextRequest) {
  try {
    const model = openai("gpt-4.1-mini");
    const { messages, userId }: { messages: UIMessage[]; userId: string } =
      await req.json();
    const previousMessages = await getMessages(userId);

    const uiMessages = previousMessages.slice(-CONTEXT_WINDOW).map((msg) => ({
      id: msg.id,
      role: msg.role as "user" | "assistant",
      parts: [
        {
          type: "text" as const,
          text: msg.content,
        },
      ],
    }));

    const validatedMessages = await validateUIMessages({
      messages: [...uiMessages.slice(0, -1), ...messages],
    });

    const result = streamText({
      model,
      messages: convertToModelMessages(validatedMessages),
      system: CHAT_SYSTEM_PROMPT,
      stopWhen: stepCountIs(5),
      tools: {
        addInventoryItem: {
          description: `Add items to the user's inventory. Required: name (string) and type ("ingredient" or "kitchenware"). Optional: quantity (number) and unit (string).`,
          inputSchema: AddInventoryItemSchemaObj,
          execute: async ({ items }) => {
            await addInventoryItem(items, userId);
            return {
              content: "Item added to inventory",
            };
          },
        },
        getInventory: {
          inputSchema: z.object({}),
          description:
            "Check what ingredients and kitchenware the user currently has in their inventory. Use this BEFORE suggesting recipes to see what they can cook with.",
          execute: async () => {
            const { ingredientInventory, kitchenwareInventory } =
              await getInventory(userId);

            return {
              content: `Current inventory: ${ingredientInventory.length} ingredients, ${kitchenwareInventory.length} kitchenware items`,
              inventory: { ingredientInventory, kitchenwareInventory },
            };
          },
        },
        removeInventoryItem: {
          description:
            "Remove items from inventory by their names (e.g., 'eggs', 'frying pan')",
          inputSchema: RemoveInventoryItemSchemaObj,
          execute: async ({ itemNames }) => {
            await removeInventoryItem(itemNames, userId);
            return {
              content: "Items removed from inventory",
            };
          },
        },
      },
    });
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);

    // Handle AI service errors gracefully
    if (error instanceof Error && error.message.includes("503")) {
      return new Response(
        JSON.stringify({
          error: "AI service temporarily unavailable",
          message:
            "Sorry lah, Ah Mah's cooking brain is taking a break! Try again in a few minutes.",
          retryable: true,
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Handle other errors
    return new Response(
      JSON.stringify({
        error: "Something went wrong",
        message: "Aiyah, something went wrong! Please try again later.",
        retryable: false,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
