import { deleteRecipeForUser, getRecipes, saveRecipe, saveRecipeFromBlock } from "@/lib/recipes";
import { NotFoundError } from "@/lib/errors";
import { getSessionUserId } from "@/lib/session";
import { NextRequest } from "next/server";
import { DELETE, GET, POST } from "./route";

// Mock Next.js server components
jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
      headers: new Map(Object.entries(init?.headers || {})),
    })),
  },
}));

// Identity comes from the verified session, never the request — mock it so we
// can drive "who is calling" independently of any userId in the query/body.
jest.mock("@/lib/session", () => ({
  getSessionUserId: jest.fn(),
}));

// Mock the recipe functions
jest.mock("@/lib/recipes", () => ({
  deleteRecipeForUser: jest.fn(),
  getRecipes: jest.fn(),
  saveRecipe: jest.fn(),
  saveRecipeFromBlock: jest.fn(),
}));

jest.mock("@/lib/recipes/recipeProcessor", () => ({
  processRecipe: jest.fn(),
}));

jest.mock("@/lib/pexels/fetchPhoto", () => ({
  fetchRecipePhoto: jest.fn().mockResolvedValue(null),
}));

import { processRecipe } from "@/lib/recipes/recipeProcessor";
import { fetchRecipePhoto } from "@/lib/pexels/fetchPhoto";

const mockedDeleteRecipeForUser = jest.mocked(deleteRecipeForUser);
const mockedGetRecipes = jest.mocked(getRecipes);
const mockedSaveRecipe = jest.mocked(saveRecipe);
const mockedSaveRecipeFromBlock = jest.mocked(saveRecipeFromBlock);
const mockedProcessRecipe = jest.mocked(processRecipe);
const mockedFetchRecipePhoto = jest.mocked(fetchRecipePhoto);
const mockedGetSessionUserId = jest.mocked(getSessionUserId);

const defaultProcessed = {
  tags: [] as string[],
  baseServings: 2,
  ingredients: [] as {
    name: string;
    category: "Protein" | "Carbs" | "Vegetable" | "Condiments" | "Spice" | "Misc";
    amount?: number;
    unit?: string;
    note?: string;
  }[],
  description: "",
  totalTimeMinutes: undefined as number | undefined,
  prep: [] as string[],
  notes: [] as string[],
};

// Helper to create mock NextRequest
const createMockRequest = (url: string, options: RequestInit = {}) => {
  const parsedUrl = new URL(url);
  return {
    nextUrl: {
      searchParams: parsedUrl.searchParams,
    },
    json: async () => {
      if (options.body) {
        return JSON.parse(options.body as string);
      }
      return {};
    },
  } as NextRequest;
};

