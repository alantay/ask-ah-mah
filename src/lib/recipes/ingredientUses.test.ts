import { ingredientsToUses } from "./ingredientUses";

describe("ingredientsToUses", () => {
  it("stringifies a numeric amount (RecipeIngredient shape)", () => {
    expect(ingredientsToUses([{ name: "glutinous rice", amount: 2, unit: "cups" }])).toEqual([
      { name: "glutinous rice", amount: "2", unit: "cups" },
    ]);
  });

  it("passes through a string amount as-is (RecipeIngredientModel shape)", () => {
    expect(ingredientsToUses([{ name: "ginger", amount: "1 1/2", unit: "tbsp" }])).toEqual([
      { name: "ginger", amount: "1 1/2", unit: "tbsp" },
    ]);
  });

  it("maps a missing amount to undefined, not a stringified 'undefined'", () => {
    expect(ingredientsToUses([{ name: "salt" }])).toEqual([
      { name: "salt", amount: undefined, unit: undefined },
    ]);
  });

  it("preserves order and maps every ingredient", () => {
    const uses = ingredientsToUses([
      { name: "garlic", amount: 3 },
      { name: "spring onion" },
    ]);
    expect(uses.map((u) => u.name)).toEqual(["garlic", "spring onion"]);
  });
});
