import { PROMPT_FRAGMENTS } from "@/lib/prompts/fragments";
import { MODEL_LIGHT } from "@/lib/ai/models";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { AddShoppingListItemSchema, type AddShoppingListItem } from "./schemas";

const ParseSchema = z.object({
  items: z.array(AddShoppingListItemSchema).max(50),
});

/**
 * Extract Shopping List items from a freeform paste — typically a recipe's
 * ingredient list copied off the web, quantities, prep notes, and UI noise
 * (`img`, `Edit`) included. Mirrors `/api/inventory/parse`'s extraction
 * pattern, but every item comes back as a bare identity per ADR-0014 (a row
 * is `Cherry tomato`, never `7 cherry tomatoes`), and each item carries a
 * Pantry category so it can bridge straight to an Aisle via `toAisle` — no
 * follow-up `classifyAisles` call needed.
 */
export async function parseShoppingListText(
  text: string,
): Promise<AddShoppingListItem[]> {
  const { object } = await generateObject({
    model: openai(MODEL_LIGHT),
    schema: ParseSchema,
    // gpt-5 models only support the default temperature; setting it errors.
    prompt: `Parse the following freeform text into Shopping List items. The user pasted a recipe's ingredient list (often copied off a webpage) or typed a few things they need to buy.

RULES:
- Extract ONLY real grocery ingredients meant for buying. Skip anything that isn't one: webpage noise ("img", "Edit", "Save"), kitchenware/equipment (pots, pans, utensils, appliances), and standalone prep/description lines that aren't ingredients themselves (e.g. "halved", "warmed", "small, sliced" sitting on their own line under an ingredient).
- Each item gets ONLY a name and a category — NEVER a quantity or unit. The Shopping List holds identities, not amounts: "1 tsp chipotle paste" → "Chipotle paste", "50g kale" → "Kale", "7 cherry tomatoes" → "Cherry tomatoes".
- Keep names natural — plural is fine for things bought in multiples ("Cherry tomatoes"), singular for mass/single ingredients ("Kale", "Chipotle paste"). Title case.
- category is REQUIRED for every item:
${PROMPT_FRAGMENTS.categoryRules}

TEXT:
${text}`,
  });

  return object.items;
}
