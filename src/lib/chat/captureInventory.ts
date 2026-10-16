import { addInventoryItem } from "@/lib/inventory/Inventory";
import { extractRecipeBlocks } from "@/lib/recipes/parseBlocks";
import { AddInventoryItem, AddInventoryItemSchema } from "@/lib/inventory/schemas";
import { buildInventoryCapturePrompt } from "@/lib/inventory/prompts";
import { EFFORT_MECHANICAL, MODEL } from "@/lib/ai/models";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

/**
 * Cheap keyword gate: does this message plausibly mention the user HAVING or
 * acquiring something? Keeps us from spending an extraction LLM call on pure
 * questions ("what can I cook?", "how long do I boil eggs?").
 *
 * False negatives are non-fatal — the chat model's own `addInventoryItem` tool
 * is still the fallback for phrasings this gate misses.
 */
const POSSESSION_PATTERNS = [
  /\bi(?:'ve| have| got| ve)\b/i,
  /\bwe(?:'ve| have| got)\b/i,
  /\bgot (?:some|a|an|my|the)?\b/i,
  /\bbought\b/i,
  /\bpicked up\b/i,
  /\bgrabbed\b/i,
  /\bstocked up\b/i,
  /\bthere(?:'s| is| are)\b.*\b(?:fridge|freezer|pantry|kitchen|cupboard|counter)\b/i,
  /\bin (?:the |my )?(?:fridge|freezer|pantry|kitchen|cupboard|counter)\b/i,
  /\bhave (?:some|a|an)\b/i,
  // "use up", "finish", "before it goes bad", "leftover" all imply the user
  // already HAS the item they're talking about.
  /\buse (?:it |them |this |that )?up\b/i,
  /\bused up\b/i,
  /\bfinish (?:the|my|some|this|that|off)\b/i,
  /\bbefore (?:it|they|this|that)\b.*\b(?:goes?|go) (?:bad|off)\b/i,
  /\bgoing (?:bad|off)\b/i,
  /\bleftover\b/i,
];

export function mentionsPossession(text: string): boolean {
  return POSSESSION_PATTERNS.some((re) => re.test(text));
}

const ExtractionSchema = z.object({
  items: z.array(AddInventoryItemSchema),
});

/**
 * Deterministic, server-side capture of pantry items the user mentions in a
 * chat message. Runs BEFORE the chat model streams, so a subsequent
 * `getInventory` call sees the freshly added items.
 *
 * Only extracts things the user genuinely HAS or just acquired — never negated
 * ("I don't have eggs"), wished-for ("I want to make X"), or dish names from a
 * recipe request. Returns the items it added (empty when nothing qualifies).
 */
export async function captureMentionedInventory(
  text: string,
  userId: string,
): Promise<AddInventoryItem[]> {
  if (!text || !text.trim() || !mentionsPossession(text)) return [];
  // A checklist reply ("I've got the Thick rice noodles.") reads as a possession
  // claim, but the client has already written those ticks to the pantry using the
  // model's own labels and categories. Extracting again re-words them ("Thick
  // rice noodles" → "Rice noodle"), misses the upsert key, and lands a
  // near-duplicate row beside the one the tick just created.
  if (extractRecipeBlocks(text).some((block) => block.kind === "checklist-reply"))
    return [];

  try {
    const { object } = await generateObject({
      model: openai(MODEL),
      providerOptions: EFFORT_MECHANICAL,
      schema: ExtractionSchema,
      // gpt-5 models only support the default temperature; setting it errors.
      prompt: buildInventoryCapturePrompt(text),
    });

    const items = object.items ?? [];
    if (items.length > 0) {
      await addInventoryItem(items, userId);
    }
    return items;
  } catch (error) {
    // Non-fatal: the chat model's addInventoryItem tool remains the fallback.
    console.error("captureMentionedInventory failed", error);
    return [];
  }
}
