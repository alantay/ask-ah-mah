// Single source of truth for recipe-tag categorization.
// Used by tagClasses (UI color coding) and recipeProcessor (LLM tag prompt).

export type TagCategory =
  | "cuisine"
  | "main"
  | "method"
  | "meal"
  | "effort"
  | "style"
  | "other";

export const TAG_SETS: Record<Exclude<TagCategory, "other">, readonly string[]> = {
  cuisine: [
    "italian", "chinese", "japanese", "mexican", "indian", "thai", "french",
    "mediterranean", "american", "korean", "vietnamese", "middle-eastern",
    "greek", "spanish", "moroccan", "malaysian", "singaporean", "filipino",
    "asian", "western", "african", "latin-american",
  ],
  main: [
    "chicken", "beef", "pork", "fish", "seafood", "eggs", "tofu", "beans",
    "lentils", "rice", "noodle", "pasta", "bread", "dumpling", "pancake",
  ],
  method: [
    "baked", "fried", "grilled", "steamed", "boiled", "roasted", "sauteed",
    "stir-fried", "braised", "slow-cooked", "pressure-cooked", "air-fried",
    "no-cook", "raw", "marinated", "fermented", "pickled", "stew", "blended",
  ],
  meal: [
    "breakfast", "lunch", "dinner", "snack", "appetizer", "dessert",
    "side-dish", "main-course", "soup", "salad", "beverage", "condiment",
  ],
  effort: [
    "easy", "quick (under 30 min)", "one-pot", "make-ahead", "oven-free",
  ],
  style: [
    "crispy", "creamy", "spicy", "sweet", "savory", "tangy", "hearty",
    "light", "refreshing", "warming", "comfort", "numbing",
  ],
};

const LOOKUP: Map<string, TagCategory> = (() => {
  const m = new Map<string, TagCategory>();
  for (const [cat, tags] of Object.entries(TAG_SETS)) {
    for (const tag of tags) m.set(tag, cat as TagCategory);
  }
  return m;
})();

export function getTagCategory(tag: string): TagCategory {
  return LOOKUP.get(tag.toLowerCase()) ?? "other";
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function tagClasses(_tag: string): string {
  return "bg-muted/60 text-muted-foreground border-border";
}

export function tagActiveClasses(): string {
  return "bg-primary text-primary-foreground border-primary";
}
