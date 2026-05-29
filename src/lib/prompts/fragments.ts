import { CategorySchema, ShelfLifeSchema } from "@/lib/inventory/schemas";
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

const SHELF_LIFE_EXAMPLES: Record<string, string> = {
  short:
    "leafy greens, herbs, seafood, dairy, cooked leftovers, fresh fish, mushrooms",
  medium: "most meat, most fresh produce, eggs, tofu, bread",
  long: "oils, dry goods (rice, pasta, flour), spices, sauces, canned/bottled goods, ALL kitchenware",
  frozen:
    "anything explicitly stored in the freezer (frozen vegetables, frozen meat, frozen dumplings, ice cream, sukiyaki/shabu slices sold frozen)",
};

function buildCategoryRules(): string {
  return CategorySchema.options
    .map((cat) => `  - "${cat}" — ${CATEGORY_EXAMPLES[cat] ?? cat.toLowerCase()}`)
    .join("\n");
}

function buildShelfLifeRules(): string {
  return ShelfLifeSchema.options
    .map((v) => `  - "${v}" — ${SHELF_LIFE_EXAMPLES[v] ?? v}`)
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
  /** Full "value — examples" block for shelfLife rules. */
  shelfLifeRules: buildShelfLifeRules(),
  /** Tag catalog string for recipe tag selection prompts. */
  tagCatalog: buildTagCatalog(),
} as const;
