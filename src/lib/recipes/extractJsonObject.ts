// Tolerant extraction of a JSON object from a model response that is supposed
// to be pure JSON but sometimes arrives wrapped in markdown fences, prefixed
// with prose, or truncated mid-object (e.g. when generation hits a token cap).

/** Strip a leading ```/```json fence (and its trailing fence, if present). */
function stripCodeFence(text: string): string {
  const t = text.trim();
  const openFence = /^```[a-zA-Z]*[ \t]*\r?\n?/;
  if (!openFence.test(t)) return t;
  return t.replace(openFence, "").replace(/\r?\n?```[ \t]*$/, "");
}

/**
 * Return the first balanced `{ … }` object found in `text`, unwrapping a
 * surrounding markdown code fence and ignoring any leading/trailing prose.
 * Braces and quotes inside JSON strings are handled. Returns `null` when no
 * complete, balanced object is present (no object at all, or a truncated one).
 */
export function extractJsonObject(text: string): string | null {
  const cleaned = stripCodeFence(text);
  const start = cleaned.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) return cleaned.slice(start, i + 1);
    }
  }

  return null; // unbalanced — truncated or malformed
}

/**
 * Whether `text` looks like an attempt at a JSON response (vs. a plain-text
 * refusal). Used to decide whether an unparseable response should be hidden
 * behind a friendly message (looked like JSON but broke) or surfaced as-is
 * (the model deliberately replied in prose).
 */
export function looksLikeJsonAttempt(text: string): boolean {
  const t = text.trim();
  if (/^```json/i.test(t)) return true;
  return stripCodeFence(t).trim().startsWith("{");
}
