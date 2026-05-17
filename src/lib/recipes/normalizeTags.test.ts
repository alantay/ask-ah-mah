import { normalizeTags } from "./normalizeTags";

describe("normalizeTags", () => {
  it("passes through valid canonical tags", () => {
    expect(normalizeTags(["pork", "stir-fried", "spicy"])).toEqual(["pork", "stir-fried", "spicy"]);
  });

  it("maps known synonyms to canonical form", () => {
    expect(normalizeTags(["stir-fry"])).toEqual(["stir-fried"]);
    expect(normalizeTags(["braise"])).toEqual(["braised"]);
    expect(normalizeTags(["pressure-cooker"])).toEqual(["pressure-cooked"]);
    expect(normalizeTags(["quick"])).toEqual(["quick (under 30 min)"]);
    expect(normalizeTags(["comfort food"])).toEqual(["comfort"]);
  });

  it("maps equipment terms to their method equivalents", () => {
    expect(normalizeTags(["wok"])).toEqual(["stir-fried"]);
    expect(normalizeTags(["instant-pot"])).toEqual(["pressure-cooked"]);
    expect(normalizeTags(["slow-cooker"])).toEqual(["slow-cooked"]);
    expect(normalizeTags(["grill"])).toEqual(["grilled"]);
    expect(normalizeTags(["blender"])).toEqual(["blended"]);
  });

  it("maps tortilla and wrap to bread", () => {
    expect(normalizeTags(["tortilla", "wrap"])).toEqual(["bread"]);
  });

  it("maps minced/ground protein variants to canonical protein", () => {
    expect(normalizeTags(["minced-beef"])).toEqual(["beef"]);
    expect(normalizeTags(["ground-beef"])).toEqual(["beef"]);
    expect(normalizeTags(["minced-pork", "ground-pork"])).toEqual(["pork"]);
    expect(normalizeTags(["minced-chicken", "ground-chicken"])).toEqual(["chicken"]);
  });

  it("maps one-pan to one-pot", () => {
    expect(normalizeTags(["one-pan"])).toEqual(["one-pot"]);
  });

  it("real-world regression: Mexican Minced Beef Tortilla Wraps", () => {
    expect(normalizeTags(["mexican", "tortilla", "wrap", "minced-beef", "one-pan"]))
      .toEqual(["mexican", "bread", "beef", "one-pot"]);
  });

  it("drops tags in the DROP list", () => {
    expect(normalizeTags(["onion", "protein", "budget"])).toEqual([]);
    expect(normalizeTags(["vegetarian", "vegan"])).toEqual([]);
    expect(normalizeTags(["beginner", "intermediate", "advanced"])).toEqual([]);
    expect(normalizeTags(["cast-iron"])).toEqual([]);
  });

  it("keeps rice as a valid main tag (no longer dropped)", () => {
    expect(normalizeTags(["rice"])).toEqual(["rice"]);
  });

  it("drops tags not in TAG_SETS (off-vocab)", () => {
    expect(normalizeTags(["numbing-heat", "fusion-whatever"])).toEqual([]);
  });

  it("deduplicates — keeps first occurrence", () => {
    expect(normalizeTags(["pork", "pork", "stir-fry", "stir-fried"])).toEqual(["pork", "stir-fried"]);
  });

  it("is case-insensitive", () => {
    expect(normalizeTags(["Pork", "STIR-FRY", "Spicy"])).toEqual(["pork", "stir-fried", "spicy"]);
  });

  it("returns empty array for empty input", () => {
    expect(normalizeTags([])).toEqual([]);
  });

  it("accepts new main category tags (bases)", () => {
    expect(normalizeTags(["rice", "noodle", "pasta", "bread", "dumpling", "pancake"]))
      .toEqual(["rice", "noodle", "pasta", "bread", "dumpling", "pancake"]);
  });

  it("accepts new method tag: blended", () => {
    expect(normalizeTags(["blended"])).toEqual(["blended"]);
  });

  it("accepts new effort tag: oven-free", () => {
    expect(normalizeTags(["oven-free"])).toEqual(["oven-free"]);
  });
});
