import { addInventoryItem, getInventory } from "@/lib/inventory";
import {
  AddInventoryItemSchema,
  GetInventoryResponseSchema,
} from "@/lib/schemas";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const model = google("gemini-1.5-flash");

  const { message } = await req.json();

  const result = await streamText({
    model,
    system:
      "You are Ask Ah Mah, a warm and friendly cooking assistant. Be encouraging, use simple language, and always help beginners feel confident about cooking. Use the tools provided to help user manage their inventory and suggest recipes based on their inventory.",
    messages: [{ role: "user", content: message }],
    tools: {
      addInventoryItem: {
        description: `Add items to the user's inventory. Required: name (string) and type ("ingredient" or "kitchenware"). Optional: quantity (number) and unit (string).`,
        inputSchema: AddInventoryItemSchema,
        execute: async (input) => {
          console.log("Item added to inventory", input);
          addInventoryItem([input]);
          return {
            content: "Item added to inventory",
          };
        },
      },
      getInventory: {
        description: "Get the inventory/pantry",
        inputSchema: GetInventoryResponseSchema,
        execute: async () => {
          console.log("Getting inventory", getInventory());
          return {
            content: getInventory(),
          };
        },
      },
    },
  });
  return result.toTextStreamResponse();
}
