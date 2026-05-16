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

  it("drops tags in the DROP list", () => {
    expect(normalizeTags(["rice", "onion", "protein", "budget"])).toEqual([]);
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

  it("accepts new canonical tags: filipino, asian, western, african, latin-american", () => {
    expect(normalizeTags(["filipino", "asian", "western", "african", "latin-american"]))
      .toEqual(["filipino", "asian", "western", "african", "latin-american"]);
  });

  it("accepts new canonical tags: stew, comfort, numbing", () => {
    expect(normalizeTags(["stew", "comfort", "numbing"])).toEqual(["stew", "comfort", "numbing"]);
  });
});
