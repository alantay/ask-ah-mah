import { TAG_SETS } from "@/lib/recipes/tagColors";
import { extractRecipeBlocks } from "@/lib/recipes/parseBlocks";
import type { RecipeBlock } from "@/lib/recipes/schemas";
import type {
  CheckResult,
  IngredientExpectation,
  RecipeBenchmarkCase,
  RecipeEvaluation,
  TextExpectation,
} from "./types";

const VALID_TAGS = new Set(Object.values(TAG_SETS).flat());
const ABSOLUTE_QUANTITY_PATTERN =
  /\b(?:\d+(?:\.\d+)?|\d+\s*\/\s*\d+|[¼½¾⅓⅔⅛⅜⅝⅞])\s*(?:g|kg|ml|l|oz|lb|cups?|tbsp|tsp|tablespoons?|teaspoons?|cloves?|pieces?|slices?|cans?|packs?|bunch(?:es)?)\b/i;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function ingredientMatchesAlias(ingredientName: string, alias: string): boolean {
  const ingredient = normalize(ingredientName);
  const expected = normalize(alias);
  return ingredient === expected || ingredient.includes(expected) || expected.includes(ingredient);
}

function hasExpectedIngredient(
  ingredientNames: string[],
  expectation: IngredientExpectation,
): boolean {
  return expectation.anyOf.some((alias) =>
    ingredientNames.some((name) => ingredientMatchesAlias(name, alias)),
  );
}

function recipeText(recipe: RecipeBlock): string {
  return [
    recipe.title,
    recipe.description ?? "",
    ...(recipe.prep ?? []),
    ...recipe.steps.flatMap((step) => [step.title, step.body, step.tip ?? ""]),
    ...(recipe.notes ?? []),
  ].join("\n");
}

function checkTextExpectation(
  expectation: TextExpectation,
  text: string,
  shouldMatch: boolean,
): CheckResult {
  expectation.pattern.lastIndex = 0;
  const matched = expectation.pattern.test(text);
  return {
    id: `${shouldMatch ? "required" : "forbidden"}-text:${expectation.label}`,
    label: `${shouldMatch ? "Includes" : "Avoids"}: ${expectation.label}`,
    passed: shouldMatch ? matched : !matched,
    severity: "error",
  };
}

function ingredientReferenceWarnings(recipe: RecipeBlock): CheckResult[] {
  const instructions = normalize(
    [
      ...(recipe.prep ?? []),
      ...recipe.steps.flatMap((step) => [step.title, step.body, step.tip ?? ""]),
    ].join(" "),
  );

  return recipe.ingredients.map((ingredient) => {
    const normalizedName = normalize(ingredient.name);
    const head = normalizedName.split(" ").at(-1) ?? normalizedName;
    const referenced =
      instructions.includes(normalizedName) ||
      (head.length >= 4 && instructions.split(" ").includes(head));

    return {
      id: `ingredient-reference:${normalizedName}`,
      label: `Ingredient appears in prep or steps: ${ingredient.name}`,
      passed: referenced,
      severity: "warning",
      detail: referenced
        ? undefined
        : "May be covered by a generic phrase such as “the sauce”; review manually.",
    };
  });
}

export function missingRecipeEvaluation(): RecipeEvaluation {
  return summarizeChecks([
    {
      id: "recipe-block",
      label: "Emits one valid recipe block",
      passed: false,
      severity: "error",
    },
  ]);
}

export function evaluateRecipeOutput(
  outputText: string,
  benchmarkCase: RecipeBenchmarkCase,
): { recipe?: RecipeBlock; evaluation: RecipeEvaluation } {
  const recipeBlocks = extractRecipeBlocks(outputText).filter(
    (block) => block.kind === "recipe",
  );
  const firstRecipe = recipeBlocks[0];
  if (!firstRecipe || firstRecipe.kind !== "recipe") {
    return { evaluation: missingRecipeEvaluation() };
  }

  const evaluation = evaluateRecipe(firstRecipe.payload, benchmarkCase);
  const blockCheck = evaluation.checks.find((check) => check.id === "recipe-block");
  if (blockCheck) {
    blockCheck.passed = recipeBlocks.length === 1;
    blockCheck.detail =
      recipeBlocks.length === 1 ? undefined : `${recipeBlocks.length} recipe blocks emitted`;
  }

  return {
    recipe: firstRecipe.payload,
    evaluation: summarizeChecks(evaluation.checks),
  };
}

