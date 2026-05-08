import { addInventoryItem } from "@/lib/inventory/Inventory";
import { AddInventoryItemSchema } from "@/lib/inventory/schemas";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ParseSchema = z.object({
  items: z.array(AddInventoryItemSchema),
});

export async function POST(req: NextRequest) {
  try {
    const { text, userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const { object } = await generateObject({
      model: openai("gpt-4.1-mini"),
      schema: ParseSchema,
      temperature: 0.1,
      prompt: `Parse the following freeform inventory entry into structured items. The user is dumping what they just bought or what they have on hand.

RULES:
- Each item gets: name, type ("ingredient" | "kitchenware"), shelfLife ("short" | "medium" | "long"), category ("Protein" | "Vegetable" | "Condiment" | "Misc"), and OPTIONAL quantity + unit.
- ONLY set quantity/unit when the user explicitly states an amount.
- shelfLife rules:
  - "short" — leafy greens, herbs, seafood, dairy, fresh fish, mushrooms
  - "medium" — most meat, most fresh produce, eggs, tofu
  - "long" — oils, dry goods, sauces, canned goods, kitchenware
- category rules:
  - "Protein" — meat, poultry, seafood, eggs, tofu, beans, lentils
  - "Vegetable" — fresh/frozen produce, mushrooms, greens, aromatics (ginger, garlic, onion)
  - "Condiment" — sauces, oils, spices, seasonings, vinegars, pastes
  - "Misc" — dry goods, grains, dairy, snacks, ALL kitchenware
- type rules: kitchenware = pots, pans, utensils, appliances. Everything edible = ingredient.
- Normalize names to singular, title case.
- unit MUST come from the allowed list: g, kg, oz, lb, ml, l, cup, tbsp, tsp, piece, pieces, clove, cloves, bottle, bottles, can, cans, pack, packs, bunch, bunches, pinch, dash, slice, slices.

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
