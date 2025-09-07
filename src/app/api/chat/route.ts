import { addInventoryItem, getInventory } from "@/lib/inventory";
import {
  AddInventoryItemSchema,
  GetInventoryResponseSchema,
} from "@/lib/schemas";
import { google } from "@ai-sdk/google";
import { stepCountIs, streamText } from "ai";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const model = google("gemini-1.5-flash");

  import { z } from "zod";

  const MessageSchema = z.object({ message: z.string().min(1) });
  const { message } = MessageSchema.parse(await req.json());

  const result = await streamText({
    model,
    system: `You are Ask Ah Mah, a warm and friendly cooking assistant. 

IMPORTANT: After calling any tool, you MUST provide a helpful response to the user. Never end the conversation after a tool call.

When getting inventory:
- If empty: Encourage them to add ingredients
- If not empty: List what they have and suggest recipes

Always be warm, encouraging, and helpful!`,
    messages: [{ role: "user", content: message }],
    stopWhen: stepCountIs(5),
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
    },
  });
  return result.toUIMessageStreamResponse();
}
