import { isStockable } from "./stockable";

describe("isStockable", () => {
  it("treats water as unstockable in the forms a recipe writes it", () => {
    for (const name of [
      "water",
      "Water",
      "cold water",
      "hot water",
      "boiling water",
      "ice water",
      "room temperature water",
      "250 ml water",
    ])
      expect(isStockable(name)).toBe(false);
  });

  it("keeps a qualified water that is a different ingredient", () => {
    for (const name of ["coconut water", "rose water", "tamarind water"])
      expect(isStockable(name)).toBe(true);
  });

  it("keeps the stockable assumed staples — they are pantry rows, not exceptions", () => {
    for (const name of ["salt", "black pepper", "white pepper", "cooking oil"])
      expect(isStockable(name)).toBe(true);
  });

  it("keeps an ordinary ingredient, and a name that tokenizes to nothing", () => {
    expect(isStockable("chicken thigh")).toBe(true);
    expect(isStockable("500 g")).toBe(true);
  });
});
