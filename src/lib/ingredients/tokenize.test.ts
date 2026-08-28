import { tokenize, FORM } from "./tokenize";

describe("tokenize", () => {
  it("lowercases, strips punctuation and parentheticals", () => {
    expect(tokenize("Doubanjiang (fermented bean paste)")).toEqual(["doubanjiang"]);
  });

  it("strips prep words that do not change identity", () => {
    expect(tokenize("fresh chopped coriander")).toEqual(["coriander"]);
    expect(tokenize("thinly sliced pork belly")).toEqual(["pork", "belly"]);
  });

  it("strips quantities and units", () => {
    expect(tokenize("3 cloves garlic")).toEqual(["garlic"]);
    expect(tokenize("200g chicken breast")).toEqual(["chicken", "breast"]);
  });

  it("singularizes", () => {
    expect(tokenize("Shallots")).toEqual(["shallot"]);
    expect(tokenize("Tomatoes")).toEqual(["tomato"]);
    expect(tokenize("berries")).toEqual(["berry"]);
  });

  it("does not over-singularize", () => {
    expect(tokenize("watercress")).toEqual(["watercress"]);
    expect(tokenize("hummus")).toEqual(["hummus"]);
  });

  it("keeps every form word — they change what the ingredient is", () => {
    for (const word of FORM) {
      expect(tokenize(`${word} chilli`)).toEqual([word, "chilli"]);
    }
  });

  it("returns nothing for an empty or prep-only name", () => {
    expect(tokenize("")).toEqual([]);
    expect(tokenize("fresh whole")).toEqual([]);
  });
});
