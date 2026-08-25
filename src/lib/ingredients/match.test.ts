import { ingredientMatches } from "./match";

describe("ingredientMatches", () => {
  it("matches a parenthetical variant of the same item", () => {
    expect(
      ingredientMatches("doubanjiang (fermented bean paste)", [
        "Doubanjiang (fermented chili bean paste)",
      ]),
    ).toBe(true);
  });

  it("matches when the pantry holds a generic the recipe specialises", () => {
    expect(ingredientMatches("green bell pepper", ["bell pepper"])).toBe(true);
    expect(ingredientMatches("olive oil", ["oil"])).toBe(true);
    expect(ingredientMatches("sea salt", ["salt"])).toBe(true);
  });

  it("matches through prep words and units", () => {
    expect(ingredientMatches("fresh ginger", ["ginger"])).toBe(true);
    expect(ingredientMatches("ground pepper", ["pepper"])).toBe(true);
    expect(ingredientMatches("garlic cloves", ["Garlic"])).toBe(true);
    expect(
      ingredientMatches("pork belly slices", ["Pork belly slices (sukiyaki thin)"]),
    ).toBe(true);
  });

  it("matches case-insensitively", () => {
    expect(ingredientMatches("GARLIC", ["garlic"])).toBe(true);
  });

  // #491: a shared trailing token is not a match.
  it("does not match on a shared head noun alone", () => {
    expect(ingredientMatches("dark soy sauce", ["fish sauce"])).toBe(false);
    expect(ingredientMatches("oyster sauce", ["Soy sauce"])).toBe(false);
  });

  // #491: a shared leading token is not a match either.
  it("does not match when the head nouns differ", () => {
    expect(ingredientMatches("rice noodles", ["rice"])).toBe(false);
    expect(ingredientMatches("rice vinegar", ["Rice"])).toBe(false);
  });

  it("matches against the seeded default pantry", () => {
    expect(ingredientMatches("vegetable oil", ["Cooking oil"])).toBe(true);
    expect(ingredientMatches("sesame oil", ["Cooking oil", "Salt", "Soy sauce"])).toBe(true);
    expect(ingredientMatches("light soy sauce", ["Soy sauce"])).toBe(true);
  });

  it("does not match synonyms (known limitation)", () => {
    expect(ingredientMatches("scallion", ["green onion"])).toBe(false);
  });

  it("returns false for an empty or prep-only ingredient name", () => {
    expect(ingredientMatches("", ["garlic"])).toBe(false);
    expect(ingredientMatches("fresh whole", ["garlic", "ginger"])).toBe(false);
  });

  it("returns false when no inventory match exists", () => {
    expect(ingredientMatches("star anise", ["garlic", "ginger", "soy sauce"])).toBe(false);
  });
});
