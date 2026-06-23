import { canonicalTipKey } from "./canonicalKey";

describe("canonicalTipKey", () => {
  it("lowercases and trims", () => {
    expect(canonicalTipKey("  Tomato ")).toBe("tomato");
  });

  it("collapses internal whitespace", () => {
    expect(canonicalTipKey("Cherry   Tomatoes")).toBe("cherry tomatoes");
  });

  it("is stable for already-canonical input", () => {
    expect(canonicalTipKey("avocado")).toBe("avocado");
  });
});
