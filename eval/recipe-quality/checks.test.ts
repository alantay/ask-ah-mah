import type { RecipeBlock } from "@/lib/recipes/schemas";
import {
  evaluateRecipe,
  evaluateRecipeOutput,
  missingRecipeEvaluation,
} from "./checks";
import type { RecipeBenchmarkCase } from "./types";

const benchmarkCase: RecipeBenchmarkCase = {
  id: "test-recipe",
  category: "test",
  prompt: "Make a test recipe",
  inventory: { ingredients: [], kitchenware: [] },
  reviewFocus: "Test focus",
  requiredIngredients: [{ label: "tofu", anyOf: ["tofu"] }],
  forbiddenIngredients: [{ label: "cream", anyOf: ["cream"] }],
  requiredText: [{ label: "doneness cue", pattern: /golden/i }],
  forbiddenText: [{ label: "deep frying", pattern: /deep[- ]fry/i }],
};

const validRecipe: RecipeBlock = {
  title: "Golden Tofu",
  description: "Crisp-edged tofu with a savoury glaze.",
  totalTimeMinutes: 25,
  baseServings: 2,
  ingredients: [
    { name: "firm tofu", category: "Protein", amount: "400", unit: "g" },
    { name: "soy sauce", category: "Condiments", amount: "1", unit: "tbsp" },
  ],
  prep: ["Pat the tofu dry and cut it into cubes"],
  steps: [
    {
      title: "Brown the tofu",
      body: "Cook the tofu until the edges are golden, then add the soy sauce.",
      uses: [
        { name: "firm tofu", amount: "400", unit: "g" },
        { name: "soy sauce", amount: "1", unit: "tbsp" },
      ],
    },
  ],
  notes: [],
  tags: ["asian", "tofu", "fried"],
};

describe("evaluateRecipe", () => {
  it("passes a structurally sound recipe and case-specific expectations", () => {
    const result = evaluateRecipe(validRecipe, benchmarkCase);

    expect(result.hardPassed).toBe(result.hardTotal);
    expect(result.checks.find((check) => check.id === "required-ingredient:tofu"))
      .toMatchObject({ passed: true });
  });

  it("reports invalid uses, quantities in prose, and forbidden ingredients", () => {
    const result = evaluateRecipe(
      {
        ...validRecipe,
        ingredients: [
          ...validRecipe.ingredients,
          { name: "cream", category: "Misc", amount: "2", unit: "tbsp" },
        ],
        steps: [
          {
            title: "Cook",
            body: "Deep-fry the tofu in 2 tbsp oil until golden.",
            uses: [{ name: "tofu", amount: "400", unit: "g" }],
          },
        ],
      },
      benchmarkCase,
    );

    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "valid-step-uses", passed: false }),
        expect.objectContaining({
          id: "no-absolute-quantities-in-bodies",
          passed: false,
        }),
        expect.objectContaining({ id: "forbidden-ingredient:cream", passed: false }),
        expect.objectContaining({ id: "forbidden-text:deep frying", passed: false }),
      ]),
    );
  });

  it.each(["400 grams", "1 liter", "500 millilitres", "8 ounces", "2 lbs", "1 pound"])(
    "catches a quantity spelled out in full: %s",
    (quantity) => {
      const result = evaluateRecipe(
        {
          ...validRecipe,
          steps: [{ ...validRecipe.steps[0], body: `Add ${quantity} of the tofu.` }],
        },
        benchmarkCase,
      );

      expect(result.checks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "no-absolute-quantities-in-bodies", passed: false }),
        ]),
      );
    },
  );

  it("marks a missing recipe block as a hard failure", () => {
    const result = missingRecipeEvaluation();

    expect(result).toMatchObject({ hardPassed: 0, hardTotal: 1 });
  });

  it("requires exactly one valid fenced recipe block", () => {
    const block = `\`\`\`recipe\n${JSON.stringify(validRecipe)}\n\`\`\``;
    const result = evaluateRecipeOutput(`${block}\n${block}`, benchmarkCase);

    expect(result.recipe).toEqual(validRecipe);
    expect(result.evaluation.checks.find((check) => check.id === "recipe-block"))
      .toMatchObject({ passed: false, detail: "2 recipe blocks emitted" });
  });
});
