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
import { google } from "@ai-sdk/google";
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
  const model = google("gemini-2.5-flash");
  const { messages, userId }: { messages: UIMessage[]; userId: string } =
    await req.json();
  const previousMessages = await getMessages(userId);

  // Convert database messages to model format

  console.log("previousMessages", previousMessages);

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
}
