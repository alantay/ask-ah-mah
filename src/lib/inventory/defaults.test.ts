import { ingredientMatches } from "@/lib/ingredients";
import { DEFAULT_INVENTORY } from "./defaults";

const seeded = DEFAULT_INVENTORY.map((i) => i.name);

// The seed carries the assumed staples so the UI needs no free-staple
// exception for them (#490). `ingredientMatches` is coverage, not identity, so
// what matters is what the seeded rows do and do not reach.
describe("DEFAULT_INVENTORY covers the assumed staples", () => {
  it("covers salt and cooking oil as a recipe writes them", () => {
    for (const name of ["salt", "sea salt", "cooking oil", "neutral oil"])
      expect(ingredientMatches(name, seeded)).toBe(true);
  });

  it("covers pepper in both colours", () => {
    for (const name of ["pepper", "black pepper", "white pepper", "ground white pepper"])
      expect(ingredientMatches(name, seeded)).toBe(true);
  });

  it("does not reach bell pepper — the reason pepper is seeded as two rows", () => {
    for (const name of ["bell pepper", "red bell pepper"])
      expect(ingredientMatches(name, seeded)).toBe(false);
  });

  it("does not pretend to stock water", () => {
    expect(ingredientMatches("water", seeded)).toBe(false);
  });
});
