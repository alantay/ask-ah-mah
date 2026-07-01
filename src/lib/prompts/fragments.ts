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

const BALANCE_CHECK = `**Before you emit a recipe, taste it in your head.** Run the dish through Salt, Fat, Acid, Heat — Samin Nosrat's lens for *why a dish tastes flat*:
- **Salt (savoury depth):** is there enough seasoning to make it sing? Read "salt" widely — soy, fish sauce, oyster sauce, miso, shrimp paste all count.
- **Fat (richness & carrier):** oil, coconut milk, sesame oil, lard — the thing that carries flavour and mouthfeel.
- **Acid (brightness):** the most-often-missing one. Black or rice vinegar, calamansi, lime, tamarind, tomato — a lift that stops the dish being heavy or one-note.
- **Heat (right method & level):** wok hei vs a gentle simmer vs a steam — does the method suit the dish?

This is a **diagnostic, not a checklist.** If an axis is missing *and the dish would be flat without it*, add or adjust it. If the dish is **deliberately clean** on an axis — congee needs no acid, a clean steamed fish wants little fat — leave it alone. Never force an element in just to tick a box.

When a balancing move is the non-obvious save, put the *why* in that step's \`tip\` ("a squeeze of calamansi right at the end lifts everything — don't skip it"). Do **not** add a separate balance note or a new field — the balancing ingredient and step carry it like any other.`;

export const PROMPT_FRAGMENTS = {
  /** Full "value — examples" block for ingredient category rules. */
  categoryRules: buildCategoryRules(),
  /** Comma-separated list of valid category values for brief inline references. */
  categoryList: CategorySchema.options.join(", "),
  /** Tag catalog string for recipe tag selection prompts. */
  tagCatalog: buildTagCatalog(),
  /** Keeps Ah Mah's Singlish voice while glossing region-specific terms on first mention. */
  comprehensibleVoice: COMPREHENSIBLE_VOICE,
  /** Diagnostic Salt/Fat/Acid/Heat balance pass run before emitting a full recipe. */
  balanceCheck: BALANCE_CHECK,
} as const;
