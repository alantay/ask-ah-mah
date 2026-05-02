// Single source of truth for recipe-tag categorization.
// Used by tagClasses (UI color coding) and recipeProcessor (LLM tag prompt).

export type TagCategory =
  | "cuisine"
  | "protein"
  | "method"
  | "meal"
  | "difficulty"
  | "style"
  | "equipment"
  | "other";

export const TAG_SETS: Record<Exclude<TagCategory, "other">, readonly string[]> = {
  cuisine: [
    "italian", "chinese", "japanese", "mexican", "indian", "thai", "french",
    "mediterranean", "american", "korean", "vietnamese", "middle-eastern",
    "greek", "spanish", "moroccan", "malaysian", "singaporean",
  ],
  protein: [
    "chicken", "beef", "pork", "fish", "seafood", "vegetarian", "vegan",
    "eggs", "tofu", "beans", "lentils",
  ],
  method: [
    "baked", "fried", "grilled", "steamed", "boiled", "roasted", "sauteed",
    "stir-fried", "braised", "slow-cooked", "pressure-cooked", "air-fried",
    "no-cook", "raw", "marinated", "fermented", "pickled",
  ],
  meal: [
    "breakfast", "lunch", "dinner", "snack", "appetizer", "dessert",
    "side-dish", "main-course", "soup", "salad", "beverage", "condiment",
  ],
  difficulty: [
    "beginner", "easy", "intermediate", "advanced", "quick (under 30 min)",
    "one-pot", "make-ahead",
  ],
  style: [
    "crispy", "creamy", "spicy", "sweet", "savory", "tangy", "hearty",
    "light", "refreshing", "warming",
  ],
  equipment: [
    "wok", "instant-pot", "cast-iron", "slow-cooker", "blender", "oven-free",
    "grill",
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
