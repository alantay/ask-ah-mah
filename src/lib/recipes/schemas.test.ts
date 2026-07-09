import {
  applyTweakPatch,
  ChangeEntrySchema,
  type RecipeBlock,
  RecipeBlockSchema,
  recipeBlockToRecipeWithId,
  RecipeIngredientModelSchema,
  RecipeIngredientSchema,
  type RecipeWithId,
  recipeWithIdToBlock,
  TweakPatchSchema,
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

  it("accepts a tweak patch containing a prep-located change", () => {
    const result = TweakPatchSchema.safeParse({
      ingredients: [{ name: "pig trotters", category: "Protein", amount: "1", unit: "kg" }],
      changes: [
        { kind: "ingredient_changed", ref: { type: "ingredient", index: 0, basis: "workingDraft" }, label: "Swapped to canned" },
        { kind: "prep_updated", ref: { type: "prep", index: 0, basis: "workingDraft" }, label: "Updated prep" },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe("TweakPatchSchema", () => {
  it("treats every recipe field as optional but requires `changes`", () => {
    expect(TweakPatchSchema.safeParse({ changes: [] }).success).toBe(true);
    expect(TweakPatchSchema.safeParse({ title: "New title" }).success).toBe(false);
  });
});

describe("applyTweakPatch", () => {
  const base: RecipeBlock = {
    title: "Mapo Tofu",
    description: "Numbing and spicy.",
    baseServings: 2,
    totalTimeMinutes: 30,
    ingredients: [
      { name: "tofu", category: "Misc", amount: "300", unit: "g" },
      { name: "doubanjiang", category: "Misc", amount: "2", unit: "tbsp" },
    ],
    prep: ["Cube the tofu"],
    steps: [{ title: "Fry", body: "Fry the aromatics." }],
    tags: ["spicy", "sichuan"],
  };

  it("replaces only the fields present in the patch, keeping the rest", () => {
    const next = applyTweakPatch(base, {
      title: "Milder Mapo Tofu",
      changes: [],
    });

    expect(next.title).toBe("Milder Mapo Tofu");
    expect(next.ingredients).toEqual(base.ingredients); // untouched
    expect(next.steps).toEqual(base.steps);
    expect(next.tags).toEqual(base.tags);
  });

  it("replaces an array wholesale when the patch carries it", () => {
    const next = applyTweakPatch(base, {
      ingredients: [{ name: "silken tofu", category: "Misc", amount: "300", unit: "g" }],
      changes: [],
    });

    expect(next.ingredients).toHaveLength(1);
    expect(next.ingredients[0].name).toBe("silken tofu");
    expect(next.title).toBe(base.title); // scalar untouched
  });

  it("clears an array when the patch sends an empty array (present, not absent)", () => {
    const next = applyTweakPatch(base, { tags: [], changes: [] });
    expect(next.tags).toEqual([]);
  });

  it("keeps a field when its key is absent (omission ≠ clearing)", () => {
    const next = applyTweakPatch(base, { changes: [] });
    expect(next.tags).toEqual(base.tags);
    expect(next.prep).toEqual(base.prep);
  });

  it("does not leak `changes` onto the merged recipe", () => {
    const next = applyTweakPatch(base, {
      changes: [{ kind: "title_updated", label: "x" }],
    });
    expect(next).not.toHaveProperty("changes");
  });

  it("does not mutate the working draft", () => {
    const snapshot = JSON.parse(JSON.stringify(base));
    applyTweakPatch(base, { ingredients: [], changes: [] });
    expect(base).toEqual(snapshot);
  });

  // notes are not part of TweakPatchSchema (non-tweakable in v1), so a tweak
  // must carry them through untouched rather than dropping them.
  it("preserves notes across a tweak that does not mention them", () => {
    const withNotes: RecipeBlock = { ...base, notes: ["Keeps 3 days; freezes well."] };
    const next = applyTweakPatch(withNotes, { title: "Milder Mapo Tofu", changes: [] });
    expect(next.notes).toEqual(["Keeps 3 days; freezes well."]);
  });
});

describe("recipe notes", () => {
  it("accepts an optional notes array on the recipe block", () => {
    const parsed = RecipeBlockSchema.parse({
      title: "Shakshuka",
      baseServings: 2,
      ingredients: [{ name: "egg", category: "Protein", amount: "4" }],
      steps: [{ title: "Poach", body: "Crack eggs into the sauce." }],
      notes: ["Make-ahead: the sauce keeps 3 days.", "Serve with crusty bread."],
    });
    expect(parsed.notes).toHaveLength(2);
  });

  it("round-trips notes through both converters", () => {
    const block = {
      title: "Shakshuka",
      baseServings: 2,
      ingredients: [{ name: "egg", category: "Protein" as const, amount: "4" }],
      steps: [{ title: "Poach", body: "Crack eggs into the sauce." }],
      notes: ["Freezes well."],
    };
    const base = { id: "r1", userId: "u1" } as RecipeWithId;
    const withId = recipeBlockToRecipeWithId(block, base);
    expect(withId.notes).toEqual(["Freezes well."]);
    expect(recipeWithIdToBlock(withId).notes).toEqual(["Freezes well."]);
  });
});

describe("recipeWithIdToBlock null coercion", () => {
  // DB columns are nullable, but RecipeBlockSchema's optional fields reject
  // `null` (only `undefined`) — so a bare pass-through breaks re-parsing a
  // fetched recipe (e.g. the "I made this" PATCH round-trip).
  it("coerces null description/totalTimeMinutes to undefined so the block re-parses", () => {
    const withId = {
      id: "r1",
      userId: "u1",
      name: "Shakshuka",
      description: null,
      totalTimeMinutes: null,
      baseServings: 2,
      ingredients: [],
      steps: [],
    } as unknown as RecipeWithId;

    const block = recipeWithIdToBlock(withId);
    expect(block.description).toBeUndefined();
    expect(block.totalTimeMinutes).toBeUndefined();
    expect(RecipeBlockSchema.safeParse(block).success).toBe(true);
  });
});

describe("cooked marker", () => {
  const minimalBlock = {
    title: "Shakshuka",
    baseServings: 2,
    ingredients: [{ name: "egg", category: "Protein" as const, amount: "4" }],
    steps: [{ title: "Poach", body: "Crack eggs into the sauce." }],
  };

  it("accepts a recipe block without cooked", () => {
    const parsed = RecipeBlockSchema.parse(minimalBlock);
    expect(parsed.cooked).toBeUndefined();
  });

  it("accepts a recipe block with cooked: true", () => {
    const parsed = RecipeBlockSchema.parse({ ...minimalBlock, cooked: true });
    expect(parsed.cooked).toBe(true);
  });

  it("round-trips cooked through both converters", () => {
    const base = { id: "r1", userId: "u1" } as RecipeWithId;
    const withId = recipeBlockToRecipeWithId({ ...minimalBlock, cooked: true }, base);
    expect(withId.cooked).toBe(true);
    expect(recipeWithIdToBlock(withId).cooked).toBe(true);
  });
});
