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
- Each item gets: name, type ("ingredient" | "kitchenware"), shelfLife ("short" | "medium" | "long" | "frozen"), and OPTIONAL quantity + unit.
- ONLY set quantity/unit when the user explicitly states an amount (e.g., "200g chicken" → quantity=200, unit="g"; "2 chicken breasts" → quantity=2, unit="pieces"). If they say "some bok choy" or just "eggs", LEAVE quantity AND unit UNSET — unset means "they have it, amount unlimited".
- shelfLife rules:
  - "short" — leafy greens, herbs, seafood, dairy, cooked leftovers, fresh fish, mushrooms
  - "medium" — most meat, most fresh produce, eggs, tofu, bread
  - "long" — oils, dry goods (rice, pasta, flour), spices, sauces, canned/bottled goods, ALL kitchenware
  - "frozen" — anything explicitly stored in the freezer (frozen vegetables, frozen meat, frozen dumplings, ice cream, sukiyaki/shabu slices sold frozen)
- type rules: kitchenware = pots, pans, utensils, appliances. Everything edible = ingredient.
- category rules (REQUIRED for type=ingredient, OMIT for type=kitchenware):
  - "Protein" — meat, poultry, seafood, eggs, tofu, tempeh, legumes
  - "Carbs" — rice, noodles, pasta, bread, flour, potatoes, starches
  - "Vegetable" — all produce, herbs, mushrooms (incl. dried), leafy greens, aromatics (garlic, ginger, spring onion)
  - "Condiments" — sauces, oils, vinegars, pastes, sugar, salt
  - "Spice" — dry spices and spice blends (pepper, cumin, paprika, chili flakes, garam masala)
  - "Misc" — fruit, dairy, snacks, anything that doesn't clearly fit above
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
