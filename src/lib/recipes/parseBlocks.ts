import {
  GateSchema,
  RecipeBlockSchema,
  SuggestionsBlockSchema,
} from "@/lib/recipes/schemas";
import type {
  GateData,
  RecipeBlock,
  SuggestionsBlockData,
} from "@/lib/recipes/schemas";

export type ParsedBlock =
  | { kind: "suggestions"; payload: SuggestionsBlockData; index: number }
  | { kind: "gate"; payload: GateData; index: number }
  | { kind: "recipe"; payload: RecipeBlock; index: number }
  | { kind: "legacy"; recipeStr: string; index: number };

export function extractRecipeBlocks(text: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];

  const fenceRegex = /^```(suggestions|recipe)\n([\s\S]*?)\n```/gm;
  let match: RegExpExecArray | null;

  while ((match = fenceRegex.exec(text)) !== null) {
    const kind = match[1] as "suggestions" | "recipe";
    try {
      const payload = JSON.parse(match[2]);
      if (kind === "suggestions") {
        const result = SuggestionsBlockSchema.safeParse(payload);
        if (result.success)
          blocks.push({ kind: "suggestions", payload: result.data, index: match.index });
      } else if (kind === "recipe") {
        const result = RecipeBlockSchema.safeParse(payload);
        if (result.success)
          blocks.push({ kind: "recipe", payload: result.data, index: match.index });
      }
    } catch {
      /* invalid JSON — skip */
    }
  }

  const legacyParts = text
    .split(/^-{5,}$/m)
    .map((p) => p.trim())
    .filter((p) => /^##\s+/m.test(p));

  if (blocks.length === 0 && legacyParts.length > 0) {
    legacyParts.forEach((recipeStr, i) => {
      blocks.push({ kind: "legacy", recipeStr, index: i });
    });
  }

  return blocks;
}

export function stripFences(text: string): string {
  return text
    .replace(/^```(?:suggestions|gate|recipe)\n[\s\S]*?\n```/gm, "")
    .trim();
}

export function getOpenRecipeFenceIdx(text: string): number {
  const marker = "```recipe\n";
  const openIdx = text.lastIndexOf(marker);
  if (openIdx === -1) return -1;
  const afterOpen = text.slice(openIdx + marker.length);
  return afterOpen.includes("\n```") ? -1 : openIdx;
}

// GateSchema re-exported so callers of old extractRecipeBlocks can use the gate schema for the proposeRecipe tool
export { GateSchema };
