import { PROMPT_FRAGMENTS } from "@/lib/prompts/fragments";

const INVENTORY_NAMING_RULES = `- Store a concise, singular pantry identity in name, not the whole ingredient line. Leave out amounts, preparation instructions, freshness/texture descriptions and shopping advice.
- Parenthetical examples or alternatives are NOT separate possessions: "Fresh firm fish (mackerel, snapper, barramundi)" → ONE item named "Fish". Do not pick or add the example species. If the user explicitly has mackerel, keep "Mackerel".
- Preserve the kind, species, cut and form that distinguish stock: "Minced beef" and "Minced pork" stay distinct; "Dried chilli" stays distinct from "Chilli"; "Chicken thigh" stays distinct from "Chicken breast". Strip preparation/condition only: "fresh chilli" → "Chilli"; "chicken thighs, boneless, skinless, cut into pieces" → "Chicken thigh".
- Use sentence case where natural ("chicken breasts" → "Chicken breast"). Do not shorten by truncating or merge synonyms. Never add a suggested substitute, negated item or planned purchase as possessed stock.`;

export function buildInventoryCapturePrompt(text: string): string {
  return `You extract ONLY ingredients/kitchenware the user explicitly HAS or JUST ACQUIRED, from a single chat message to a cooking assistant.

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
${INVENTORY_NAMING_RULES}
- unit MUST come from this allowlist if used: g, kg, oz, lb, ml, l, cup, tbsp, tsp, piece, pieces, clove, cloves, bottle, bottles, can, cans, pack, packs, bunch, bunches, pinch, dash, slice, slices.

USER MESSAGE:
${text}`;
}

export function buildInventoryParsePrompt(text: string): string {
  return `Parse the following freeform inventory entry into structured items. The user is dumping what they just bought or what they have on hand.

RULES:
- Bare item lists describe stock on hand. Exclude items the user negates, only asks about, or plans to buy; return no items if none are actually on hand.
- Each item gets: name, type ("ingredient" | "kitchenware"), and OPTIONAL quantity + unit.
- ONLY set quantity/unit when the user explicitly states an amount (e.g., "200g chicken" → quantity=200, unit="g"; "2 chicken breasts" → quantity=2, unit="pieces"). If they say "some bok choy" or just "eggs", LEAVE quantity AND unit UNSET — unset means "they have it, amount unlimited".
- type rules: kitchenware = pots, pans, utensils, appliances. Everything edible = ingredient.
- category rules (REQUIRED for type=ingredient, OMIT for type=kitchenware):
${PROMPT_FRAGMENTS.categoryRules}
${INVENTORY_NAMING_RULES}
- unit MUST come from this allowlist if used: g, kg, oz, lb, ml, l, cup, tbsp, tsp, piece, pieces, clove, cloves, bottle, bottles, can, cans, pack, packs, bunch, bunches, pinch, dash, slice, slices.

USER ENTRY:
${text}`;
}

export const ADD_INVENTORY_TOOL_DESCRIPTION = `Add items to the user's inventory. Only add what they actually have or just acquired. Required: name (string), type ("ingredient" or "kitchenware"). Optional: quantity (number) and unit (string) — only set quantity if the user explicitly states one.

${INVENTORY_NAMING_RULES}`;
