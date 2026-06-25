import { generateObject } from "ai";
import { classifyAisles } from "./classify";
import { canonicalShoppingKey } from "./canonicalKey";

jest.mock("ai", () => ({ generateObject: jest.fn() }));
jest.mock("@ai-sdk/openai", () => ({ openai: jest.fn(() => "model") }));

const mockedGenerate = jest.mocked(generateObject);

beforeEach(() => jest.clearAllMocks());

describe("classifyAisles", () => {
  it("returns the model's aisle for each item, keyed by canonical name", async () => {
    mockedGenerate.mockResolvedValue({
      object: {
        assignments: [
          { key: canonicalShoppingKey("Apples"), aisle: "Produce" },
          { key: canonicalShoppingKey("pork belly"), aisle: "Meat & Seafood" },
        ],
      },
    } as never);

    const result = await classifyAisles(["Apples", "pork belly"]);

    expect(result[canonicalShoppingKey("apple")]).toBe("Produce");
    expect(result[canonicalShoppingKey("pork belly")]).toBe("Meat & Seafood");
  });

  it("coerces an off-vocabulary aisle from the model to Other", async () => {
    mockedGenerate.mockResolvedValue({
      object: { assignments: [{ key: "glitter", aisle: "Craft Supplies" }] },
    } as never);

    const result = await classifyAisles(["glitter"]);
    expect(result[canonicalShoppingKey("glitter")]).toBe("Other");
  });

  it("falls back to Other for an item the model omitted", async () => {
    mockedGenerate.mockResolvedValue({
      object: { assignments: [] },
    } as never);

    const result = await classifyAisles(["mystery item"]);
    expect(result[canonicalShoppingKey("mystery item")]).toBe("Other");
  });

  it("does not call the model when there are no names", async () => {
    const result = await classifyAisles([]);
    expect(result).toEqual({});
    expect(mockedGenerate).not.toHaveBeenCalled();
  });
});
