import { getTagCategory } from "./tagColors";

const SYNONYMS: Record<string, string> = {
  "stir-fry":        "stir-fried",
  "braise":          "braised",
  "pressure-cooker": "pressure-cooked",
  "instant-pot":     "pressure-cooked",
  "slow-cooker":     "slow-cooked",
  "wok":             "stir-fried",
  "grill":           "grilled",
  "blender":         "blended",
  "quick":           "quick (under 30 min)",
  "comfort food":    "comfort",
  "one-pan":         "one-pot",
  "tortilla":        "bread",
  "wrap":            "bread",
  "minced-beef":     "beef",
  "ground-beef":     "beef",
  "minced-pork":     "pork",
  "ground-pork":     "pork",
  "minced-chicken":  "chicken",
  "ground-chicken":  "chicken",
};

const DROP = new Set([
  "onion",
  "protein",
  "budget",
  "vegetarian",
  "vegan",
  "beginner",
  "intermediate",
  "advanced",
  "cast-iron",
]);

export function normalizeTags(raw: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const t of raw) {
    const lower = t.trim().toLowerCase();
    if (!lower) continue;
    if (DROP.has(lower)) continue;

    const canonical = SYNONYMS[lower] ?? lower;

    if (getTagCategory(canonical) === "other") continue;
    if (seen.has(canonical)) continue;

    seen.add(canonical);
    result.push(canonical);
  }

  return result;
}
