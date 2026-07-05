import {
  addInventoryItem,
  getInventory,
  removeInventoryItem,
} from "@/lib/inventory/Inventory";
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

// Mock the inventory functions
jest.mock("@/lib/inventory/Inventory", () => ({
  addInventoryItem: jest.fn(),
  getInventory: jest.fn(),
  removeInventoryItem: jest.fn(),
}));

const mockedAddInventoryItem = jest.mocked(addInventoryItem);
const mockedGetInventory = jest.mocked(getInventory);
const mockedRemoveInventoryItem = jest.mocked(removeInventoryItem);
const mockedGetSessionUserId = jest.mocked(getSessionUserId);

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

describe("Inventory API Routes", () => {
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

  describe("GET /api/inventory", () => {
    it("should return inventory for valid userId", async () => {
      const mockInventory = {
        kitchenwareInventory: [
          {
            id: "k1",
            name: "frying pan",
            type: "kitchenware",
            quantity: null,
            unit: null,
            dateAdded: new Date("2024-01-01T10:00:00.000Z"),
            lastUpdated: new Date("2024-01-01T10:00:00.000Z"),
            userId: "user-123",
          },
        ],
        ingredientInventory: [
          {
            id: "i1",
            name: "eggs",
            type: "ingredient",
            quantity: 6,
            unit: "pieces",
            dateAdded: new Date("2024-01-01T10:00:00.000Z"),
            lastUpdated: new Date("2024-01-01T10:00:00.000Z"),
            userId: "user-123",
          },
        ],
      };

      mockedGetInventory.mockResolvedValue(mockInventory);

      const request = createMockRequest(
        "http://localhost:3000/api/inventory?userId=user-123"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockInventory);
      expect(mockedGetInventory).toHaveBeenCalledWith("user-123");
      expect(mockedGetInventory).toHaveBeenCalledTimes(1);
    });

    it("should return cache-control headers", async () => {
      const mockInventory = {
        kitchenwareInventory: [],
        ingredientInventory: [],
      };
      mockedGetInventory.mockResolvedValue(mockInventory);

      const request = createMockRequest(
        "http://localhost:3000/api/inventory?userId=user-123"
      );
      const response = await GET(request);

      expect(response.headers.get("Cache-Control")).toBe(
        "no-cache, no-store, must-revalidate"
      );
      expect(response.headers.get("Pragma")).toBe("no-cache");
      expect(response.headers.get("Expires")).toBe("0");
    });

    it("should return 401 when unauthenticated", async () => {
      mockedGetSessionUserId.mockResolvedValue(null);

      const request = createMockRequest("http://localhost:3000/api/inventory");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
      expect(mockedGetInventory).not.toHaveBeenCalled();
    });

    it("ignores a userId in the query and reads only the session user's pantry", async () => {
      mockedGetInventory.mockResolvedValue({
        kitchenwareInventory: [],
        ingredientInventory: [],
      });

      // Attacker tries to read someone else's pantry by passing their id.
      const request = createMockRequest(
        "http://localhost:3000/api/inventory?userId=victim-999"
      );
      await GET(request);

      expect(mockedGetInventory).toHaveBeenCalledTimes(1);
      expect(mockedGetInventory).toHaveBeenCalledWith("user-123");
      expect(mockedGetInventory).not.toHaveBeenCalledWith("victim-999");
    });

    it("should return 500 when getInventory throws error", async () => {
      mockedGetInventory.mockRejectedValue(new Error("Database error"));

      const request = createMockRequest(
        "http://localhost:3000/api/inventory?userId=user-123"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "Failed to fetch inventory" });
      expect(console.error).toHaveBeenCalledWith(
        "Failed to fetch inventory",
        expect.any(Error)
      );
    });

    it("should handle empty inventory gracefully", async () => {
      const emptyInventory = {
        kitchenwareInventory: [],
        ingredientInventory: [],
      };
      mockedGetInventory.mockResolvedValue(emptyInventory);

      const request = createMockRequest(
        "http://localhost:3000/api/inventory?userId=user-123"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(emptyInventory);
    });
  });

  describe("POST /api/inventory", () => {
    it("should add inventory items successfully", async () => {
      const requestBody = {
        userId: "user-123",
        items: [
          {
            name: "eggs",
            type: "ingredient",
            quantity: 6,
            unit: "pieces",
          },
          {
            name: "frying pan",
            type: "kitchenware",
          },
        ],
      };

      mockedAddInventoryItem.mockResolvedValue(undefined);

      const request = createMockRequest("http://localhost:3000/api/inventory", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true, message: "Inventory updated" });
      expect(mockedAddInventoryItem).toHaveBeenCalledWith(
        requestBody.items,
        "user-123"
      );
      expect(mockedAddInventoryItem).toHaveBeenCalledTimes(1);
    });

    it("should return 401 when unauthenticated", async () => {
      mockedGetSessionUserId.mockResolvedValue(null);

      const requestBody = {
        items: [{ name: "eggs", type: "ingredient" }],
      };

      const request = createMockRequest("http://localhost:3000/api/inventory", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
      expect(mockedAddInventoryItem).not.toHaveBeenCalled();
    });

    it("adds under the session user, ignoring any userId in the body", async () => {
      mockedAddInventoryItem.mockResolvedValue(undefined);

      const items = [{ name: "eggs", type: "ingredient" }];
      // Attacker tries to write into someone else's pantry via the body.
      const request = createMockRequest("http://localhost:3000/api/inventory", {
        method: "POST",
        body: JSON.stringify({ userId: "victim-999", items }),
        headers: { "Content-Type": "application/json" },
      });

      await POST(request);

      expect(mockedAddInventoryItem).toHaveBeenCalledTimes(1);
      expect(mockedAddInventoryItem).toHaveBeenCalledWith(items, "user-123");
    });

    it("should handle empty items array", async () => {
      const requestBody = {
        userId: "user-123",
        items: [],
      };

      mockedAddInventoryItem.mockResolvedValue(undefined);

      const request = createMockRequest("http://localhost:3000/api/inventory", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true, message: "Inventory updated" });
      expect(mockedAddInventoryItem).toHaveBeenCalledWith([], "user-123");
    });

    it("should return 500 when addInventoryItem throws error", async () => {
      mockedAddInventoryItem.mockRejectedValue(new Error("Database error"));

      const requestBody = {
        userId: "user-123",
        items: [{ name: "eggs", type: "ingredient" }],
      };

      const request = createMockRequest("http://localhost:3000/api/inventory", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "Failed to update inventory" });
      expect(console.error).toHaveBeenCalledWith(
        "Failed to update inventory",
        expect.any(Error)
      );
    });

    it("should return 400 on malformed JSON without touching the service", async () => {
      const request = createMockRequest("http://localhost:3000/api/inventory", {
        method: "POST",
        body: "invalid json",
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Invalid inventory payload" });
      expect(mockedAddInventoryItem).not.toHaveBeenCalled();
    });

    it("should return 400 when items fail schema validation", async () => {
      // `type` is not one of the allowed enum values.
      const request = createMockRequest("http://localhost:3000/api/inventory", {
        method: "POST",
        body: JSON.stringify({ items: [{ name: "eggs", type: "weapon" }] }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Invalid inventory payload" });
      expect(mockedAddInventoryItem).not.toHaveBeenCalled();
    });

    it("should return 400 when items is not an array", async () => {
      const request = createMockRequest("http://localhost:3000/api/inventory", {
        method: "POST",
        body: JSON.stringify({ items: "eggs" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(mockedAddInventoryItem).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /api/inventory", () => {
    it("should remove inventory items successfully", async () => {
      const requestBody = {
        userId: "user-123",
        itemNames: ["eggs", "frying pan"],
      };

      mockedRemoveInventoryItem.mockResolvedValue(undefined);

      const request = createMockRequest("http://localhost:3000/api/inventory", {
        method: "DELETE",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true, message: "Inventory updated" });
      expect(mockedRemoveInventoryItem).toHaveBeenCalledWith(
        ["eggs", "frying pan"],
        "user-123"
      );
      expect(mockedRemoveInventoryItem).toHaveBeenCalledTimes(1);
    });

    it("should return 401 when unauthenticated", async () => {
      mockedGetSessionUserId.mockResolvedValue(null);

      const requestBody = {
        itemNames: ["eggs"],
      };

      const request = createMockRequest("http://localhost:3000/api/inventory", {
        method: "DELETE",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
      expect(mockedRemoveInventoryItem).not.toHaveBeenCalled();
    });

    it("removes against the session user, ignoring any userId in the body", async () => {
      mockedRemoveInventoryItem.mockResolvedValue(undefined);

      // Attacker passes a victim id; the route must scope the delete to the
      // authenticated caller so it can never touch another user's pantry.
      const request = createMockRequest("http://localhost:3000/api/inventory", {
        method: "DELETE",
        body: JSON.stringify({ userId: "victim-999", itemNames: ["eggs"] }),
        headers: { "Content-Type": "application/json" },
      });

      await DELETE(request);

      expect(mockedRemoveInventoryItem).toHaveBeenCalledTimes(1);
      expect(mockedRemoveInventoryItem).toHaveBeenCalledWith(["eggs"], "user-123");
    });

    it("should handle empty itemNames array", async () => {
      const requestBody = {
        userId: "user-123",
        itemNames: [],
      };

      mockedRemoveInventoryItem.mockResolvedValue(undefined);

      const request = createMockRequest("http://localhost:3000/api/inventory", {
        method: "DELETE",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true, message: "Inventory updated" });
      expect(mockedRemoveInventoryItem).toHaveBeenCalledWith([], "user-123");
    });

    it("should return 500 when removeInventoryItem throws error", async () => {
      mockedRemoveInventoryItem.mockRejectedValue(new Error("Database error"));

      const requestBody = {
        userId: "user-123",
        itemNames: ["eggs"],
      };

      const request = createMockRequest("http://localhost:3000/api/inventory", {
        method: "DELETE",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "Failed to update inventory" });
      expect(console.error).toHaveBeenCalledWith(
        "Failed to update inventory",
        expect.any(Error)
      );
    });

    it("should return 400 on malformed JSON without touching the service", async () => {
      const request = createMockRequest("http://localhost:3000/api/inventory", {
        method: "DELETE",
        body: "invalid json",
        headers: { "Content-Type": "application/json" },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Invalid inventory payload" });
      expect(mockedRemoveInventoryItem).not.toHaveBeenCalled();
    });

    it("should return 400 when itemNames fails schema validation", async () => {
      const request = createMockRequest("http://localhost:3000/api/inventory", {
        method: "DELETE",
        body: JSON.stringify({ itemNames: [42, ""] }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Invalid inventory payload" });
      expect(mockedRemoveInventoryItem).not.toHaveBeenCalled();
    });
  });
});
