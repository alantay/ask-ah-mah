import { ingredientMatches } from "./matchIngredient";

describe("ingredientMatches", () => {
  it("matches the real doubanjiang bug from the screenshot", () => {
    expect(
      ingredientMatches("doubanjiang (fermented bean paste)", [
        "Doubanjiang (fermented chili bean paste)",
      ]),
    ).toBe(true);
  });

  it("matches green bell pepper against bell pepper", () => {
    expect(ingredientMatches("green bell pepper", ["bell pepper"])).toBe(true);
  });

  it("matches pork belly slices against parenthetical variant", () => {
    expect(
      ingredientMatches("pork belly slices", [
        "Pork belly slices (sukiyaki thin)",
      ]),
    ).toBe(true);
  });

  it("matches olive oil against generic oil", () => {
    expect(ingredientMatches("olive oil", ["oil"])).toBe(true);
  });

  it("does not match scallion against green onion (known synonym limitation)", () => {
    expect(ingredientMatches("scallion", ["green onion"])).toBe(false);
  });

  it("returns false for empty ingredient name", () => {
    expect(ingredientMatches("", ["garlic"])).toBe(false);
  });

  it("returns false when ingredient is stopwords only", () => {
    expect(ingredientMatches("fresh whole", ["garlic", "ginger"])).toBe(false);
  });

  it("returns false when no inventory match exists", () => {
    expect(ingredientMatches("star anise", ["garlic", "ginger", "soy sauce"])).toBe(false);
  });

  it("matches case-insensitively", () => {
    expect(ingredientMatches("GARLIC", ["garlic"])).toBe(true);
  });

  it("matches in reverse direction (inventory name contained in ingredient)", () => {
    expect(ingredientMatches("sea salt", ["salt"])).toBe(true);
  });

  it("strips stopword modifiers before matching", () => {
    expect(ingredientMatches("fresh ginger", ["ginger"])).toBe(true);
    expect(ingredientMatches("ground pepper", ["pepper"])).toBe(true);
  });
});
