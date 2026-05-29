import { missingUserId } from "@/lib/http";
import { RecipeBlockSchema, TweakResponseSchema } from "@/lib/recipes/schemas";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// The client sends blocks (recipeWithIdToBlock already applied) — validate directly
const RecipeBlockWithIdSchema = RecipeBlockSchema.extend({ id: z.string() });
type RecipeBlockWithId = z.infer<typeof RecipeBlockWithIdSchema>;

const MAX_INSTRUCTION_LENGTH = 500;

const CHANGE_KINDS = TweakResponseSchema.shape.changes.element.shape.kind.options.join(", ");
const RECIPE_FIELDS = Object.keys(RecipeBlockSchema.shape).join(", ");

function buildSystemPrompt(originalRecipe: RecipeBlockWithId, workingDraft: RecipeBlockWithId): string {
  return `You are a recipe editor. Apply the user's instruction to the working draft, then return a JSON object describing the result.

## Original recipe (the saved cookbook version — change list anchors against this)
\`\`\`json
${JSON.stringify(originalRecipe, null, 2)}
\`\`\`

## Working draft (apply the instruction to this)
\`\`\`json
${JSON.stringify(workingDraft, null, 2)}
\`\`\`

## Instructions
- Apply the user's instruction as a precise, minimal change to the working draft.
- Keep all unaffected fields exactly as they are in the working draft.
- Update the \`description\` ("Ah Mah's note") if the dish character meaningfully changes (e.g. protein swap, cuisine shift). Include a \`description_updated\` change entry when you do.
- If the request would produce a wholly different dish unrelated to the current recipe, politely refuse in plain text (not JSON) and explain why.

## Response format
Return ONLY a valid JSON object matching this schema — no markdown fences, no surrounding text:
\`\`\`
{
  "recipe": { ${RECIPE_FIELDS} },
  "changes": [
    { "kind": "<one of: ${CHANGE_KINDS}>", "ref": "<ingredient name or step index>", "label": "<narrative label>" }
  ]
}
\`\`\`

The \`changes\` array must list **every structural delta against the original recipe** (not against the working draft). Each entry needs:
- \`kind\`: the type of change
- \`ref\`: for ingredient changes, the ingredient name; for step changes, the step index (0-based number); omit for recipe-level changes (title, description, tags, servings, time)
- \`label\`: a short narrative label in Ah Mah's voice (e.g. "Added cornstarch to velvet the chicken")`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body: {
      userId?: string;
      instruction?: string;
      originalRecipe?: unknown;
      workingDraft?: unknown;
    } = await req.json();

    const { userId, originalRecipe: originalRecipeRaw, workingDraft: workingDraftRaw } = body;
    let { instruction } = body;

    if (!userId) return missingUserId();
    if (!instruction) {
      return NextResponse.json({ error: "instruction is required" }, { status: 400 });
    }

    instruction = instruction.trim().slice(0, MAX_INSTRUCTION_LENGTH);
    if (!instruction) {
      return NextResponse.json({ error: "instruction is required" }, { status: 400 });
    }

    if (!originalRecipeRaw) {
      return NextResponse.json({ error: "originalRecipe is required" }, { status: 400 });
    }

    // Client sends block format (recipeWithIdToBlock already applied) — validate directly
    const parsedOriginal = RecipeBlockWithIdSchema.safeParse(originalRecipeRaw);
    if (!parsedOriginal.success) {
      return NextResponse.json(
        { error: "Invalid originalRecipe payload", details: parsedOriginal.error.flatten() },
        { status: 400 }
      );
    }

    if (parsedOriginal.data.id !== id) {
      return NextResponse.json({ error: "recipe id mismatch" }, { status: 400 });
    }

    // workingDraft defaults to originalRecipe on the first turn
    const parsedDraft = workingDraftRaw
      ? RecipeBlockWithIdSchema.safeParse(workingDraftRaw)
      : parsedOriginal;
    const workingDraft = parsedDraft.success ? parsedDraft.data : parsedOriginal.data;

    const result = streamText({
      model: openai("gpt-4.1-mini"),
      system: buildSystemPrompt(parsedOriginal.data, workingDraft),
      messages: [{ role: "user", content: instruction }],
      maxOutputTokens: 2000,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("[/api/recipe/[id]/tweak]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
