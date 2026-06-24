import { canonicalShoppingKey } from "./canonicalKey";

describe("canonicalShoppingKey", () => {
  it("collapses a recipe string, a plural, and a singular to one key", () => {
    const key = canonicalShoppingKey("apple");
    expect(canonicalShoppingKey("Apples")).toBe(key);
    expect(canonicalShoppingKey("2 apples, sliced")).toBe(key);
  });

  it("strips leading quantities and units", () => {
    expect(canonicalShoppingKey("3 cloves garlic")).toBe(
      canonicalShoppingKey("garlic"),
    );
  });

  it("drops prep adjectives", () => {
    expect(canonicalShoppingKey("fresh chopped coriander")).toBe(
      canonicalShoppingKey("coriander"),
    );
  });

  it("singularizes -ies to -y and -oes to -o", () => {
    expect(canonicalShoppingKey("berries")).toBe(canonicalShoppingKey("berry"));
    expect(canonicalShoppingKey("tomatoes")).toBe(
      canonicalShoppingKey("tomato"),
    );
  });

  it("does not over-singularize words ending in ss/us/is", () => {
    expect(canonicalShoppingKey("hummus")).toBe("hummus");
    expect(canonicalShoppingKey("watercress")).toBe("watercress");
  });

  it("keeps multi-word identities distinct", () => {
    expect(canonicalShoppingKey("spring onions")).toBe("spring onion");
    expect(canonicalShoppingKey("spring onion")).not.toBe(
      canonicalShoppingKey("onion"),
    );
  });

  it("falls back to the cleaned name when only prep words remain", () => {
    expect(canonicalShoppingKey("Fresh")).toBe("fresh");
  });
});
