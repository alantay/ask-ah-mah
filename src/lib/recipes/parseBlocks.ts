import { parsePartialJson } from "ai";
import {
  ClarifyBlockSchema,
  RecipeBlockSchema,
  SuggestionsBlockSchema,
} from "./schemas";
import type {
  ClarifyBlockData,
  RecipeBlock,
  SuggestionsBlockData,
} from "./schemas";

export type ParsedBlock =
  | { kind: "suggestions"; payload: SuggestionsBlockData; index: number }
  | { kind: "clarify"; payload: ClarifyBlockData; index: number }
  | { kind: "recipe"; payload: RecipeBlock; index: number }
  | { kind: "legacy"; recipeStr: string; index: number };

export function extractRecipeBlocks(text: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];

  const fenceRegex = /^```(suggestions|clarify|recipe)\n([\s\S]*?)\n```/gm;
  let match: RegExpExecArray | null;

  while ((match = fenceRegex.exec(text)) !== null) {
    const kind = match[1] as "suggestions" | "clarify" | "recipe";
    try {
      const payload = JSON.parse(match[2]);
      if (kind === "suggestions") {
        const result = SuggestionsBlockSchema.safeParse(payload);
        if (result.success)
          blocks.push({ kind: "suggestions", payload: result.data, index: match.index });
      } else if (kind === "clarify") {
        const result = ClarifyBlockSchema.safeParse(payload);
        if (result.success)
          blocks.push({ kind: "clarify", payload: result.data, index: match.index });
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
    // Keep stripping legacy `gate` fences for backward-compat and to avoid
    // rendering unsupported fenced-language blocks from older messages.
    .replace(/^```(?:suggestions|clarify|gate|recipe)\n[\s\S]*?\n```/gm, "")
    .trim();
}

export type OpenFenceKind = "recipe" | "suggestions" | "clarify";

export interface OpenFence {
  kind: OpenFenceKind;
  /** Index of the opening ``` marker, for slicing prose before it. */
  index: number;
  /** Everything after the `\`\`\`<kind>\n` opener — the (incomplete) JSON body. */
  json: string;
}

// Detects a single trailing OPEN fence of either type. A response streams its
// blocks in order, so only the final fence can be unclosed; we take the
// last-positioned opener and confirm it has no closing `\n``` ` yet. Replaces
// the recipe-only detector and closes the suggestions raw-JSON leak (an
// incomplete ```suggestions used to fall through to the markdown renderer).
export function getOpenFence(text: string): OpenFence | null {
  const markers: { kind: OpenFenceKind; marker: string }[] = [
    { kind: "recipe", marker: "```recipe\n" },
    { kind: "suggestions", marker: "```suggestions\n" },
    { kind: "clarify", marker: "```clarify\n" },
  ];

  let best: { kind: OpenFenceKind; index: number; markerLen: number } | null =
    null;
  for (const { kind, marker } of markers) {
    const idx = text.lastIndexOf(marker);
    if (idx === -1) continue;
    if (!best || idx > best.index)
      best = { kind, index: idx, markerLen: marker.length };
  }
  if (!best) return null;

  const json = text.slice(best.index + best.markerLen);
  if (json.includes("\n```")) return null; // fence is closed
  return { kind: best.kind, index: best.index, json };
}

// Scans an incomplete JSON buffer and returns the key of the top-level array
// that is currently being streamed (the open container directly under the root
// object), or null if no top-level array is open. String contents are skipped
// so braces/brackets inside values don't corrupt the depth tracking.
export function findOpenArrayKey(json: string): string | null {
  type Frame = { type: "object" | "array"; key: string | null };
  const stack: Frame[] = [];
  let inString = false;
  let escaped = false;
  let token = ""; // chars of the string currently being read
  let lastString: string | null = null; // last completed string (candidate key)
  let pendingKey: string | null = null; // key awaiting its value (after `:`)

  for (const ch of json) {
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
        lastString = token;
      } else {
        token += ch;
      }
      continue;
    }

    switch (ch) {
      case '"':
        inString = true;
        token = "";
        break;
      case ":":
        pendingKey = lastString;
        lastString = null;
        break;
      case "{":
        stack.push({ type: "object", key: pendingKey });
        pendingKey = null;
        lastString = null;
        break;
      case "[":
        stack.push({ type: "array", key: pendingKey });
        pendingKey = null;
        lastString = null;
        break;
      case "}":
      case "]":
        stack.pop();
        pendingKey = null;
        lastString = null;
        break;
      case ",":
        pendingKey = null;
        lastString = null;
        break;
    }
  }

  if (stack[0]?.type === "object" && stack[1]?.type === "array")
    return stack[1].key;
  return null;
}

// Parses an incomplete fenced-block body for progressive reveal. `parsePartialJson`
// repairs the buffer (growing strings render as a typewriter for free); we then
// drop the in-progress trailing element of the array currently being streamed so
// rows pop in as whole units instead of jittering field-by-field. Returns null
// when nothing is parseable yet — callers hold the last good value.
export async function parsePartialBlock(
  json: string,
): Promise<Record<string, unknown> | null> {
  try {
    const { value, state } = await parsePartialJson(json);
    if (state === "failed-parse" || value === null || typeof value !== "object")
      return null;

    const obj = { ...(value as Record<string, unknown>) };
    if (Object.keys(obj).length === 0) return null;
    if (state === "successful-parse") return obj; // whole object arrived; render all

    const openKey = findOpenArrayKey(json);
    if (openKey && Array.isArray(obj[openKey]) && obj[openKey].length > 0)
      obj[openKey] = obj[openKey].slice(0, -1);

    return obj;
  } catch {
    // Treat any unexpected parser error like an unparseable frame: callers
    // hold the last good value rather than surfacing an unhandled rejection.
    return null;
  }
}
