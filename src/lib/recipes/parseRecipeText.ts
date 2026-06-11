import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { RecipeBlockSchema, type RecipeBlock } from "./schemas";
import { normalizeTags } from "./normalizeTags";
import { PROMPT_FRAGMENTS } from "@/lib/prompts/fragments";

export async function parseRecipeText(text: string): Promise<RecipeBlock> {
  const result = await generateObject({
    model: openai("gpt-5-mini"),
    schema: RecipeBlockSchema,
    temperature: 0.2,
    prompt: `Extract the recipe from the text below into a structured format.

FIELDS:
- title: recipe name
- description: one evocative sentence ≤140 chars capturing the soul of the dish (not a step list). e.g. "Sunday lunch staple — rice poached in chicken stock, finished with ginger-scallion oil."
- baseServings: number of servings as written; infer 2–4 if unstated
- totalTimeMinutes: total time in minutes if stated; omit if not mentioned
- ingredients: array of { name, category, amount, unit, note }
  - category must be one of: ${PROMPT_FRAGMENTS.categoryList}
  - amount is a string (e.g. "1 1/2", "200") — omit for "to taste" items
  - unit is the normalised unit string after applying the UNIT NORMALIZATION rules below
- prep: array of short imperative strings for knife work and prep done BEFORE heat (e.g. "Dice 1 onion", "Mince 3 cloves garlic"). Empty array if no real prep.
- steps: array of { title, body, tip? }
  - title: short action phrase (e.g. "Sauté aromatics")
  - body: the full step instruction — apply UNIT NORMALIZATION to all measurements in body text
  - tip: optional cook's note for this step
- tags: 3–8 tags from the list below only; do not invent tags

UNIT NORMALIZATION:
Convert all imperial measurements to metric house style. Apply to every ingredient and every step body.

Weights — always convert to grams (g):
  - 1 oz = 28 g  (round to nearest 5 g)
  - 1 lb = 454 g (round to nearest 5 g)
  Examples:
    "8 ounces unsalted butter" → { amount: "225", unit: "g", name: "unsalted butter" }
    "1 pound ground beef"      → { amount: "455", unit: "g", name: "ground beef" }

Cups — convert to grams using these densities (1 cup values):
  - all-purpose / bread / cake flour: 120 g
  - granulated / white sugar: 200 g
  - brown sugar (packed): 220 g
  - butter: 227 g
  - rolled oats: 90 g
  - chocolate chips / chopped chocolate: 170 g
  - water, milk, stock, oil, vinegar, other liquids: keep as ml (1 cup = 240 ml)
  - unfamiliar or ambiguous ingredient: keep "cup" unit, add note with source value
  Example:
    "2 cups all-purpose flour" → { amount: "240", unit: "g", name: "all-purpose flour" }
    "1/2 cup granulated sugar" → { amount: "100", unit: "g", name: "granulated sugar" }
    "1 cup whole milk"         → { amount: "240", unit: "ml", name: "whole milk" }

Volume abbreviations — always use abbreviated form:
  - teaspoon / teaspoons → tsp
  - tablespoon / tablespoons → tbsp
  Example:
    "2 teaspoons vanilla extract" → { amount: "2", unit: "tsp", name: "vanilla extract" }
    "1 tablespoon soy sauce"      → { amount: "1", unit: "tbsp", name: "soy sauce" }

Natural-count items — strip size adjectives from unit into note:
  Example:
    "2 large eggs" → { amount: "2", unit: "eggs", note: "large", name: "eggs" }

Temperatures in step bodies — convert °F to °C (formula: (F−32)×5/9, round to nearest 5°C):
  Examples:
    "350°F" → "175°C"
    "400°F" → "205°C"
    "preheat to 375 degrees Fahrenheit" → "preheat to 190°C"

Fallback — if you are not confident about a conversion, keep the source unit and add a brief note explaining the original value.

TAG CATEGORIES:
${PROMPT_FRAGMENTS.tagCatalog}

RECIPE TEXT:
${text}`,
  });

  return {
    ...result.object,
    tags: normalizeTags(result.object.tags ?? []),
  };
}
