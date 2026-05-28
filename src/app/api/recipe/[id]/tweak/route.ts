import { missingUserId } from "@/lib/http";
import { RecipeWithId } from "@/lib/recipes/schemas";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextRequest, NextResponse } from "next/server";

const MAX_INSTRUCTION_LENGTH = 500;

const RECIPE_FIELDS =
  "title, description, totalTimeMinutes, baseServings, ingredients, prep, steps, tags";

function buildSystemPrompt(recipe: RecipeWithId): string {
  return `You are a recipe editor. Your task is to apply a targeted modification to the following recipe.

## Current recipe
\`\`\`json
${JSON.stringify(recipe, null, 2)}
\`\`\`

## Instructions
- Apply the user's instruction as a precise, minimal change — keep all unaffected fields exactly as they are.
- Return ONLY a valid JSON object matching the RecipeBlock schema. Do not wrap it in markdown fences or add any surrounding text.
- RecipeBlock fields: ${RECIPE_FIELDS}
- If the user's request would produce a wholly different dish unrelated to the current recipe, politely refuse in plain text (not JSON) and explain why.`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params; // resolve dynamic segment (unused but required by Next.js App Router)

  try {
    const body: { userId?: string; instruction?: string; recipe?: RecipeWithId } =
      await req.json();

    const { userId, recipe } = body;
    let { instruction } = body;

    if (!userId) return missingUserId();
    if (!instruction) {
      return NextResponse.json({ error: "instruction is required" }, { status: 400 });
    }

    instruction = instruction.trim().slice(0, MAX_INSTRUCTION_LENGTH);

    const result = streamText({
      model: openai("gpt-4.1-mini"),
      system: buildSystemPrompt(recipe as RecipeWithId),
      messages: [{ role: "user", content: instruction }],
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("[/api/recipe/[id]/tweak]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
