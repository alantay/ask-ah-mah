import { addInventoryItem } from "@/lib/inventory/Inventory";
import { generateObject } from "ai";
import { captureMentionedInventory, mentionsPossession } from "./captureInventory";

jest.mock("@/lib/inventory/Inventory", () => ({
  addInventoryItem: jest.fn(),
}));

jest.mock("@ai-sdk/openai", () => ({
  openai: jest.fn(() => "mock-model"),
}));

jest.mock("ai", () => ({
  generateObject: jest.fn(),
}));

const mockedGenerateObject = jest.mocked(generateObject);
const mockedAddInventoryItem = jest.mocked(addInventoryItem);

const mockExtraction = (items: unknown[]) =>
  mockedGenerateObject.mockResolvedValue({
    object: { items },
  } as unknown as Awaited<ReturnType<typeof generateObject>>);

describe("mentionsPossession", () => {
  it.each([
    "I have chicken broth",
    "I've got some eggs",
    "we have tofu",
    "bought a bunch of spinach",
    "picked up garlic at the market",
    "grabbed soy sauce",
    "there's leftover rice in the fridge",
    "I have a few carrots",
  ])("matches possession phrasing: %s", (text) => {
    expect(mentionsPossession(text)).toBe(true);
  });

  it.each([
    "what can I cook?",
    "how long do I boil an egg?",
    "give me a laksa recipe",
    "make it spicier",
    "",
  ])("does not match a bare question/command: %s", (text) => {
    expect(mentionsPossession(text)).toBe(false);
  });
});

describe("captureMentionedInventory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it("returns [] without calling the LLM when the gate fails", async () => {
    const result = await captureMentionedInventory("what can I cook?", "user-1");

    expect(result).toEqual([]);
    expect(mockedGenerateObject).not.toHaveBeenCalled();
    expect(mockedAddInventoryItem).not.toHaveBeenCalled();
  });

  it("returns [] for empty/whitespace text", async () => {
    expect(await captureMentionedInventory("   ", "user-1")).toEqual([]);
    expect(mockedGenerateObject).not.toHaveBeenCalled();
  });

  it("extracts and persists possessed items when the gate passes", async () => {
    const items = [{ name: "Chicken broth", type: "ingredient", category: "Misc" }];
    mockExtraction(items);

    const result = await captureMentionedInventory(
      "I have chicken broth, what can I cook?",
      "user-1",
    );

    expect(mockedGenerateObject).toHaveBeenCalledTimes(1);
    expect(mockedAddInventoryItem).toHaveBeenCalledWith(items, "user-1");
    expect(result).toEqual(items);
  });

  it("does not persist when the model extracts nothing", async () => {
    mockExtraction([]);

    const result = await captureMentionedInventory(
      "I have no idea what to cook",
      "user-1",
    );

    expect(mockedGenerateObject).toHaveBeenCalledTimes(1);
    expect(mockedAddInventoryItem).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("swallows extraction failures and returns [] (non-fatal fallback)", async () => {
    mockedGenerateObject.mockRejectedValue(new Error("LLM down"));

    const result = await captureMentionedInventory(
      "I have chicken broth",
      "user-1",
    );

    expect(result).toEqual([]);
    expect(mockedAddInventoryItem).not.toHaveBeenCalled();
  });
});
