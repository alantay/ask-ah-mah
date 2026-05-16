import { getTagCategory } from "./tagColors";

const SYNONYMS: Record<string, string> = {
  "stir-fry":        "stir-fried",
  "braise":          "braised",
  "pressure-cooker": "pressure-cooked",
  "quick":           "quick (under 30 min)",
  "comfort food":    "comfort",
};

const DROP = new Set(["rice", "onion", "protein", "budget"]);

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
