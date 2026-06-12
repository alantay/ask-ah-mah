import { addInventoryItem } from "@/lib/inventory/Inventory";
import { AddInventoryItem, AddInventoryItemSchema } from "@/lib/inventory/schemas";
import { PROMPT_FRAGMENTS } from "@/lib/prompts/fragments";
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

  try {
    const { object } = await generateObject({
      model: openai("gpt-5-mini"),
      schema: ExtractionSchema,
      temperature: 0,
      prompt: `You extract ONLY ingredients/kitchenware the user explicitly HAS or JUST ACQUIRED, from a single chat message to a cooking assistant.

STRICT RULES — when in doubt, extract NOTHING:
- Extract an item ONLY if the user states they possess it or just got it: "I have X", "I've got X", "bought X", "picked up X", "there's X in my fridge".
- Wanting to USE UP, FINISH, or not waste an item means they HAVE it — extract it: "parsley I want to use up", "finish the tofu", "X in the fridge to use up", "leftover rice", "cilantro before it goes bad" → extract parsley/tofu/X/rice/cilantro.
- DO NOT extract negated items: "I don't have eggs", "no chicken", "out of soy sauce" → extract nothing for those.
- DO NOT extract items the user merely wants to ACQUIRE, plans to buy, or asks about: "I want to make laksa", "should I buy tofu?", "what can I cook with chicken?" (a bare "with X" is a request, not a possession claim — skip it). Note the difference: "I want tofu" (wish to acquire → skip) vs "I want to use up the tofu" (already has it → extract).
- DO NOT extract dish names, cuisines, or recipe titles. Only concrete ingredients and kitchenware.
- If the message is purely a question or contains no genuine possession claim, return an empty items array.

For each extracted item:
- name, type ("ingredient" | "kitchenware").
- OPTIONAL quantity + unit — ONLY when an explicit amount is stated ("200g chicken" → quantity=200, unit="g"; "2 eggs" → quantity=2, unit="pieces"). Otherwise leave BOTH unset.
- type rules: kitchenware = pots, pans, utensils, appliances. Everything edible = ingredient.
- category (REQUIRED for type=ingredient, OMIT for type=kitchenware):
${PROMPT_FRAGMENTS.categoryRules}
- Normalize names to singular, title case ("chicken breasts" → "Chicken breast").
- unit MUST come from this allowlist if used: g, kg, oz, lb, ml, l, cup, tbsp, tsp, piece, pieces, clove, cloves, bottle, bottles, can, cans, pack, packs, bunch, bunches, pinch, dash, slice, slices.

USER MESSAGE:
${text}`,
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
