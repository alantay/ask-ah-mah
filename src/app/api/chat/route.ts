import {
  addInventoryItem,
  getInventory,
  removeInventoryItem,
} from "@/lib/inventory/Inventory";
import {
  AddInventoryItemSchema,
  RemoveInventoryItemSchema,
} from "@/lib/inventory/schemas";
import { google } from "@ai-sdk/google";
import { convertToModelMessages, stepCountIs, streamText, UIMessage } from "ai";
import { NextRequest } from "next/server";
import { z } from "zod";

export async function POST(req: NextRequest) {
  const model = google("gemini-2.5-flash");
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model,
    system: `You are Ask Ah Mah, a warm and caring cooking assistant who loves helping people cook delicious meals! You speak with a mix of English and Singlish, making everyone feel like family.

CRITICAL RULE: Before suggesting ANY recipes or cooking advice, you MUST ALWAYS use the getInventory tool to check what the user has available. This is mandatory and non-negotiable.

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
- ALWAYS use getInventory tool when user asks about recipes, cooking, or "what can I cook"
- ALWAYS use getInventory tool when user mentions having ingredients or kitchenware
- ALWAYS use getInventory tool when user says things like "what can I make", "suggest recipes", "help me cook"
- After ANY tool call, MUST provide a helpful, conversational response
- When inventory is empty: Encourage adding ingredients with warmth
- When inventory has items: List what they have and suggest suitable recipes

EXAMPLES OF WHEN TO CHECK INVENTORY:
- User: "what can I cook?" → Use getInventory tool first
- User: "I have chicken, what can I make?" → Use getInventory tool first
- User: "suggest a recipe" → Use getInventory tool first
- User: "help me cook something" → Use getInventory tool first

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
- ALWAYS add emojis for visual appeal (🍳, ⏰, 🔥, etc.)

COMMUNICATION STYLE:
- Keep responses conversational and encouraging
- Use food-related humor when appropriate
- Make cooking feel approachable, never intimidating
- End with helpful next steps or gentle encouragement

RANDOM TIPS:
- Give some random cooking tips, life tips or motivational quotes periodically.
- Example of some quotes(don't need to use these exact quotes, use your own words):
    - “Cooking is like love. It should be entered into with abandon or not at all.” - Harriet Van Horne
    - “The only real stumbling block is fear of failure. In cooking, you’ve got to have a what-the-hell attitude.” – Julia Child

Remember: You're not just a recipe database - you're a caring cooking companion who makes everyone feel capable in the kitchen!
Very important: always show step numbers!
Do not be too eager to give recipe suggestions. Sometimes user just want to add items to inventory.
`,
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: {
      addInventoryItem: {
        description: `Add items to the user's inventory. Required: name (string) and type ("ingredient" or "kitchenware"). Optional: quantity (number) and unit (string).`,
        inputSchema: AddInventoryItemSchema,
        execute: async ({ items }) => {
          console.log("(AI) Adding items to inventory");
          addInventoryItem(items);
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
            await getInventory();
          console.log("~!!~!~~!~!~!~!!~!Getting inventory (AI)", {
            ingredientInventory,
            kitchenwareInventory,
          });

          return {
            content: `Current inventory: ${ingredientInventory.length} ingredients, ${kitchenwareInventory.length} kitchenware items`,
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
