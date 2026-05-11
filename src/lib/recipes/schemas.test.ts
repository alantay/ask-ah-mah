import { RecipeIngredientModelSchema, RecipeIngredientSchema } from "./schemas";

describe("recipe ingredient schemas", () => {
  it("requires category on recipe model ingredients", () => {
    expect(() =>
      RecipeIngredientModelSchema.parse({
        name: "chicken thigh",
        amount: "500",
        unit: "g",
      }),
    ).toThrow();
  });

  it("requires category on persisted recipe ingredients", () => {
    expect(() =>
      RecipeIngredientSchema.parse({
        name: "chicken thigh",
        amount: 500,
        unit: "g",
      }),
    ).toThrow();
  });

  it("rejects unknown category values", () => {
    expect(() =>
      RecipeIngredientModelSchema.parse({
        name: "chicken thigh",
        category: "Fruit",
      }),
    ).toThrow();
  });
});
