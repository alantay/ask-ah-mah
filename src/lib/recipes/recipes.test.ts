import { prisma } from "@/lib/db";
import { fetchRecipePhoto } from "@/lib/pexels/fetchPhoto";
import { deleteRecipeForUser, saveRecipeFromBlock } from "./recipes";
import type { RecipeBlock } from "./schemas";

jest.mock("@/lib/db", () => ({
  prisma: {
    recipe: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock("@/lib/pexels/fetchPhoto", () => ({
  fetchRecipePhoto: jest.fn().mockResolvedValue(null),
}));

jest.mock("./normalizeTags", () => ({
  normalizeTags: jest.fn((tags: string[]) => tags),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

const baseBlock: RecipeBlock = {
  title: "Char Kway Teow",
  description: "Classic Singapore stir-fried noodles",
  totalTimeMinutes: 20,
  baseServings: 2,
  ingredients: [
    { name: "flat rice noodles", category: "Carbs", amount: "200", unit: "g" },
    { name: "eggs", category: "Protein", amount: "2" },
  ],
  prep: ["Soak noodles for 10 minutes"],
  steps: [
    { title: "Heat wok", body: "Get your wok smoking hot" },
    { title: "Stir fry", body: "Add noodles and toss" },
  ],
  tags: ["noodles", "singaporean"],
};

describe("saveRecipeFromBlock", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls prisma.recipe.create with coerced numeric amounts", async () => {
    (mockPrisma.recipe.create as jest.Mock).mockResolvedValue({ id: "r1" });

    await saveRecipeFromBlock(baseBlock, "user-1");

    const callArg = (mockPrisma.recipe.create as jest.Mock).mock.calls[0][0];
    const ingredients = callArg.data.ingredients;
    expect(ingredients[0].amount).toBe(200);
    expect(ingredients[1].amount).toBe(2);
  });

  it("sets amount to undefined when string is not a number", async () => {
    (mockPrisma.recipe.create as jest.Mock).mockResolvedValue({ id: "r1" });

    const block: RecipeBlock = {
      ...baseBlock,
      ingredients: [{ name: "salt", category: "Spice", amount: "to taste" }],
    };

    await saveRecipeFromBlock(block, "user-1");

    const callArg = (mockPrisma.recipe.create as jest.Mock).mock.calls[0][0];
    expect(callArg.data.ingredients[0].amount).toBeUndefined();
  });

  it("passes userId and name from block title", async () => {
    (mockPrisma.recipe.create as jest.Mock).mockResolvedValue({ id: "r1" });

    await saveRecipeFromBlock(baseBlock, "user-abc");

    const callArg = (mockPrisma.recipe.create as jest.Mock).mock.calls[0][0];
    expect(callArg.data.userId).toBe("user-abc");
    expect(callArg.data.name).toBe("Char Kway Teow");
  });

  it("passes recipeId when provided", async () => {
    (mockPrisma.recipe.create as jest.Mock).mockResolvedValue({ id: "r1" });

    await saveRecipeFromBlock(baseBlock, "user-1", "existing-id");

    const callArg = (mockPrisma.recipe.create as jest.Mock).mock.calls[0][0];
    expect(callArg.data.recipeId).toBe("existing-id");
  });

  it("calls fetchRecipePhoto with title and tags", async () => {
    (mockPrisma.recipe.create as jest.Mock).mockResolvedValue({ id: "r1" });

    await saveRecipeFromBlock(baseBlock, "user-1");

    expect(fetchRecipePhoto).toHaveBeenCalledWith("Char Kway Teow", expect.any(Array));
  });

  it("attaches photo fields when a photo is returned", async () => {
    (fetchRecipePhoto as jest.Mock).mockResolvedValueOnce({
      url: "https://example.com/photo.jpg",
      photographerName: "Jane",
      photographerUrl: "https://example.com/jane",
    });
    (mockPrisma.recipe.create as jest.Mock).mockResolvedValue({ id: "r1" });

    await saveRecipeFromBlock(baseBlock, "user-1");

    const callArg = (mockPrisma.recipe.create as jest.Mock).mock.calls[0][0];
    expect(callArg.data.imageUrl).toBe("https://example.com/photo.jpg");
    expect(callArg.data.photographerName).toBe("Jane");
  });
});

describe("deleteRecipeForUser", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls prisma.recipe.deleteMany with id and userId", async () => {
    (mockPrisma.recipe.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

    await deleteRecipeForUser("recipe-1", "user-1");

    expect(mockPrisma.recipe.deleteMany).toHaveBeenCalledWith({
      where: { id: "recipe-1", userId: "user-1" },
    });
  });

  it("throws when the recipe is not found or not owned by the user", async () => {
    (mockPrisma.recipe.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

    await expect(deleteRecipeForUser("recipe-1", "wrong-user")).rejects.toThrow(
      "Recipe not found or not owned by user",
    );
  });

  it("resolves without error when deletion succeeds", async () => {
    (mockPrisma.recipe.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

    await expect(deleteRecipeForUser("recipe-1", "user-1")).resolves.not.toThrow();
  });
});
