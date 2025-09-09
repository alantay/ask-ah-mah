import {
  addInventoryItem,
  getInventory,
  removeInventoryItem,
} from "@/lib/inventory/Inventory";
import {
  AddInventoryItemSchema,
  GetInventoryResponseSchema,
  RemoveInventoryItemSchema,
} from "@/lib/schemas";
import { google } from "@ai-sdk/google";
import { convertToModelMessages, stepCountIs, streamText, UIMessage } from "ai";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const model = google("gemini-1.5-flash");
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model,
    system: `You are Ask Ah Mah, a warm and friendly cooking assistant. 

IMPORTANT: After calling any tool, you MUST provide a helpful response to the user. Never end the conversation after a tool call.

When getting inventory:
- If empty: Encourage them to add ingredients
- If not empty: List what they have and suggest recipes

Always be warm, encouraging, and helpful!`,
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: {
      addInventoryItem: {
        description: `Add items to the user's inventory. Required: name (string) and type ("ingredient" or "kitchenware"). Optional: quantity (number) and unit (string).`,
        inputSchema: AddInventoryItemSchema,
        execute: async ({ items }) => {
          console.log("Item added to inventory", items);
          addInventoryItem(items);
          return {
            content: "Item added to inventory",
          };
        },
      },
      getInventory: {
        description:
          "Get the user's current inventory and ALWAYS provide a friendly response summarizing what they have, even if empty.",
        inputSchema: GetInventoryResponseSchema,
        execute: async () => {
          const { ingredientInventory, kitchenwareInventory } = getInventory();
          console.log("Getting inventory");

          return {
            content: getInventory(),
            inventory: { ingredientInventory, kitchenwareInventory },
          };
        },
      },
      removeInventoryItem: {
        description:
          "Remove items from inventory by their names (e.g., 'eggs', 'frying pan')",
        inputSchema: RemoveInventoryItemSchema,
        execute: async ({ itemNames }) => {
          console.log("Items removed from inventory", itemNames);
          removeInventoryItem(itemNames);
          return {
            content: "Items removed from inventory",
          };
        },
      },
    },
  });
  return result.toUIMessageStreamResponse();
}
