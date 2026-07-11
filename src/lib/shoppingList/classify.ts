import { MODEL_LIGHT } from "@/lib/ai/models";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { AISLE_ORDER, type Aisle } from "./aisle";
import { canonicalShoppingKey } from "./canonicalKey";

const AssignmentSchema = z.object({
  assignments: z.array(z.object({ key: z.string(), aisle: z.string() })),
});

const AISLE_SET: ReadonlySet<string> = new Set(AISLE_ORDER);

/** Coerce a model-supplied label to a known Aisle, defaulting to Other. */
function coerce(aisle: string): Aisle {
  return AISLE_SET.has(aisle) ? (aisle as Aisle) : "Other";
}

/**
 * Ask the model which Aisle each item belongs to, mirroring the Market Tip
 * engine (one `gpt-5-nano` call, name in, label out). Returns a map from each
 * item's canonical shopping key to its Aisle. Anything the model omits or
 * mislabels resolves to `Other`, so the caller always gets an aisle per item.
 */
export async function classifyAisles(
  names: string[],
): Promise<Record<string, Aisle>> {
  // Canonicalize + dedupe; keep one display name per key for the prompt.
  const wanted = new Map<string, string>();
  for (const name of names) {
    const key = canonicalShoppingKey(name);
    if (key && !wanted.has(key)) wanted.set(key, name.trim());
  }

  const keys = [...wanted.keys()];
  const result: Record<string, Aisle> = Object.create(null);
  if (keys.length === 0) return result;

  // Default every wanted item to Other so omissions are covered.
  for (const k of keys) result[k] = "Other";

  const list = keys.map((k) => `- ${k}`).join("\n");
  const { object } = await generateObject({
    model: openai(MODEL_LIGHT),
    schema: AssignmentSchema,
    // gpt-5 models only support the default temperature; setting it errors.
    prompt: `You sort grocery items into the aisle where a shopper finds them at a market. For each item, pick exactly ONE aisle from this list:

${AISLE_ORDER.map((a) => `- ${a}`).join("\n")}

RULES:
- Return exactly one entry per item, using the EXACT given item text as "key".
- "Produce" = fresh fruit & vegetables. "Meat & Seafood" = any meat, poultry, fish, eggs, tofu. "Rice & Noodles" = rice, noodles, flour, bread, other staples. "Sauces & Seasoning" = sauces, oils, spices, condiments. "Other" = anything that fits none of the above.

ITEMS:
${list}`,
  });

  for (const a of object.assignments) {
    const key = canonicalShoppingKey(a.key);
    if (key in result) result[key] = coerce(a.aisle);
  }

  return result;
}