describe("Recipe API Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: an authenticated session for "user-123". Individual tests
    // override this (e.g. resolve null to simulate an unauthenticated caller).
    mockedGetSessionUserId.mockResolvedValue("user-123");
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("GET /api/recipe", () => {
    it("should return recipes for valid userId", async () => {
      const mockRecipes = [
        {
          id: "recipe-1",
          userId: "user-123",
          name: "Scrambled Eggs",
          instructions: "Beat eggs, cook in pan with butter.",
          tags: [],
          recipeId: null,
          baseServings: 2,
          ingredients: [],
          prep: [],
          notes: [],
          steps: null,
          description: null,
          totalTimeMinutes: null,
          createdAt: null,
          imageUrl: null,
          photographerName: null,
          photographerUrl: null,
          shareToken: null,
        },
        {
          id: "recipe-2",
          userId: "user-123",
          name: "Toast",
          instructions: "Put bread in toaster, wait for golden brown.",
          tags: [],
          recipeId: null,
          baseServings: 2,
          ingredients: [],
          prep: [],
          notes: [],
          steps: null,
          description: null,
          totalTimeMinutes: null,
          createdAt: null,
          imageUrl: null,
          photographerName: null,
          photographerUrl: null,
          shareToken: null,
        },
      ];

      mockedGetRecipes.mockResolvedValue(mockRecipes);

      const request = createMockRequest("http://localhost:3000/api/recipe");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockRecipes);
      expect(mockedGetRecipes).toHaveBeenCalledWith("user-123");
      expect(mockedGetRecipes).toHaveBeenCalledTimes(1);
    });

    it("should return empty array when no recipes found", async () => {
      mockedGetRecipes.mockResolvedValue([]);

      const request = createMockRequest("http://localhost:3000/api/recipe");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
      expect(mockedGetRecipes).toHaveBeenCalledWith("user-123");
    });

    it("should return 401 when unauthenticated", async () => {
      mockedGetSessionUserId.mockResolvedValue(null);

      const request = createMockRequest("http://localhost:3000/api/recipe");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
      expect(mockedGetRecipes).not.toHaveBeenCalled();
    });

    it("ignores a userId in the query and reads only the session user's recipes", async () => {
      mockedGetRecipes.mockResolvedValue([]);

      // Attacker tries to read someone else's cookbook by passing their id.
      const request = createMockRequest(
        "http://localhost:3000/api/recipe?userId=victim-999"
      );
      await GET(request);

      // The session owner (user-123) is used, never the query-supplied id.
      expect(mockedGetRecipes).toHaveBeenCalledWith("user-123");
      expect(mockedGetRecipes).not.toHaveBeenCalledWith("victim-999");
    });

    it("should handle database errors gracefully", async () => {
      mockedGetRecipes.mockRejectedValue(new Error("Database error"));

      const request = createMockRequest(
        "http://localhost:3000/api/recipe?userId=user-123"
      );

      // The route doesn't have try-catch, so this will throw
      await expect(GET(request)).rejects.toThrow("Database error");
      expect(mockedGetRecipes).toHaveBeenCalledWith("user-123");
    });

    it("should handle multiple query parameters correctly", async () => {
      const mockRecipes = [
        {
          id: "recipe-1",
          userId: "user-123",
          name: "Test Recipe",
          instructions: "Test instructions",
          tags: [],
          recipeId: null,
          baseServings: 2,
          ingredients: [],
          prep: [],
          notes: [],
          steps: null,
          description: null,
          totalTimeMinutes: null,
          createdAt: null,
          imageUrl: null,
          photographerName: null,
          photographerUrl: null,
          shareToken: null,
        },
      ];

      mockedGetRecipes.mockResolvedValue(mockRecipes);

      const request = createMockRequest(
        "http://localhost:3000/api/recipe?userId=user-123&otherParam=ignored"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockRecipes);
      expect(mockedGetRecipes).toHaveBeenCalledWith("user-123");
    });
  });

  describe("POST /api/recipe", () => {
    it("should preserve ingredient category and note for structured recipe payloads", async () => {
      const savedRecipe = {
        id: "recipe-structured",
        userId: "user-123",
        name: "Chicken Rub",
        instructions: "Dry spice mix for chicken.",
        tags: ["quick"],
        recipeId: "chicken-rub",
        baseServings: 2,
        ingredients: [
          { name: "paprika", category: "Spice" as const, amount: 1, unit: "tbsp", note: "smoked" },
        ],
        prep: [],
        notes: [],
        steps: [{ title: "Mix", body: "Combine all ingredients." }],
        description: "Dry spice mix for chicken.",
        totalTimeMinutes: 5,
        createdAt: null,
        imageUrl: null,
        photographerName: null,
        photographerUrl: null,
        shareToken: null,
      };
      mockedSaveRecipeFromBlock.mockResolvedValue(savedRecipe);

      const recipeBlock = {
        title: "Chicken Rub",
        description: "Dry spice mix for chicken.",
        totalTimeMinutes: 5,
        baseServings: 2,
        ingredients: [{ name: "paprika", category: "Spice", amount: "1", unit: "tbsp", note: "smoked" }],
        prep: [],
        notes: [],
        steps: [{ title: "Mix", body: "Combine all ingredients." }],
        tags: ["quick"],
      };

      const request = createMockRequest("http://localhost:3000/api/recipe", {
        method: "POST",
        body: JSON.stringify({ userId: "user-123", recipeId: "chicken-rub", recipe: recipeBlock }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ingredients[0].category).toBe("Spice");
      expect(data.ingredients[0].note).toBe("smoked");
      expect(mockedSaveRecipeFromBlock).toHaveBeenCalledWith(
        recipeBlock,
        "user-123",
        "chicken-rub",
        false,
      );
      expect(mockedProcessRecipe).not.toHaveBeenCalled();
    });

    it("passes recipeId to saveRecipeFromBlock so isSaved detection works", async () => {
      mockedSaveRecipeFromBlock.mockResolvedValue({
        id: "recipe-new",
        userId: "user-123",
        name: "Test",
        instructions: "",
        tags: [],
        recipeId: "msg-1-block-0",
        baseServings: 2,
        ingredients: [],
        prep: [],
        notes: [],
        steps: null,
        description: null,
        totalTimeMinutes: null,
        createdAt: null,
        imageUrl: null,
        photographerName: null,
        photographerUrl: null,
        shareToken: null,
      });

      const request = createMockRequest("http://localhost:3000/api/recipe", {
        method: "POST",
        body: JSON.stringify({
          userId: "user-123",
          recipeId: "msg-1-block-0",
          recipe: { title: "Test", ingredients: [], steps: [], tags: [], baseServings: 2 },
        }),
        headers: { "Content-Type": "application/json" },
      });

      await POST(request);

      expect(mockedSaveRecipeFromBlock).toHaveBeenCalledWith(
        expect.any(Object),
        "user-123",
        "msg-1-block-0",
        false,
      );
    });

    it("takes cooked beside the block — top-level body.cooked, never recipe.cooked (ADR-0020)", async () => {
      mockedSaveRecipeFromBlock.mockResolvedValue({ id: "recipe-new" } as never);

      // A model-streamed block claiming cooked: true must not stamp the recipe…
      await POST(
        createMockRequest("http://localhost:3000/api/recipe", {
          method: "POST",
          body: JSON.stringify({
            recipe: { title: "Test", ingredients: [], steps: [], tags: [], baseServings: 2, cooked: true },
          }),
          headers: { "Content-Type": "application/json" },
        }),
      );
      expect(mockedSaveRecipeFromBlock).toHaveBeenLastCalledWith(
        expect.any(Object),
        "user-123",
        undefined,
        false,
      );

      // …while the explicit tick-to-save flow passes cooked beside the block.
      await POST(
        createMockRequest("http://localhost:3000/api/recipe", {
          method: "POST",
          body: JSON.stringify({
            recipe: { title: "Test", ingredients: [], steps: [], tags: [], baseServings: 2 },
            cooked: true,
          }),
          headers: { "Content-Type": "application/json" },
        }),
      );
      expect(mockedSaveRecipeFromBlock).toHaveBeenLastCalledWith(
        expect.any(Object),
        "user-123",
        undefined,
        true,
      );
    });

    it("should save a recipe successfully", async () => {
      const savedRecipe = {
        id: "recipe-new",
        userId: "user-123",
        name: "Scrambled Eggs",
        instructions: "Beat eggs, cook in pan with butter.",
        tags: ["breakfast"],
        recipeId: null,
        baseServings: 2,
        ingredients: [],
        prep: [],
        notes: [],
        steps: null,
        description: null,
        totalTimeMinutes: null,
        createdAt: null,
        imageUrl: null,
        photographerName: null,
        photographerUrl: null,
        shareToken: null,
      };

      mockedProcessRecipe.mockResolvedValue({
        ...defaultProcessed,
        tags: ["breakfast"],
      });
      mockedSaveRecipe.mockResolvedValue(savedRecipe);

      const requestBody = {
        userId: "user-123",
        name: "Scrambled Eggs",
        instructions: "Beat eggs, cook in pan with butter.",
      };

      const request = createMockRequest("http://localhost:3000/api/recipe", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(savedRecipe);
      expect(mockedSaveRecipe).toHaveBeenCalledWith({
        userId: "user-123",
        name: "Scrambled Eggs",
        instructions: "Beat eggs, cook in pan with butter.",
        tags: ["breakfast"],
        recipeId: undefined,
        baseServings: 2,
        ingredients: [],
        prep: [],
        notes: [],
        description: "",
        totalTimeMinutes: undefined,
      }, null);
      expect(mockedFetchRecipePhoto).toHaveBeenCalledWith("Scrambled Eggs", ["breakfast"]);
      expect(mockedSaveRecipe).toHaveBeenCalledTimes(1);
    });

    it("should save recipe with minimal data", async () => {
      const savedRecipe = {
        id: "recipe-minimal",
        userId: "user-123",
        name: "" as string,
        instructions: "",
        tags: [] as string[],
        recipeId: null,
        baseServings: 2,
        ingredients: [],
        prep: [],
        notes: [],
        steps: null,
        description: null,
        totalTimeMinutes: null,
        createdAt: null,
        imageUrl: null,
        photographerName: null,
        photographerUrl: null,
        shareToken: null,
      };

      mockedProcessRecipe.mockResolvedValue(defaultProcessed);
      mockedSaveRecipe.mockResolvedValue(savedRecipe);

      const requestBody = {
        userId: "user-123",
      };

      const request = createMockRequest("http://localhost:3000/api/recipe", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(savedRecipe);
      expect(mockedSaveRecipe).toHaveBeenCalledWith({
        userId: "user-123",
        name: undefined,
        instructions: undefined,
        tags: [],
        recipeId: undefined,
        baseServings: 2,
        ingredients: [],
        prep: [],
        notes: [],
        description: "",
        totalTimeMinutes: undefined,
      }, null);
    });

    it("should return 401 when unauthenticated", async () => {
      mockedGetSessionUserId.mockResolvedValue(null);

      const requestBody = {
        name: "Test Recipe",
        instructions: "Test instructions",
      };

      const request = createMockRequest("http://localhost:3000/api/recipe", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
      expect(mockedSaveRecipe).not.toHaveBeenCalled();
    });

    it("saves under the session user, ignoring any userId in the body", async () => {
      mockedSaveRecipeFromBlock.mockResolvedValue({
        id: "recipe-new",
        userId: "user-123",
        name: "Test",
        instructions: "",
        tags: [],
        recipeId: null,
        baseServings: 2,
        ingredients: [],
        prep: [],
        notes: [],
        steps: null,
        description: null,
        totalTimeMinutes: null,
        createdAt: null,
        imageUrl: null,
        photographerName: null,
        photographerUrl: null,
        shareToken: null,
      });

      // Attacker tries to write into someone else's cookbook via the body.
      const request = createMockRequest("http://localhost:3000/api/recipe", {
        method: "POST",
        body: JSON.stringify({
          userId: "victim-999",
          recipe: { title: "Test", ingredients: [], steps: [], tags: [], baseServings: 2 },
        }),
        headers: { "Content-Type": "application/json" },
      });

      await POST(request);

      expect(mockedSaveRecipeFromBlock).toHaveBeenCalledTimes(1);
      expect(mockedSaveRecipeFromBlock).toHaveBeenCalledWith(
        expect.any(Object),
        "user-123",
        undefined,
        false,
      );
    });

    it("should handle long recipe content", async () => {
      const longInstructions = "Step ".repeat(1000) + "Cook and enjoy!";
      const savedRecipe = {
        id: "recipe-long",
        userId: "user-123",
        name: "Complex Recipe",
        instructions: longInstructions,
        tags: [] as string[],
        recipeId: null,
        baseServings: 2,
        ingredients: [],
        prep: [],
        notes: [],
        steps: null,
        description: null,
        totalTimeMinutes: null,
        createdAt: null,
        imageUrl: null,
        photographerName: null,
        photographerUrl: null,
        shareToken: null,
      };

      mockedProcessRecipe.mockResolvedValue(defaultProcessed);
      mockedSaveRecipe.mockResolvedValue(savedRecipe);

      const requestBody = {
        userId: "user-123",
        name: "Complex Recipe",
        instructions: longInstructions,
      };

      const request = createMockRequest("http://localhost:3000/api/recipe", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(savedRecipe);
      expect(mockedSaveRecipe).toHaveBeenCalledWith({
        userId: "user-123",
        name: "Complex Recipe",
        instructions: longInstructions,
        tags: [],
        recipeId: undefined,
        baseServings: 2,
        ingredients: [],
        prep: [],
        notes: [],
        description: "",
        totalTimeMinutes: undefined,
      }, null);
    });

    it("should handle special characters in recipe", async () => {
      const specialRecipe = {
        userId: "user-123",
        name: "Café's Spécial Crêpes 🥞",
        instructions: "Mix flour & eggs. Cook at 180°C for 5-10 mins. Voilà!",
      };

      const savedRecipe = {
        id: "recipe-special",
        ...specialRecipe,
        tags: [] as string[],
        recipeId: null,
        baseServings: 2,
        ingredients: [],
        prep: [],
        notes: [],
        steps: null,
        description: null,
        totalTimeMinutes: null,
        createdAt: null,
        imageUrl: null,
        photographerName: null,
        photographerUrl: null,
        shareToken: null,
      };

      mockedProcessRecipe.mockResolvedValue(defaultProcessed);
      mockedSaveRecipe.mockResolvedValue(savedRecipe);

      const request = createMockRequest("http://localhost:3000/api/recipe", {
        method: "POST",
        body: JSON.stringify(specialRecipe),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(savedRecipe);
      expect(mockedSaveRecipe).toHaveBeenCalledWith({
        ...specialRecipe,
        tags: [],
        recipeId: undefined,
        baseServings: 2,
        ingredients: [],
        prep: [],
        notes: [],
        description: "",
        totalTimeMinutes: undefined,
      }, null);
    });

    it("should handle database errors during save", async () => {
      mockedProcessRecipe.mockResolvedValue(defaultProcessed);
      mockedSaveRecipe.mockRejectedValue(new Error("Database error"));

      const requestBody = {
        userId: "user-123",
        name: "Test Recipe",
        instructions: "Test instructions",
      };

      const request = createMockRequest("http://localhost:3000/api/recipe", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      });

      // The route doesn't have try-catch, so this will throw
      await expect(POST(request)).rejects.toThrow("Database error");
      expect(mockedSaveRecipe).toHaveBeenCalledWith({
        userId: "user-123",
        name: "Test Recipe",
        instructions: "Test instructions",
        tags: [],
        recipeId: undefined,
        baseServings: 2,
        ingredients: [],
        prep: [],
        notes: [],
        description: "",
        totalTimeMinutes: undefined,
      }, null);
    });

    it("should handle malformed JSON", async () => {
      const request = createMockRequest("http://localhost:3000/api/recipe", {
        method: "POST",
        body: "invalid json",
        headers: { "Content-Type": "application/json" },
      });

      // The route doesn't have try-catch, so this will throw
      await expect(POST(request)).rejects.toThrow();
    });
  });

  describe("DELETE /api/recipe", () => {
    it("should delete a recipe successfully", async () => {
      mockedDeleteRecipeForUser.mockResolvedValue(undefined);

      const request = createMockRequest("http://localhost:3000/api/recipe", {
        method: "DELETE",
        body: JSON.stringify({ recipeId: "recipe-123", userId: "user-123" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
      expect(mockedDeleteRecipeForUser).toHaveBeenCalledWith("recipe-123", "user-123");
    });

    it("should return 401 when unauthenticated", async () => {
      mockedGetSessionUserId.mockResolvedValue(null);

      const request = createMockRequest("http://localhost:3000/api/recipe", {
        method: "DELETE",
        body: JSON.stringify({ recipeId: "recipe-123" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await DELETE(request);
      expect(response.status).toBe(401);
      expect(mockedDeleteRecipeForUser).not.toHaveBeenCalled();
    });

    it("deletes against the session user, ignoring any userId in the body", async () => {
      mockedDeleteRecipeForUser.mockResolvedValue(undefined);

      // Attacker passes a victim id; the route must scope the delete to the
      // authenticated caller so it can never touch another user's recipe.
      const request = createMockRequest("http://localhost:3000/api/recipe", {
        method: "DELETE",
        body: JSON.stringify({ recipeId: "recipe-123", userId: "victim-999" }),
        headers: { "Content-Type": "application/json" },
      });

      await DELETE(request);

      expect(mockedDeleteRecipeForUser).toHaveBeenCalledTimes(1);
      expect(mockedDeleteRecipeForUser).toHaveBeenCalledWith("recipe-123", "user-123");
    });

    it("should return 404 when recipe not found or not owned", async () => {
      mockedDeleteRecipeForUser.mockRejectedValue(new NotFoundError("Recipe"));

      const request = createMockRequest("http://localhost:3000/api/recipe", {
        method: "DELETE",
        body: JSON.stringify({ recipeId: "non-existent-recipe", userId: "user-123" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await DELETE(request);
      expect(response.status).toBe(404);
    });

    it("should handle malformed JSON", async () => {
      const request = createMockRequest("http://localhost:3000/api/recipe", {
        method: "DELETE",
        body: "invalid json",
        headers: { "Content-Type": "application/json" },
      });

      await expect(DELETE(request)).rejects.toThrow();
    });
  });
});
