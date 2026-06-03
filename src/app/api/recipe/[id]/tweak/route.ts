import { missingUserId } from "@/lib/http";
import { ChangeKindSchema, RecipeBlockSchema } from "@/lib/recipes/schemas";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// The client sends blocks (recipeWithIdToBlock already applied) — validate directly
const RecipeBlockWithIdSchema = RecipeBlockSchema.extend({ id: z.string() });
type RecipeBlockWithId = z.infer<typeof RecipeBlockWithIdSchema>;

const MAX_INSTRUCTION_LENGTH = 500;

// The patch is small — only changed fields, not the whole recipe (ADR-0010) —
// so generation rarely approaches this ceiling. Kept generous so a large
// multi-field edit isn't clipped mid-object; it's a ceiling, not a target.
const MAX_OUTPUT_TOKENS = 8000;

const CHANGE_KINDS = ChangeKindSchema.options.join(", ");

function buildSystemPrompt(originalRecipe: RecipeBlockWithId, workingDraft: RecipeBlockWithId): string {
  return `You are a recipe editor. Apply the user's instruction to the working draft, then return a JSON **patch** describing only what changed.

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
- Return ONLY the fields that changed — do NOT echo unchanged fields. Output size should reflect how much changed, not the size of the recipe.
- Arrays (\`ingredients\`, \`steps\`, \`prep\`, \`tags\`) are all-or-nothing: if ANY element of an array changed, return the ENTIRE updated array (every element, in order). If an array is unchanged, OMIT the key.
- To clear an array entirely (e.g. drop all tags), return it as \`[]\`. Omitting a key means "leave unchanged"; \`[]\` means "make empty" — they are different.
- Scalar fields (\`title\`, \`description\`, \`baseServings\`, \`totalTimeMinutes\`): include only if changed.
- Update the \`description\` ("Ah Mah's note") if the dish character meaningfully changes (e.g. protein swap, cuisine shift). Include a \`description_updated\` change entry when you do.
- If the request would produce a wholly different dish unrelated to the current recipe, politely refuse in plain text (not JSON) and explain why.

## Response format
Return ONLY a valid JSON object — no markdown fences, no surrounding text. Include only the recipe fields that changed; \`changes\` is always required:
\`\`\`
{
  // any subset of: title, description, baseServings, totalTimeMinutes, ingredients, steps, prep, tags
  "ingredients": [ /* the WHOLE array, only if it changed */ ],
  "changes": [
    {
      "kind": "<one of: ${CHANGE_KINDS}>",
      "ref": { "type": "ingredient|step", "index": 0, "basis": "original|workingDraft" },
      "label": "<narrative label>"
    }
  ]
}
\`\`\`

The \`changes\` array must list **every structural delta against the original recipe** (not against the working draft). Each entry needs:
- \`kind\`: the type of change
- \`ref\`: omit for recipe-level changes (title, description, tags, servings, time) and for \`prep_updated\`. Use it only for ingredient/step row changes, as a structural locator with:
  - \`type\`: "ingredient" or "step"
  - \`index\`: a 0-based row index
  - \`basis\`: "workingDraft" for rows visible in the returned recipe (\`ingredient_added\`, \`ingredient_changed\`, \`step_added\`, \`step_replaced\`); "original" for removed rows (\`ingredient_removed\`, \`step_removed\`)
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

    let workingDraft = parsedOriginal.data;
    if (workingDraftRaw !== undefined) {
      const parsedDraft = RecipeBlockWithIdSchema.safeParse(workingDraftRaw);
      if (!parsedDraft.success) {
        return NextResponse.json(
          { error: "Invalid workingDraft payload", details: parsedDraft.error.flatten() },
          { status: 400 }
        );
      }
      if (parsedDraft.data.id !== id) {
        return NextResponse.json({ error: "workingDraft id mismatch" }, { status: 400 });
      }
      workingDraft = parsedDraft.data;
    }

    // Buffer the full generation rather than streaming: the client parses the
    // response as one JSON object (no incremental render), so streaming buys
    // nothing here — and buffering lets us inspect finishReason before we
    // respond, which a streamed response can't (status is already sent).
    const { text, finishReason } = await generateText({
      model: openai("gpt-4.1-mini"),
      system: buildSystemPrompt(parsedOriginal.data, workingDraft),
      messages: [{ role: "user", content: instruction }],
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });

    if (finishReason === "length") {
      // Cut off by the token cap — the partial text is unparseable JSON.
      // Fail cleanly so the client shows a friendly message instead of
      // receiving a successful-looking truncated body.
      return NextResponse.json(
        { error: "Tweak response was too long to complete." },
        { status: 422 }
      );
    }

    return new NextResponse(text, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("[/api/recipe/[id]/tweak]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
