import { prisma } from "@/lib/db";
import { canonicalTipKey } from "@/lib/marketTips/canonicalKey";
import { isPickableCategory } from "@/lib/marketTips/pickable";
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
        category: z.string().nullish(),
      }),
    )
    .min(1)
    .max(200),
});

const TipGenSchema = z.object({
  tips: z.array(z.object({ key: z.string(), tip: z.string() })),
});

interface MarketTipItem {
  name: string;
  category?: string | null;
}

const marketTipAdapter: TipCorpusAdapter<MarketTipItem> = {
  canonicalKey: (item) => canonicalTipKey(item.name),

  async readCache(keys) {
    const rows = await prisma.marketTip.findMany({ where: { key: { in: keys } } });
    return rows.map((row) => ({ key: row.key, label: row.tip }));
  },

  async writeCache(key, label) {
    await prisma.marketTip.create({ data: { key, tip: label } });
  },

  prefilter: (item) => isPickableCategory(item.category),

  negativeLabel: "",
  omissionLabel: "",

  async generate(misses) {
    const list = misses.map(({ key }) => `- ${key}`).join("\n");
    const { object } = await generateObject({
      model: openai(MODEL_LIGHT),
      schema: TipGenSchema,
      // gpt-5 models only support the default temperature; setting it errors.
      prompt: `Give ONE short, factual tip on how to PICK a good one of each item at the shop — what to look for, feel for, or smell.

RULES:
- Return exactly one entry per item, using the EXACT given item text as "key".
- "tip": max 12 words, plain imperative. NO "to pick a good X" preamble. e.g. "firm, deep red, no soft spots".
- If quality does NOT meaningfully vary at the shop (dry goods, canned, bottled, salt, sugar, flour), return tip as an empty string "".
- ${KITCHEN_DOMAIN_RULE}
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
      return NextResponse.json({ error: "Invalid items payload" }, { status: 400 });
    }

    const tips = await runTipCorpus(parsed.data.items, marketTipAdapter);

    return NextResponse.json({ tips });
  } catch (error) {
    console.error("Failed to fetch market tips", error);
    return NextResponse.json(
      { error: "Failed to fetch market tips" },
      { status: 500 },
    );
  }
});
