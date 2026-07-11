import { MODEL_LIGHT } from "@/lib/ai/models";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { normalizeTags } from "./normalizeTags";
import { CategorySchema } from "@/lib/inventory/schemas";
import { PROMPT_FRAGMENTS } from "@/lib/prompts/fragments";

// Extract metadata from a recipe. We don't ask the model to re-emit the
// recipe text — passing raw instructions through is more reliable and the
// new system prompt no longer emits markers that need stripping.
//
// All fields have safe defaults so a partial response still validates and
// the recipe still saves with whatever metadata the model managed to extract.
const RecipeMetadataSchema = z.object({
  tags: z
    .array(z.string())
    .default([])
    .describe("3-8 tags from the categories below."),
  baseServings: z
    .number()
    .int()
    .positive()
    .default(2)
    .describe(
      "Servings the recipe yields as written. Infer 2-4 if unstated.",
    ),
  ingredients: z
    .array(
      z.object({
        name: z.string().describe("Ingredient name, e.g. 'chicken breast'"),
        category: CategorySchema.describe(
          "Ingredient category. Must be one of: Protein, Carbs, Vegetable, Condiments, Spice, Misc.",
        ),
        amount: z
          .number()
          .positive()
          .optional()
          .describe("Numeric amount if stated. Omit for 'salt to taste'."),
        unit: z
          .string()
          .optional()
          .describe(
            "Unit string matching the recipe text (e.g. 'g', 'tbsp', 'piece'). Omit if amount is omitted.",
          ),
      }),
    )
    .default([])
    .describe(
      "Structured ingredient list. Use the exact unit strings the recipe uses.",
    ),
  description: z
    .string()
    .max(140)
    .default("")
    .describe(
      "One evocative sentence (≤140 chars) — not a summary of steps. e.g. 'Sunday lunch staple — rice poached in chicken stock, finished with ginger-scallion oil.'",
    ),
  totalTimeMinutes: z
    .number()
    .int()
    .positive()
    .optional()
    .describe(
      "Total time start to finish in minutes. Extract from a '**Total time:**' line if present. Omit if unstated.",
    ),
  prep: z
    .array(z.string())
    .default([])
    .describe(
      "Short imperative prep tasks done BEFORE heat: knife work (dice, mince, chop, slice), marinating, beating, soaking, scoring. Example: ['Dice 1 bell pepper', 'Mince 2 cloves garlic']. Empty array for assemble-only recipes with no real prep.",
    ),
  notes: z
    .array(z.string())
    .default([])
    .describe(
      "0-4 whole-dish asides: make-ahead, storage, serving suggestions, or pantry-independent technique fallbacks ('no cumin? use garam masala'). One sentence each. NOT per-ingredient pantry substitutions. Empty array if the recipe says nothing worth noting.",
    ),
});

export type RecipeMetadata = z.infer<typeof RecipeMetadataSchema>;

export async function processRecipe(
  recipeName: string,
  recipeInstructions: string,
): Promise<RecipeMetadata> {
  const prompt = `Extract metadata from this recipe for storage.

TASKS:
1. Choose 3-8 tags. ONLY use exact tag names from the list below — do not invent new tags, do not use ingredient names (e.g. "onion", "garlic") as tags. If unsure, prefer fewer correct tags over more guesses.
2. Identify baseServings — how many servings the recipe makes (infer 2 or 4 if unstated).
3. Extract ingredients as { name, category, amount?, unit? }.
   - category must be one of: ${PROMPT_FRAGMENTS.categoryList}.
   - Use the exact unit strings the recipe uses.
   - Omit amount/unit for non-quantified items like "salt to taste".
4. Write a description: one evocative sentence ≤140 chars. Capture the soul of the dish — not a step list. e.g. "Sunday lunch staple — rice poached in chicken stock, finished with ginger-scallion oil."
5. Extract totalTimeMinutes from a "**Total time:**" line if present. Omit if not stated.
6. Extract prep — all knife work, marinating, beating, soaking that happens BEFORE heat. Each item is a short imperative ("Dice 1 bell pepper"). If a step references "the diced X" or "the marinated Y", that prep MUST appear here. Empty array if there's no real prep.
7. Extract notes — 0-4 whole-dish asides if the recipe states any: make-ahead, storage, serving suggestions, or pantry-independent technique fallbacks. One sentence each. Do NOT invent notes; empty array if the recipe says nothing worth noting.

TAG CATEGORIES:
${PROMPT_FRAGMENTS.tagCatalog}

RECIPE NAME: ${recipeName}

RECIPE TEXT:
${recipeInstructions}`;

  const result = await generateObject({
    model: openai(MODEL_LIGHT),
    schema: RecipeMetadataSchema,
    // gpt-5 models only support the default temperature; setting it errors.
    prompt,
  });

  return {
    ...result.object,
    tags: normalizeTags(result.object.tags),
  };
}