export function evaluateRecipe(
  recipe: RecipeBlock,
  benchmarkCase: RecipeBenchmarkCase,
): RecipeEvaluation {
  const checks: CheckResult[] = [];
  const ingredientNames = recipe.ingredients.map((ingredient) => ingredient.name);
  const normalizedIngredientNames = ingredientNames.map(normalize);
  const text = recipeText(recipe);

  checks.push({
    id: "recipe-block",
    label: "Emits one valid recipe block",
    passed: true,
    severity: "error",
  });
  checks.push({
    id: "description-length",
    label: "Description is at most 140 characters",
    passed: (recipe.description?.length ?? 0) <= 140,
    severity: "error",
    detail:
      (recipe.description?.length ?? 0) > 140
        ? `${recipe.description?.length} characters`
        : undefined,
  });
  checks.push({
    id: "prep-count",
    label: "Prep contains at most eight actions",
    passed: (recipe.prep?.length ?? 0) <= 8,
    severity: "error",
  });
  checks.push({
    id: "notes-count",
    label: "Notes contain at most four asides",
    passed: (recipe.notes?.length ?? 0) <= 4,
    severity: "error",
  });
  checks.push({
    id: "tag-count",
    label: "Recipe has three to six tags",
    passed: (recipe.tags?.length ?? 0) >= 3 && (recipe.tags?.length ?? 0) <= 6,
    severity: "error",
    detail: `${recipe.tags?.length ?? 0} tags`,
  });

  const invalidTags = (recipe.tags ?? []).filter((tag) => !VALID_TAGS.has(tag));
  checks.push({
    id: "valid-tags",
    label: "Every tag comes from the product catalog",
    passed: invalidTags.length === 0,
    severity: "error",
    detail: invalidTags.length > 0 ? `Invalid: ${invalidTags.join(", ")}` : undefined,
  });

  const duplicateIngredients = normalizedIngredientNames.filter(
    (name, index) => normalizedIngredientNames.indexOf(name) !== index,
  );
  checks.push({
    id: "unique-ingredients",
    label: "Ingredient names are unique",
    passed: duplicateIngredients.length === 0,
    severity: "error",
    detail:
      duplicateIngredients.length > 0
        ? `Duplicates: ${[...new Set(duplicateIngredients)].join(", ")}`
        : undefined,
  });

  const invalidUses = recipe.steps.flatMap((step, stepIndex) =>
    (step.uses ?? [])
      .filter(
        (use) =>
          !normalizedIngredientNames.includes(normalize(use.name)),
      )
      .map((use) => `step ${stepIndex + 1}: ${use.name}`),
  );
  checks.push({
    id: "valid-step-uses",
    label: "Every step use matches an ingredient name exactly",
    passed: invalidUses.length === 0,
    severity: "error",
    detail: invalidUses.length > 0 ? `Unknown: ${invalidUses.join(", ")}` : undefined,
  });

  const bodiesWithQuantities = recipe.steps
    .map((step, index) => ({ body: step.body, step: index + 1 }))
    .filter(({ body }) => ABSOLUTE_QUANTITY_PATTERN.test(body));
  checks.push({
    id: "no-absolute-quantities-in-bodies",
    label: "Step bodies do not bake in scalable quantities",
    passed: bodiesWithQuantities.length === 0,
    severity: "error",
    detail:
      bodiesWithQuantities.length > 0
        ? `Found in step${bodiesWithQuantities.length === 1 ? "" : "s"} ${bodiesWithQuantities
            .map(({ step }) => step)
            .join(", ")}`
        : undefined,
  });

  for (const expectation of benchmarkCase.requiredIngredients ?? []) {
    checks.push({
      id: `required-ingredient:${expectation.label}`,
      label: `Includes required ingredient: ${expectation.label}`,
      passed: hasExpectedIngredient(ingredientNames, expectation),
      severity: "error",
    });
  }

  for (const expectation of benchmarkCase.forbiddenIngredients ?? []) {
    checks.push({
      id: `forbidden-ingredient:${expectation.label}`,
      label: `Avoids forbidden ingredient: ${expectation.label}`,
      passed: !hasExpectedIngredient(ingredientNames, expectation),
      severity: "error",
    });
  }

  checks.push(
    ...(benchmarkCase.requiredText ?? []).map((expectation) =>
      checkTextExpectation(expectation, text, true),
    ),
    ...(benchmarkCase.forbiddenText ?? []).map((expectation) =>
      checkTextExpectation(expectation, text, false),
    ),
  );

  checks.push(...ingredientReferenceWarnings(recipe));
  return summarizeChecks(checks);
}

export function summarizeChecks(checks: CheckResult[]): RecipeEvaluation {
  const hardChecks = checks.filter((check) => check.severity === "error");
  const warningChecks = checks.filter((check) => check.severity === "warning");
  return {
    checks,
    hardPassed: hardChecks.filter((check) => check.passed).length,
    hardTotal: hardChecks.length,
    warningPassed: warningChecks.filter((check) => check.passed).length,
    warningTotal: warningChecks.length,
  };
}
