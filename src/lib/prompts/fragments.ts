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

export const PROMPT_FRAGMENTS = {
  /** Full "value — examples" block for ingredient category rules. */
  categoryRules: buildCategoryRules(),
  /** Comma-separated list of valid category values for brief inline references. */
  categoryList: CategorySchema.options.join(", "),
  /** Tag catalog string for recipe tag selection prompts. */
  tagCatalog: buildTagCatalog(),
} as const;
