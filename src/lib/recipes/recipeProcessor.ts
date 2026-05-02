import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { TAG_SETS } from "./tagColors";

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
3. Extract ingredients as { name, amount?, unit? }. Use the exact unit strings the recipe uses. Omit amount/unit for non-quantified items like "salt to taste".

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

  return result.object;
}
