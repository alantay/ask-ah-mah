import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { RecipeBlockSchema, type RecipeBlock } from "./schemas";
import { TAG_SETS } from "./tagColors";
import { normalizeTags } from "./normalizeTags";

const TAG_CATEGORIES = Object.entries(TAG_SETS)
  .map(([cat, tags]) => `${cat.toUpperCase()}: ${tags.join(", ")}`)
  .join("\n");

export async function parseRecipeText(text: string): Promise<RecipeBlock> {
  const result = await generateObject({
    model: openai("gpt-4.1-mini"),
    schema: RecipeBlockSchema,
    temperature: 0.2,
    prompt: `Extract the recipe from the text below into a structured format.

FIELDS:
- title: recipe name
- description: one evocative sentence ≤140 chars capturing the soul of the dish (not a step list). e.g. "Sunday lunch staple — rice poached in chicken stock, finished with ginger-scallion oil."
- baseServings: number of servings as written; infer 2–4 if unstated
- totalTimeMinutes: total time in minutes if stated; omit if not mentioned
- ingredients: array of { name, category, amount, unit, note }
  - category must be one of: Protein, Carbs, Vegetable, Condiments, Spice, Misc
  - amount is a string (e.g. "1 1/2", "200") — omit for "to taste" items
  - unit is the unit string as written (e.g. "g", "tbsp", "cloves")
- prep: array of short imperative strings for knife work and prep done BEFORE heat (e.g. "Dice 1 onion", "Mince 3 cloves garlic"). Empty array if no real prep.
- steps: array of { title, body, tip? }
  - title: short action phrase (e.g. "Sauté aromatics")
  - body: the full step instruction
  - tip: optional cook's note for this step
- tags: 3–8 tags from the list below only; do not invent tags

TAG CATEGORIES:
${TAG_CATEGORIES}

RECIPE TEXT:
${text}`,
  });

  return {
    ...result.object,
    tags: normalizeTags(result.object.tags ?? []),
  };
}
