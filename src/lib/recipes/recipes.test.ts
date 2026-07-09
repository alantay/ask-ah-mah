import { prisma } from "@/lib/db";
import { fetchRecipePhoto } from "@/lib/pexels/fetchPhoto";
import {
  deleteRecipeForUser,
  getRecipeByShareToken,
  mintShareToken,
  saveRecipeFromBlock,
  updateRecipeForUser,
} from "./recipes";
import type { RecipeBlock } from "./schemas";

jest.mock("@/lib/db", () => ({
  prisma: {
    recipe: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
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

  it("defaults cooked to false", async () => {
    (mockPrisma.recipe.create as jest.Mock).mockResolvedValue({ id: "r1" });

    await saveRecipeFromBlock(baseBlock, "user-1");

    const callArg = (mockPrisma.recipe.create as jest.Mock).mock.calls[0][0];
    expect(callArg.data.cooked).toBe(false);
  });

  it("ignores cooked on the block — a model-streamed block can never stamp a recipe (ADR-0020)", async () => {
    (mockPrisma.recipe.create as jest.Mock).mockResolvedValue({ id: "r1" });

    await saveRecipeFromBlock({ ...baseBlock, cooked: true }, "user-1");

    const callArg = (mockPrisma.recipe.create as jest.Mock).mock.calls[0][0];
    expect(callArg.data.cooked).toBe(false);
  });

  it("persists cooked: true only via the explicit param (tick-to-save)", async () => {
    (mockPrisma.recipe.create as jest.Mock).mockResolvedValue({ id: "r1" });

    await saveRecipeFromBlock(baseBlock, "user-1", "key-1", true);

    const callArg = (mockPrisma.recipe.create as jest.Mock).mock.calls[0][0];
    expect(callArg.data.cooked).toBe(true);
  });
});

describe("updateRecipeForUser", () => {
  beforeEach(() => jest.clearAllMocks());

  it("persists cooked: true when set on the block", async () => {
    (mockPrisma.recipe.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    (mockPrisma.recipe.findUnique as jest.Mock).mockResolvedValue({ id: "recipe-1" });

    await updateRecipeForUser("recipe-1", "user-1", { ...baseBlock, cooked: true });

    const callArg = (mockPrisma.recipe.updateMany as jest.Mock).mock.calls[0][0];
    expect(callArg.data.cooked).toBe(true);
  });

  it("persists cooked: false when explicitly set on the block (uncheck)", async () => {
    (mockPrisma.recipe.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    (mockPrisma.recipe.findUnique as jest.Mock).mockResolvedValue({ id: "recipe-1" });

    await updateRecipeForUser("recipe-1", "user-1", { ...baseBlock, cooked: false });

    const callArg = (mockPrisma.recipe.updateMany as jest.Mock).mock.calls[0][0];
    expect(callArg.data.cooked).toBe(false);
  });

  it("omits cooked from the update when the block doesn't set it, so it never clobbers the existing value", async () => {
    (mockPrisma.recipe.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    (mockPrisma.recipe.findUnique as jest.Mock).mockResolvedValue({ id: "recipe-1" });

    await updateRecipeForUser("recipe-1", "user-1", baseBlock);

    const callArg = (mockPrisma.recipe.updateMany as jest.Mock).mock.calls[0][0];
    expect(callArg.data.cooked).toBeUndefined();
  });

  it("throws when the recipe is not found or not owned by the user", async () => {
    (mockPrisma.recipe.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

    await expect(
      updateRecipeForUser("recipe-1", "wrong-user", baseBlock),
    ).rejects.toThrow("Recipe not found");
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
      "Recipe not found",
    );
  });

  it("resolves without error when deletion succeeds", async () => {
    (mockPrisma.recipe.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

    await expect(deleteRecipeForUser("recipe-1", "user-1")).resolves.not.toThrow();
  });
});

describe("mintShareToken", () => {
  beforeEach(() => jest.clearAllMocks());

  it("mints and returns a new token for a recipe the user owns", async () => {
    (mockPrisma.recipe.findFirst as jest.Mock).mockResolvedValueOnce({
      shareToken: null,
    });
    (mockPrisma.recipe.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

    const token = await mintShareToken("recipe-1", "user-1");

    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
    // The owner lookup AND the compare-and-set write are both scoped to userId.
    expect(mockPrisma.recipe.findFirst).toHaveBeenCalledWith({
      where: { id: "recipe-1", userId: "user-1" },
      select: { shareToken: true },
    });
    expect(mockPrisma.recipe.updateMany).toHaveBeenCalledWith({
      where: { id: "recipe-1", userId: "user-1", shareToken: null },
      data: { shareToken: token },
    });
  });

  it("is idempotent — returns the existing token without a second write", async () => {
    (mockPrisma.recipe.findFirst as jest.Mock).mockResolvedValueOnce({
      shareToken: "tok_existing",
    });

    const token = await mintShareToken("recipe-1", "user-1");

    expect(token).toBe("tok_existing");
    expect(mockPrisma.recipe.updateMany).not.toHaveBeenCalled();
  });

  it("throws 'not found' when the recipe is not the user's (non-owner cannot mint)", async () => {
    (mockPrisma.recipe.findFirst as jest.Mock).mockResolvedValueOnce(null);

    await expect(mintShareToken("recipe-1", "attacker")).rejects.toThrow(
      "not found",
    );
    expect(mockPrisma.recipe.updateMany).not.toHaveBeenCalled();
  });
});

describe("getRecipeByShareToken", () => {
  beforeEach(() => jest.clearAllMocks());

  it("resolves a recipe by token alone — no userId, no session required", async () => {
    const publicRow = { id: "recipe-1", name: "Char Kway Teow" };
    (mockPrisma.recipe.findUnique as jest.Mock).mockResolvedValue(publicRow);

    const result = await getRecipeByShareToken("tok_abc");

    expect(result).toBe(publicRow);
    const call = (mockPrisma.recipe.findUnique as jest.Mock).mock.calls[0][0];
    // Matches on the token only — never userId — so anyone with the link reads it.
    expect(call.where).toEqual({ shareToken: "tok_abc" });
    // Owner-scoped fields must never be selected into the public projection.
    expect(call.select).not.toHaveProperty("userId");
    expect(call.select).not.toHaveProperty("shareToken");
  });

  it("returns null for an unknown token", async () => {
    (mockPrisma.recipe.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(getRecipeByShareToken("nope")).resolves.toBeNull();
  });
});
