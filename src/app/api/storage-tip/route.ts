import { prisma } from "@/lib/db";
import { canonicalTipKey } from "@/lib/marketTips/canonicalKey";
import { KITCHEN_DOMAIN_RULE } from "@/lib/marketTips/relevance";
import { runTipCorpus, type TipCorpusAdapter } from "@/lib/tipCorpus";
import { withAuth } from "@/lib/withAuth";
import { MODEL_LIGHT } from "@/lib/ai/models";
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
    .max(200),
});

const TipGenSchema = z.object({
  tips: z.array(z.object({ key: z.string(), tip: z.string() })),
});

interface StorageTipItem {
  name: string;
  type: "ingredient" | "kitchenware";
}

const storageTipAdapter: TipCorpusAdapter<StorageTipItem> = {
  canonicalKey: (item) => canonicalTipKey(item.name),

  async readCache(keys) {
    const rows = await prisma.storageTip.findMany({ where: { key: { in: keys } } });
    return rows.map((row) => ({ key: row.key, label: row.tip }));
  },

  async writeCache(key, label) {
    await prisma.storageTip.create({ data: { key, tip: label } });
  },

  omissionLabel: "",

  // Unlike Market Tips there is no category pre-filter: a staple (flour)
  // still has a storage tip and equipment (wok) has a care tip. The
  // kitchen-domain relevance gate runs at the model so non-kitchen items
  // resolve to "" and get negative-cached.
  async generate(misses) {
    const list = misses
      .map(({ key, item }) => `${key} = ${item.type}`)
      .join("\n");
    const { object } = await generateObject({
      model: openai(MODEL_LIGHT),
      schema: TipGenSchema,
      // gpt-5 models only support the default temperature; setting it errors.
      prompt: `Give ONE short, factual tip on how to KEEP each kitchen item well at home — for food, how to store it so it lasts (where, how, what to avoid); for equipment, how to care for it so it lasts.

Each item below is written as "name = kind".

RULES:
- Return exactly one entry per item. Set "key" to the NAME only — the text to the LEFT of " = " — copied EXACTLY. Never include the kind in the key.
- Use the kind (right of " = "): "ingredient" means food, "kitchenware" means equipment — advise accordingly.
- "tip": max 12 words, plain imperative. NO "to store X" preamble. e.g. "cool, dark place — never the fridge".
- ${KITCHEN_DOMAIN_RULE}
- If there is no meaningful way to keep it better (it just sits in the cupboard), return tip as an empty string "".
- Plain and factual, no persona. Keep it SHORT.

ITEMS:
${list}`,
    });

    return new Map(
      object.tips.map((t) => [canonicalTipKey(t.key), t.tip.trim()] as const),
    );
  },
};

// Model-calling endpoint — gated on a verified session so anonymous callers
// can't loop it and burn token budget. Anonymous visitors still carry a
// session cookie, so the app's own calls are unaffected.
export const POST = withAuth(async (req: NextRequest, { userId: _userId }) => {
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

    const items: StorageTipItem[] = parsed.data.items.map((item) => ({
      name: item.name,
      type: item.type === "kitchenware" ? "kitchenware" : "ingredient",
    }));

    const tips = await runTipCorpus(items, storageTipAdapter);

    return NextResponse.json({ tips });
  } catch (error) {
    console.error("Failed to fetch storage tips", error);
    return NextResponse.json(
      { error: "Failed to fetch storage tips" },
      { status: 500 },
    );
  }
});
