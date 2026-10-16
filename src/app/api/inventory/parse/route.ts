import { addInventoryItem } from "@/lib/inventory/Inventory";
import { AddInventoryItemSchema } from "@/lib/inventory/schemas";
import { buildInventoryParsePrompt } from "@/lib/inventory/prompts";
import { withAuth } from "@/lib/withAuth";
import { EFFORT_MECHANICAL, MODEL } from "@/lib/ai/models";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ParseSchema = z.object({
  items: z.array(AddInventoryItemSchema),
});

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const { object } = await generateObject({
      model: openai(MODEL),
      providerOptions: EFFORT_MECHANICAL,
      schema: ParseSchema,
      // gpt-5 models only support the default temperature; setting it errors.
      prompt: buildInventoryParsePrompt(text),
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
});
