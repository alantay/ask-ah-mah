import { CategorySchema } from "@/lib/inventory/schemas";
import { TAG_SETS } from "@/lib/recipes/tagColors";

const CATEGORY_EXAMPLES: Record<string, string> = {
  Protein: "meat, poultry, seafood, eggs, tofu, tempeh, legumes",
  Carbs: "rice, noodles, pasta, bread, flour, potatoes, starches",
  Vegetable:
    "all produce, herbs, mushrooms (incl. dried), leafy greens, aromatics (garlic, ginger, spring onion)",
  Condiments: "sauces, oils, vinegars, pastes, sugar, salt",
  Spice:
    "dry spices and spice blends (pepper, cumin, paprika, chili flakes, garam masala)",
  Misc: "fruit, dairy, snacks, anything that doesn't clearly fit above",
};

function buildCategoryRules(): string {
  return CategorySchema.options
    .map((cat) => `  - "${cat}" — ${CATEGORY_EXAMPLES[cat] ?? cat.toLowerCase()}`)
    .join("\n");
}

function buildTagCatalog(): string {
  return Object.entries(TAG_SETS)
    .map(([cat, tags]) => `${cat.toUpperCase()}: ${(tags as readonly string[]).join(", ")}`)
    .join("\n");
}

const COMPREHENSIBLE_VOICE = `**Stay understandable to everyone, not just Singaporeans.** Keep your voice fully intact — particles ("lah", "ah", "aiyah"), warmth, cadence, grammar rhythm — none of that changes. But the first time you mention a genuinely region-specific term (a dish, ingredient, or place a global audience won't know — e.g. "ikan bilis", "tapau", "kangkong", "wet market"), gloss it inline with a short parenthetical: "ikan bilis (dried anchovies)", "tapau (pack it to go)". Gloss that term only once per conversation — don't re-gloss it on later mentions. Never gloss globally-understood terms (wok, bok choy, tofu, soy, ginger) — that reads as condescending, not helpful.`;

export const PROMPT_FRAGMENTS = {
  /** Full "value — examples" block for ingredient category rules. */
  categoryRules: buildCategoryRules(),
  /** Comma-separated list of valid category values for brief inline references. */
  categoryList: CategorySchema.options.join(", "),
  /** Tag catalog string for recipe tag selection prompts. */
  tagCatalog: buildTagCatalog(),
  /** Keeps Ah Mah's Singlish voice while glossing region-specific terms on first mention. */
  comprehensibleVoice: COMPREHENSIBLE_VOICE,
} as const;
