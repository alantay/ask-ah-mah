import { generateObject } from "ai";
import { parseShoppingListText } from "./parseText";

jest.mock("ai", () => ({ generateObject: jest.fn() }));
jest.mock("@ai-sdk/openai", () => ({ openai: jest.fn(() => "model") }));

const mockedGenerate = jest.mocked(generateObject);

beforeEach(() => jest.clearAllMocks());

describe("parseShoppingListText", () => {
  it("returns the model's extracted items", async () => {
    const items = [
      { name: "Chipotle paste", category: "Condiments" },
      { name: "Cherry tomatoes", category: "Vegetable" },
    ];
    mockedGenerate.mockResolvedValue({ object: { items } } as never);

    const result = await parseShoppingListText(
      "1 tsp chipotle paste\nimg\n7 cherry tomatoes\nhalved",
    );

    expect(result).toEqual(items);
  });

  it("sends the pasted text and category rules to the model", async () => {
    mockedGenerate.mockResolvedValue({ object: { items: [] } } as never);

    await parseShoppingListText("2 eggs");

    expect(mockedGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("2 eggs"),
      }),
    );
    expect(mockedGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("Protein"),
      }),
    );
  });

  it("does not set a temperature (gpt-5 models only support the default)", async () => {
    mockedGenerate.mockResolvedValue({ object: { items: [] } } as never);

    await parseShoppingListText("milk");

    const call = mockedGenerate.mock.calls[0][0];
    expect(call).not.toHaveProperty("temperature");
  });
});
