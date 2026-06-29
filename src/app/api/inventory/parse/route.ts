import { addInventoryItem } from "@/lib/inventory/Inventory";
import { AddInventoryItemSchema } from "@/lib/inventory/schemas";
import { unauthorized } from "@/lib/http";
import { getSessionUserId } from "@/lib/session";
import { PROMPT_FRAGMENTS } from "@/lib/prompts/fragments";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ParseSchema = z.object({
  items: z.array(AddInventoryItemSchema),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId(req);
    if (!userId) return unauthorized();

    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const { object } = await generateObject({
      model: openai("gpt-5-mini"),
      schema: ParseSchema,
      temperature: 0.1,
      prompt: `Parse the following freeform inventory entry into structured items. The user is dumping what they just bought or what they have on hand.

RULES:
- Each item gets: name, type ("ingredient" | "kitchenware"), and OPTIONAL quantity + unit.
- ONLY set quantity/unit when the user explicitly states an amount (e.g., "200g chicken" → quantity=200, unit="g"; "2 chicken breasts" → quantity=2, unit="pieces"). If they say "some bok choy" or just "eggs", LEAVE quantity AND unit UNSET — unset means "they have it, amount unlimited".
- type rules: kitchenware = pots, pans, utensils, appliances. Everything edible = ingredient.
- category rules (REQUIRED for type=ingredient, OMIT for type=kitchenware):
${PROMPT_FRAGMENTS.categoryRules}
- Normalize names to singular, title case where natural ("chicken breasts" → "Chicken breast", "bok choy" → "Bok choy").
- unit MUST come from this allowlist if used: g, kg, oz, lb, ml, l, cup, tbsp, tsp, piece, pieces, clove, cloves, bottle, bottles, can, cans, pack, packs, bunch, bunches, pinch, dash, slice, slices.

USER ENTRY:
${text}`,
    });

    await addInventoryItem(object.items, userId);
    return NextResponse.json({
      success: true,
      items: object.items,
      message: `Added ${object.items.length} item(s)`,
    });
  } catch (error) {
    console.error("Failed to parse inventory entry", error);
    return NextResponse.json(
      { error: "Failed to parse inventory entry" },
      { status: 500 },
    );
  }
}
