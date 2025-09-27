import { deleteRecipe, getRecipes, saveRecipe } from "@/lib/recipes";
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

// Mock the recipe functions
jest.mock("@/lib/recipes", () => ({
  deleteRecipe: jest.fn(),
  getRecipes: jest.fn(),
  saveRecipe: jest.fn(),
}));

const mockedDeleteRecipe = jest.mocked(deleteRecipe);
const mockedGetRecipes = jest.mocked(getRecipes);
const mockedSaveRecipe = jest.mocked(saveRecipe);

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
        },
        {
          id: "recipe-2",
          userId: "user-123",
          name: "Toast",
          instructions: "Put bread in toaster, wait for golden brown.",
        },
      ];

      mockedGetRecipes.mockResolvedValue(mockRecipes);

      const request = createMockRequest(
        "http://localhost:3000/api/recipe?userId=user-123"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockRecipes);
      expect(mockedGetRecipes).toHaveBeenCalledWith("user-123");
      expect(mockedGetRecipes).toHaveBeenCalledTimes(1);
    });

    it("should return empty array when no recipes found", async () => {
      mockedGetRecipes.mockResolvedValue([]);

      const request = createMockRequest(
        "http://localhost:3000/api/recipe?userId=user-456"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
      expect(mockedGetRecipes).toHaveBeenCalledWith("user-456");
    });

    it("should return 400 when userId is missing", async () => {
      const request = createMockRequest("http://localhost:3000/api/recipe");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "userId is required" });
      expect(mockedGetRecipes).not.toHaveBeenCalled();
    });

    it("should return 400 when userId is empty string", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/recipe?userId="
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "userId is required" });
      expect(mockedGetRecipes).not.toHaveBeenCalled();
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
    it("should save a recipe successfully", async () => {
      const savedRecipe = {
        id: "recipe-new",
        userId: "user-123",
        name: "Scrambled Eggs",
        instructions: "Beat eggs, cook in pan with butter.",
      };

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
      });
      expect(mockedSaveRecipe).toHaveBeenCalledTimes(1);
    });

    it("should save recipe with minimal data", async () => {
      const savedRecipe = {
        id: "recipe-minimal",
        userId: "user-123",
        name: undefined,
        instructions: undefined,
      };

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
      });
    });

    it("should return 400 when userId is missing", async () => {
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

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "userId is needed" });
      expect(mockedSaveRecipe).not.toHaveBeenCalled();
    });

    it("should return 400 when userId is empty string", async () => {
      const requestBody = {
        userId: "",
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

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "userId is needed" });
      expect(mockedSaveRecipe).not.toHaveBeenCalled();
    });

    it("should handle long recipe content", async () => {
      const longInstructions = "Step ".repeat(1000) + "Cook and enjoy!";
      const savedRecipe = {
        id: "recipe-long",
        userId: "user-123",
        name: "Complex Recipe",
        instructions: longInstructions,
      };

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
      expect(mockedSaveRecipe).toHaveBeenCalledWith(requestBody);
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
      };

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
      expect(mockedSaveRecipe).toHaveBeenCalledWith(specialRecipe);
    });

    it("should handle database errors during save", async () => {
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
      expect(mockedSaveRecipe).toHaveBeenCalledWith(requestBody);
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
      mockedDeleteRecipe.mockResolvedValue(undefined);

      const requestBody = {
        recipeId: "recipe-123",
      };

      const request = createMockRequest("http://localhost:3000/api/recipe", {
        method: "DELETE",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
      expect(mockedDeleteRecipe).toHaveBeenCalledWith("recipe-123");
      expect(mockedDeleteRecipe).toHaveBeenCalledTimes(1);
    });

    it("should handle missing recipeId", async () => {
      mockedDeleteRecipe.mockResolvedValue(undefined);

      const requestBody = {};

      const request = createMockRequest("http://localhost:3000/api/recipe", {
        method: "DELETE",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
      expect(mockedDeleteRecipe).toHaveBeenCalledWith(undefined);
    });

    it("should handle empty string recipeId", async () => {
      mockedDeleteRecipe.mockResolvedValue(undefined);

      const requestBody = {
        recipeId: "",
      };

      const request = createMockRequest("http://localhost:3000/api/recipe", {
        method: "DELETE",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
      expect(mockedDeleteRecipe).toHaveBeenCalledWith("");
    });

    it("should handle database errors during deletion", async () => {
      mockedDeleteRecipe.mockRejectedValue(new Error("Recipe not found"));

      const requestBody = {
        recipeId: "non-existent-recipe",
      };

      const request = createMockRequest("http://localhost:3000/api/recipe", {
        method: "DELETE",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      });

      // The route doesn't have try-catch, so this will throw
      await expect(DELETE(request)).rejects.toThrow("Recipe not found");
      expect(mockedDeleteRecipe).toHaveBeenCalledWith("non-existent-recipe");
    });

    it("should handle malformed JSON", async () => {
      const request = createMockRequest("http://localhost:3000/api/recipe", {
        method: "DELETE",
        body: "invalid json",
        headers: { "Content-Type": "application/json" },
      });

      // The route doesn't have try-catch, so this will throw
      await expect(DELETE(request)).rejects.toThrow();
    });
  });
});
