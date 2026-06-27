import { prisma } from "@/lib/db";
import { canonicalTipKey } from "@/lib/marketTips/canonicalKey";
import { isPickableCategory } from "@/lib/marketTips/pickable";
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
        category: z.string().nullish(),
      }),
    )
    .min(1)
    .max(200),
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
      return NextResponse.json({ error: "Invalid items payload" }, { status: 400 });
    }

    // Canonicalize + dedupe; track a display name + pickability per key.
    const wanted = new Map<string, { name: string; pickable: boolean }>();
    for (const item of parsed.data.items) {
      const key = canonicalTipKey(item.name);
      if (!key || wanted.has(key)) continue;
      wanted.set(key, {
        name: item.name.trim(),
        pickable: isPickableCategory(item.category),
      });
    }

    const keys = [...wanted.keys()];
    const cached = await prisma.marketTip.findMany({ where: { key: { in: keys } } });
    const result: Record<string, string> = Object.create(null);
    for (const row of cached) result[row.key] = row.tip;

    const misses = keys.filter(
      (k) => !Object.prototype.hasOwnProperty.call(result, k),
    );
    const toGenerate = misses.filter((k) => wanted.get(k)!.pickable);
    const staples = misses.filter((k) => !wanted.get(k)!.pickable);

    // Negative-cache staples: no model call, never a tip.
    for (const k of staples) {
      result[k] = "";
      await prisma.marketTip
        .create({ data: { key: k, tip: "" } })
        .catch((e) => console.warn("market-tip cache write failed", k, e));
    }

    if (toGenerate.length > 0) {
      const list = toGenerate.map((k) => `- ${k}`).join("\n");
      const { object } = await generateObject({
        model: openai("gpt-5-mini"),
        schema: TipGenSchema,
        temperature: 0.4,
        prompt: `You are Ah Mah, a warm Singaporean grandmother at the wet market. For each item, give ONE short tip on how to PICK a good fresh one at the shop — what to look for, feel for, or smell.

RULES:
- Return exactly one entry per item, using the EXACT given item text as "key".
- "tip": max 12 words, plain imperative. NO "to pick a good X" preamble. e.g. "firm, deep red, no soft spots".
- If quality does NOT meaningfully vary at the shop (dry goods, canned, bottled, salt, sugar, flour), return tip as an empty string "".
- ${KITCHEN_DOMAIN_RULE}
- Warm and practical, but keep it SHORT.

ITEMS:
${list}`,
      });

      const generated = new Map(
        object.tips.map((t) => [canonicalTipKey(t.key), t.tip.trim()]),
      );
      for (const k of toGenerate) {
        if (generated.has(k)) {
          const tip = generated.get(k)!;
          result[k] = tip;
          await prisma.marketTip
            .create({ data: { key: k, tip } })
            .catch((e) => console.warn("market-tip cache write failed", k, e));
        } else {
          // Model omitted this key — return no tip for this request but
          // don't negative-cache it, so it stays retryable on a later call.
          result[k] = "";
        }
      }
    }

    return NextResponse.json({ tips: result });
  } catch (error) {
    console.error("Failed to fetch market tips", error);
    return NextResponse.json(
      { error: "Failed to fetch market tips" },
      { status: 500 },
    );
  }
}
