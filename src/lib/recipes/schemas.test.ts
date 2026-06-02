import {
  ChangeEntrySchema,
  RecipeIngredientModelSchema,
  RecipeIngredientSchema,
  TweakResponseSchema,
} from "./schemas";

describe("recipe ingredient schemas", () => {
  it("allows missing category on recipe model ingredients", () => {
    expect(() =>
      RecipeIngredientModelSchema.parse({
        name: "chicken thigh",
        amount: "500",
        unit: "g",
      }),
    ).not.toThrow();
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

describe("change entry ref tolerance", () => {
  // The model sometimes locates a prep change with `ref.type: "prep"`, which is
  // outside the ingredient/step locator vocabulary. A malformed ref must not
  // discard the change — it should drop to `undefined` (no row highlight).
  it("drops a malformed ref instead of failing the change entry", () => {
    const parsed = ChangeEntrySchema.parse({
      kind: "prep_updated",
      ref: { type: "prep", index: 0, basis: "workingDraft" },
      label: "Updated prep for canned trotters",
    });

    expect(parsed.ref).toBeUndefined();
    expect(parsed.label).toBe("Updated prep for canned trotters");
  });

  it("accepts a whole tweak response containing a prep-located change", () => {
    const result = TweakResponseSchema.safeParse({
      recipe: {
        title: "Pig Trotter Bee Hoon",
        baseServings: 4,
        ingredients: [{ name: "pig trotters", category: "Protein", amount: "1", unit: "kg" }],
        steps: [{ title: "Braise", body: "Simmer until tender." }],
      },
      changes: [
        { kind: "ingredient_changed", ref: { type: "ingredient", index: 0, basis: "workingDraft" }, label: "Swapped to canned" },
        { kind: "prep_updated", ref: { type: "prep", index: 0, basis: "workingDraft" }, label: "Updated prep" },
      ],
    });

    expect(result.success).toBe(true);
  });
});
