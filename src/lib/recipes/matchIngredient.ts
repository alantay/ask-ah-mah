const STOPWORDS = new Set([
  "fresh", "ground", "chopped", "minced", "sliced", "diced",
  "whole", "thin", "thinly", "raw", "cooked", "dried",
  "powder", "extract", "pure", "fine", "coarse",
  "large", "small", "medium",
  "of", "the", "and", "a", "to",
]);

function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/\([^)]*\)/g, " ")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 1 && !STOPWORDS.has(t)),
  );
}

export function ingredientMatches(
  ingredientName: string,
  inventoryNames: string[],
): boolean {
  const a = tokenize(ingredientName);
  if (a.size === 0) return false;
  return inventoryNames.some((inv) => {
    const b = tokenize(inv);
    for (const t of a) if (b.has(t)) return true;
    return false;
  });
}
