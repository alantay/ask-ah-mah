import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { EFFORT_MECHANICAL, MODEL } from "@/lib/ai/models";
import { buildRecipeInventoryNamesPrompt } from "./prompts";
import { AddInventoryItemSchema, type AddInventoryItem } from "./schemas";

/** Shorten confirmed recipe labels while preserving each item's metadata and identity in the batch. */
export async function normalizeRecipeItems(items: AddInventoryItem[]): Promise<AddInventoryItem[]> {
  if (!items.length) return [];
  // Required keys preserve the one-to-one mapping even if the model reorders them.
  const schema = z.object({
    names: z.object(Object.fromEntries(items.map((_, index) => [
      String(index), AddInventoryItemSchema.shape.name.trim().min(1),
    ]))),
  });
  const { object } = await generateObject({
    model: openai(MODEL),
    providerOptions: EFFORT_MECHANICAL,
    schema,
    prompt: buildRecipeInventoryNamesPrompt(items.map(item => item.name)),
  });
  const { names } = schema.parse(object);
  return items.map((item, index) => ({ ...item, name: names[String(index)] }));
}
