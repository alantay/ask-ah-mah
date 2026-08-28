import { canonicalKey } from "./canonicalKey";

const same = (a: string, b: string) => canonicalKey(a) === canonicalKey(b);

describe("canonicalKey", () => {
  it("folds plurals, case and prep words onto one key", () => {
    expect(same("Shallot", "Shallots")).toBe(true);
    expect(same("Tomato", "Tomatoes")).toBe(true);
    expect(same("Chicken breast", "Chicken breasts")).toBe(true);
    expect(same("Chilli", "Fresh chilli")).toBe(true);
  });

  it("keeps form variants apart — they are different pantry items", () => {
    expect(same("Chilli", "Dried chilli")).toBe(false);
    expect(same("Garlic", "Garlic powder")).toBe(false);
    expect(same("Vanilla", "Vanilla extract")).toBe(false);
    expect(same("Mushroom", "Dried mushroom")).toBe(false);
    expect(same("Seaweed", "Roasted seaweed")).toBe(false);
    expect(same("Pork", "Minced pork")).toBe(false);
  });

  it("keeps genuinely distinct items apart", () => {
    expect(same("Minced beef", "Minced meat")).toBe(false);
    expect(same("Minced beef", "Minced pork")).toBe(false);
    expect(same("Seaweed", "Nori")).toBe(false);
  });

  it("falls back to the cleaned name when nothing survives tokenizing", () => {
    expect(canonicalKey("Fresh")).toBe("fresh");
    expect(canonicalKey("  Fresh   Whole ")).toBe("fresh whole");
  });
});
