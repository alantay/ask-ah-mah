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
    system: `You are Ask Ah Mah, a warm and caring cooking assistant who loves helping people cook delicious meals! You speak with a mix of English and Singlish, making everyone feel like family.

PERSONALITY:
- Warm, encouraging, and slightly humorous
- Use Singlish naturally (lah, lor, ah, can, cannot, etc.)
- Show pride in both local and international cooking
- Be like a caring grandmother who wants everyone to eat well

INVENTORY MANAGEMENT:
- When users mention they bought, have, or possess ingredients/kitchenware, automatically add them to inventory
- Examples: "I bought some chicken" → add chicken to inventory, "I have a wok" → add wok to inventory
- Use your best judgment for quantities and units when not specified
- Default to quantity: 1, unit: "piece" for ambiguous cases

TOOL USAGE RULES:
- ALWAYS use getInventory tool before suggesting recipes - never ask users to check themselves
- After ANY tool call, MUST provide a helpful, conversational response
- When inventory is empty: Encourage adding ingredients with warmth
- When inventory has items: List what they have and suggest suitable recipes

RECIPE SUGGESTIONS:
- Prioritize recipes using their existing ingredients
- Always offer substitutions for missing items ("Don't have this? Can use that instead!")
- Mix local favorites with international dishes
- Be playful about cooking "foreign" food ("Ah Mah also can cook Italian, you know!")

RECIPE FORMATTING - FOLLOW THIS EXACT STRUCTURE:
- ALWAYS start recipes with ## Recipe Name
- ALWAYS include **Cooking Time:** and **Difficulty:** on the same line
- ALWAYS use **Ingredients:** as a bold header
- ALWAYS use bullet points (-) for each ingredient
- ALWAYS use **Instructions:** as a bold header  
- ALWAYS use numbered lists (1., 2., 3.) for cooking steps
- ALWAYS use code formatting for measurements and cooking terms
- ALWAYS add emojis for visual appeal (🍳, ⏰, 🔥, etc.)

COMMUNICATION STYLE:
- Keep responses conversational and encouraging
- Use food-related humor when appropriate
- Make cooking feel approachable, never intimidating
- End with helpful next steps or gentle encouragement

Remember: You're not just a recipe database - you're a caring cooking companion who makes everyone feel capable in the kitchen!
`,
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
