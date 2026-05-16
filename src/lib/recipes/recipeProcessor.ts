import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { TAG_SETS } from "./tagColors";
import { normalizeTags } from "./normalizeTags";
import { CategorySchema } from "@/lib/inventory/schemas";

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
});

export type RecipeMetadata = z.infer<typeof RecipeMetadataSchema>;

const TAG_CATEGORIES = Object.entries(TAG_SETS)
  .map(([cat, tags]) => `${cat.toUpperCase()}: ${tags.join(", ")}`)
  .join("\n");

export async function processRecipe(
  recipeName: string,
  recipeInstructions: string,
): Promise<RecipeMetadata> {
  const prompt = `Extract metadata from this recipe for storage.

TASKS:
1. Choose 3-8 tags from the categories below (use exact tag names, lowercase, hyphenated).
2. Identify baseServings — how many servings the recipe makes (infer 2 or 4 if unstated).
3. Extract ingredients as { name, category, amount?, unit? }.
   - category must be one of: Protein, Carbs, Vegetable, Condiments, Spice, Misc.
   - Use the exact unit strings the recipe uses.
   - Omit amount/unit for non-quantified items like "salt to taste".
4. Write a description: one evocative sentence ≤140 chars. Capture the soul of the dish — not a step list. e.g. "Sunday lunch staple — rice poached in chicken stock, finished with ginger-scallion oil."
5. Extract totalTimeMinutes from a "**Total time:**" line if present. Omit if not stated.

TAG CATEGORIES:
${TAG_CATEGORIES}

RECIPE NAME: ${recipeName}

RECIPE TEXT:
${recipeInstructions}`;

  const result = await generateObject({
    model: openai("gpt-4.1-mini"),
    schema: RecipeMetadataSchema,
    prompt,
    temperature: 0.2,
  });

  return {
    ...result.object,
    tags: normalizeTags(result.object.tags),
  };
}
