import { groupByAisle, toAisle } from "./aisle";

describe("toAisle", () => {
  it("maps each Pantry storage category to its shopping aisle", () => {
    expect(toAisle("Vegetable")).toBe("Produce");
    expect(toAisle("Protein")).toBe("Meat & Seafood");
    expect(toAisle("Carbs")).toBe("Rice & Noodles");
    expect(toAisle("Condiments")).toBe("Sauces & Seasoning");
    expect(toAisle("Spice")).toBe("Sauces & Seasoning");
    expect(toAisle("Misc")).toBe("Other");
  });

  it("passes an already-aisle value through unchanged", () => {
    expect(toAisle("Produce")).toBe("Produce");
    expect(toAisle("Sauces & Seasoning")).toBe("Sauces & Seasoning");
  });

  it("treats a null or unknown category as Other (pending classification)", () => {
    expect(toAisle(null)).toBe("Other");
    expect(toAisle(undefined)).toBe("Other");
    expect(toAisle("Fruit")).toBe("Other");
  });

  it("is case-insensitive on the incoming category", () => {
    expect(toAisle("vegetable")).toBe("Produce");
    expect(toAisle("PROTEIN")).toBe("Meat & Seafood");
  });
});

describe("groupByAisle", () => {
  const row = (name: string, category?: string | null) => ({ name, category });

  it("returns aisles in the fixed market-walk order, with Other last", () => {
    const groups = groupByAisle([
      row("salt", "Spice"), // Sauces & Seasoning
      row("rice", "Carbs"), // Rice & Noodles
      row("apple"), // Other (uncategorised)
      row("kailan", "Vegetable"), // Produce
      row("pork", "Protein"), // Meat & Seafood
    ]);

    expect(groups.map((g) => g.aisle)).toEqual([
      "Produce",
      "Meat & Seafood",
      "Rice & Noodles",
      "Sauces & Seasoning",
      "Other",
    ]);
  });

  it("omits aisles that have no items", () => {
    const groups = groupByAisle([row("apple", "Vegetable"), row("pork", "Protein")]);
    expect(groups.map((g) => g.aisle)).toEqual(["Produce", "Meat & Seafood"]);
  });

  it("preserves the incoming order of items within an aisle", () => {
    const groups = groupByAisle([
      row("kailan", "Vegetable"),
      row("tomato", "Vegetable"),
      row("onion", "Vegetable"),
    ]);
    expect(groups[0].items.map((i) => i.name)).toEqual([
      "kailan",
      "tomato",
      "onion",
    ]);
  });

  it("groups uncategorised and Misc items together under Other", () => {
    const groups = groupByAisle([row("apple"), row("foil", "Misc")]);
    expect(groups).toHaveLength(1);
    expect(groups[0].aisle).toBe("Other");
    expect(groups[0].items.map((i) => i.name)).toEqual(["apple", "foil"]);
  });

  it("returns no groups for an empty list", () => {
    expect(groupByAisle([])).toEqual([]);
  });
});
