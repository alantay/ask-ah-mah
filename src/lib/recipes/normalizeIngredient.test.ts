import { normalizeIngredient } from "./normalizeIngredient";

describe("normalizeIngredient", () => {
  it("parses a valid numeric string amount", () => {
    const result = normalizeIngredient({ name: "flour", amount: "200", unit: "g" });
    expect(result.amount).toBe(200);
  });

  it("returns undefined amount when string is not a number", () => {
    const result = normalizeIngredient({ name: "salt", amount: "to taste" });
    expect(result.amount).toBeUndefined();
  });

  it("returns undefined amount when amount is undefined", () => {
    const result = normalizeIngredient({ name: "pepper" });
    expect(result.amount).toBeUndefined();
  });

  it("defaults category to Misc when omitted", () => {
    const result = normalizeIngredient({ name: "egg" });
    expect(result.category).toBe("Misc");
  });

  it("preserves an explicit category", () => {
    const result = normalizeIngredient({ name: "chicken", category: "Protein" });
    expect(result.category).toBe("Protein");
  });

  it("passes through name, unit, and note unchanged", () => {
    const result = normalizeIngredient({ name: "oil", unit: "tbsp", note: "extra virgin" });
    expect(result.name).toBe("oil");
    expect(result.unit).toBe("tbsp");
    expect(result.note).toBe("extra virgin");
  });

  it("handles decimal string amounts", () => {
    const result = normalizeIngredient({ name: "butter", amount: "1.5", unit: "tbsp" });
    expect(result.amount).toBe(1.5);
  });
});
