import { prisma } from "@/lib/db";
import { canonicalTipKey } from "@/lib/marketTips/canonicalKey";
import { KITCHEN_DOMAIN_RULE } from "@/lib/marketTips/relevance";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().min(1),
        // "ingredient" | "kitchenware" — steers food-vs-equipment advice.
        type: z.string().nullish(),
      }),
    )
    .min(1)
    .max(30),
});

const TipGenSchema = z.object({
  tips: z.array(z.object({ key: z.string(), tip: z.string() })),
});

export async function POST(req: NextRequest) {
  try {
    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = RequestSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid items payload" },
        { status: 400 },
      );
    }

    // Canonicalize + dedupe; keep a display name + type per key.
    const wanted = new Map<string, { name: string; type: string }>();
    for (const item of parsed.data.items) {
      const key = canonicalTipKey(item.name);
      if (!key || wanted.has(key)) continue;
      wanted.set(key, {
        name: item.name.trim(),
        type: item.type === "kitchenware" ? "kitchenware" : "ingredient",
      });
    }

    const keys = [...wanted.keys()];
    const cached = await prisma.storageTip.findMany({
      where: { key: { in: keys } },
    });
    const result: Record<string, string> = Object.create(null);
    for (const row of cached) result[row.key] = row.tip;

    const misses = keys.filter(
      (k) => !Object.prototype.hasOwnProperty.call(result, k),
    );

    if (misses.length > 0) {
      // Unlike Market Tips there is no category pre-filter: a staple (flour)
      // still has a storage tip and equipment (wok) has a care tip. The
      // kitchen-domain relevance gate runs at the model so non-kitchen items
      // resolve to "" and get negative-cached.
      const list = misses
        .map((k) => `${k} = ${wanted.get(k)!.type}`)
        .join("\n");
      const { object } = await generateObject({
        model: openai("gpt-5-mini"),
        schema: TipGenSchema,
        temperature: 0.4,
        prompt: `You are Ah Mah, a warm Singaporean grandmother. For each kitchen item, give ONE short tip on how to KEEP it well at home — for food, how to store it so it lasts (where, how, what to avoid); for equipment, how to care for it so it lasts.

Each item below is written as "name = kind".

RULES:
- Return exactly one entry per item. Set "key" to the NAME only — the text to the LEFT of " = " — copied EXACTLY. Never include the kind in the key.
- Use the kind (right of " = "): "ingredient" means food, "kitchenware" means equipment — advise accordingly.
- "tip": max 12 words, plain imperative. NO "to store X" preamble. e.g. "cool, dark place — never the fridge".
- ${KITCHEN_DOMAIN_RULE}
- If there is no meaningful way to keep it better (it just sits in the cupboard), return tip as an empty string "".
- Warm and practical, but keep it SHORT.

ITEMS:
${list}`,
      });

      const generated = new Map(
        object.tips.map((t) => [canonicalTipKey(t.key), t.tip.trim()]),
      );
      for (const k of misses) {
        if (generated.has(k)) {
          const tip = generated.get(k)!;
          result[k] = tip;
          await prisma.storageTip
            .create({ data: { key: k, tip } })
            .catch((e) => console.warn("storage-tip cache write failed", k, e));
        } else {
          // Model omitted this key — return no tip but don't negative-cache,
          // so it stays retryable on a later call.
          result[k] = "";
        }
      }
    }

    return NextResponse.json({ tips: result });
  } catch (error) {
    console.error("Failed to fetch storage tips", error);
    return NextResponse.json(
      { error: "Failed to fetch storage tips" },
      { status: 500 },
    );
  }
}
