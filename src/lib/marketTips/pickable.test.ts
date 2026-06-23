import { isPickableCategory } from "./pickable";

describe("isPickableCategory", () => {
  it("treats fresh categories as pickable", () => {
    expect(isPickableCategory("Vegetable")).toBe(true);
    expect(isPickableCategory("Protein")).toBe(true);
    expect(isPickableCategory("Misc")).toBe(true);
  });

  it("treats dry-goods categories as not pickable", () => {
    expect(isPickableCategory("Carbs")).toBe(false);
    expect(isPickableCategory("Condiments")).toBe(false);
    expect(isPickableCategory("Spice")).toBe(false);
  });

  it("defaults unknown/empty category to pickable (model decides)", () => {
    expect(isPickableCategory(undefined)).toBe(true);
    expect(isPickableCategory(null)).toBe(true);
  });
});
