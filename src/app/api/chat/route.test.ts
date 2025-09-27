import {
  addInventoryItem,
  getInventory,
  removeInventoryItem,
} from "@/lib/inventory/Inventory";
import { getMessages } from "@/lib/messages/messages";
import { google } from "@ai-sdk/google";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  validateUIMessages,
} from "ai";
import { NextRequest } from "next/server";
import { POST } from "./route";

// Mock all external dependencies
jest.mock("@/lib/inventory/Inventory", () => ({
  addInventoryItem: jest.fn(),
  getInventory: jest.fn(),
  removeInventoryItem: jest.fn(),
}));

jest.mock("@/lib/messages/messages", () => ({
  getMessages: jest.fn(),
}));

jest.mock("@ai-sdk/google", () => ({
  google: jest.fn(),
}));

jest.mock("ai", () => ({
  convertToModelMessages: jest.fn(),
  stepCountIs: jest.fn(),
  streamText: jest.fn(),
  validateUIMessages: jest.fn(),
}));

jest.mock("./constants", () => ({
  CHAT_SYSTEM_PROMPT: "Test system prompt",
}));

// Mock Next.js server components
jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
}));

const mockedAddInventoryItem = jest.mocked(addInventoryItem);
const mockedGetInventory = jest.mocked(getInventory);
const mockedRemoveInventoryItem = jest.mocked(removeInventoryItem);
const mockedGetMessages = jest.mocked(getMessages);
const mockedGoogle = jest.mocked(google);
const mockedConvertToModelMessages = jest.mocked(convertToModelMessages);
const mockedStepCountIs = jest.mocked(stepCountIs);
const mockedStreamText = jest.mocked(streamText);
const mockedValidateUIMessages = jest.mocked(validateUIMessages);

// Helper to create mock NextRequest
const createMockRequest = (body: unknown) => {
  return {
    json: async () => body,
  } as NextRequest;
};

describe("Chat API Route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, "error").mockImplementation(() => {});

    // Setup default mocks
    mockedGoogle.mockReturnValue(
      "mock-model" as unknown as ReturnType<typeof google>
    );
    mockedStepCountIs.mockReturnValue(
      "mock-step-count" as unknown as ReturnType<typeof stepCountIs>
    );
    mockedConvertToModelMessages.mockReturnValue(
      "mock-converted-messages" as unknown as ReturnType<
        typeof convertToModelMessages
      >
    );
    mockedValidateUIMessages.mockResolvedValue(
      "mock-validated-messages" as unknown as Awaited<
        ReturnType<typeof validateUIMessages>
      >
    );
    mockedStreamText.mockReturnValue({
      toUIMessageStreamResponse: jest
        .fn()
        .mockReturnValue("mock-stream-response"),
    } as unknown as ReturnType<typeof streamText>);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("POST /api/chat", () => {
    it("should process chat request with basic messages", async () => {
      const mockPreviousMessages = [
        {
          id: "msg-1",
          role: "user",
          content: "Hello",
          userId: "user-123",
          createdAt: new Date("2024-01-01T10:00:00.000Z"),
        },
        {
          id: "msg-2",
          role: "assistant",
          content: "Hi there!",
          userId: "user-123",
          createdAt: new Date("2024-01-01T10:01:00.000Z"),
        },
      ];

      mockedGetMessages.mockResolvedValue(mockPreviousMessages);

      const requestBody = {
        userId: "user-123",
        messages: [
          {
            id: "msg-3",
            role: "user",
            parts: [{ type: "text", text: "What can I cook?" }],
          },
        ],
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);

      expect(response).toBe("mock-stream-response");
      expect(mockedGoogle).toHaveBeenCalledWith("gemini-2.5-flash");
      expect(mockedGetMessages).toHaveBeenCalledWith("user-123");
      expect(mockedValidateUIMessages).toHaveBeenCalled();
      expect(mockedStreamText).toHaveBeenCalled();
    });

    it("should handle empty previous messages", async () => {
      mockedGetMessages.mockResolvedValue([]);

      const requestBody = {
        userId: "user-456",
        messages: [
          {
            id: "msg-1",
            role: "user",
            parts: [{ type: "text", text: "First message" }],
          },
        ],
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);

      expect(response).toBe("mock-stream-response");
      expect(mockedGetMessages).toHaveBeenCalledWith("user-456");
      expect(mockedValidateUIMessages).toHaveBeenCalledWith({
        messages: requestBody.messages,
      });
    });

    it("should limit context window to 15 messages", async () => {
      // Create 20 previous messages (more than CONTEXT_WINDOW)
      const mockPreviousMessages = Array.from({ length: 20 }, (_, i) => ({
        id: `msg-${i}`,
        role: i % 2 === 0 ? "user" : "assistant",
        content: `Message ${i}`,
        userId: "user-123",
        createdAt: new Date("2024-01-01T10:00:00.000Z"),
      }));

      mockedGetMessages.mockResolvedValue(mockPreviousMessages);

      const requestBody = {
        userId: "user-123",
        messages: [
          {
            id: "msg-new",
            role: "user",
            parts: [{ type: "text", text: "New message" }],
          },
        ],
      };

      const request = createMockRequest(requestBody);
      await POST(request);

      // Verify that validateUIMessages was called with limited messages
      const validateCall = mockedValidateUIMessages.mock.calls[0][0];
      // Should have 15 (context window) - 1 (sliced) + 1 (new message) = 15 messages
      expect(validateCall.messages).toHaveLength(15);
    });

    it("should convert previous messages to UI message format", async () => {
      const mockPreviousMessages = [
        {
          id: "msg-1",
          role: "user",
          content: "Test message",
          userId: "user-123",
          createdAt: new Date("2024-01-01T10:00:00.000Z"),
        },
        {
          id: "msg-2",
          role: "assistant",
          content: "Test response",
          userId: "user-123",
          createdAt: new Date("2024-01-01T10:01:00.000Z"),
        },
      ];

      mockedGetMessages.mockResolvedValue(mockPreviousMessages);

      const requestBody = {
        userId: "user-123",
        messages: [
          {
            id: "msg-3",
            role: "user",
            parts: [{ type: "text", text: "New message" }],
          },
        ],
      };

      const request = createMockRequest(requestBody);
      await POST(request);

      const validateCall = mockedValidateUIMessages.mock.calls[0][0] as {
        messages: unknown[];
      };
      // Should have previous messages (minus last) + new messages
      expect(validateCall.messages).toHaveLength(2); // 1 previous + 1 new
      expect(validateCall.messages[0]).toEqual({
        id: "msg-1",
        role: "user",
        parts: [
          {
            type: "text",
            text: "Test message",
          },
        ],
      });
    });

    it("should configure streamText with correct parameters", async () => {
      mockedGetMessages.mockResolvedValue([]);

      const requestBody = {
        userId: "user-123",
        messages: [
          {
            id: "msg-1",
            role: "user",
            parts: [{ type: "text", text: "Test" }],
          },
        ],
      };

      const request = createMockRequest(requestBody);
      await POST(request);

      const streamTextCall = mockedStreamText.mock.calls[0][0];
      expect(streamTextCall.model).toBe("mock-model");
      expect(streamTextCall.messages).toBe("mock-converted-messages");
      expect(streamTextCall.system).toBe("Test system prompt");
      expect(streamTextCall.stopWhen).toBe("mock-step-count");
      expect(streamTextCall.tools).toBeDefined();
    });

    it("should include all required tools", async () => {
      mockedGetMessages.mockResolvedValue([]);

      const requestBody = {
        userId: "user-123",
        messages: [
          {
            id: "msg-1",
            role: "user",
            parts: [{ type: "text", text: "Test" }],
          },
        ],
      };

      const request = createMockRequest(requestBody);
      await POST(request);

      const streamTextCall = mockedStreamText.mock.calls[0][0];
      expect(streamTextCall.tools).toHaveProperty("addInventoryItem");
      expect(streamTextCall.tools).toHaveProperty("getInventory");
      expect(streamTextCall.tools).toHaveProperty("removeInventoryItem");
    });

    it("should handle database errors from getMessages", async () => {
      mockedGetMessages.mockRejectedValue(new Error("Database error"));

      const requestBody = {
        userId: "user-123",
        messages: [
          {
            id: "msg-1",
            role: "user",
            parts: [{ type: "text", text: "Test" }],
          },
        ],
      };

      const request = createMockRequest(requestBody);

      await expect(POST(request)).rejects.toThrow("Database error");
      expect(mockedGetMessages).toHaveBeenCalledWith("user-123");
    });

    it("should handle validation errors", async () => {
      mockedGetMessages.mockResolvedValue([]);
      mockedValidateUIMessages.mockRejectedValue(new Error("Validation error"));

      const requestBody = {
        userId: "user-123",
        messages: [
          {
            id: "msg-1",
            role: "user",
            parts: [{ type: "text", text: "Test" }],
          },
        ],
      };

      const request = createMockRequest(requestBody);

      await expect(POST(request)).rejects.toThrow("Validation error");
    });

    it("should handle malformed request body", async () => {
      const request = createMockRequest("invalid json");

      await expect(POST(request)).rejects.toThrow();
    });
  });

  describe("Tool Execution", () => {
    let toolExecutions: Record<
      string,
      {
        description: string;
        inputSchema: unknown;
        execute: (...args: unknown[]) => unknown;
      }
    >;git a

    beforeEach(async () => {
      mockedGetMessages.mockResolvedValue([]);

      const requestBody = {
        userId: "user-123",
        messages: [
          {
            id: "msg-1",
            role: "user",
            parts: [{ type: "text", text: "Test" }],
          },
        ],
      };

      const request = createMockRequest(requestBody);
      await POST(request);

      toolExecutions = mockedStreamText.mock.calls[0][0].tools as Record<
        string,
        {
          description: string;
          inputSchema: unknown;
          execute: (...args: unknown[]) => unknown;
        }
      >;
    });

    describe("addInventoryItem tool", () => {
      it("should have correct configuration", () => {
        const tool = toolExecutions.addInventoryItem;
        expect(tool.description).toContain("Add items to the user's inventory");
        expect(tool.inputSchema).toBeDefined();
        expect(tool.execute).toBeDefined();
      });

      it("should execute addInventoryItem correctly", async () => {
        mockedAddInventoryItem.mockResolvedValue(undefined);

        const items = [{ name: "eggs", type: "ingredient" }];
        const result = await toolExecutions.addInventoryItem.execute({ items });

        expect(mockedAddInventoryItem).toHaveBeenCalledWith(items, "user-123");
        expect(result).toEqual({ content: "Item added to inventory" });
      });

      it("should handle addInventoryItem errors", async () => {
        mockedAddInventoryItem.mockRejectedValue(new Error("Database error"));

        const items = [{ name: "eggs", type: "ingredient" }];

        await expect(
          toolExecutions.addInventoryItem.execute({ items })
        ).rejects.toThrow("Database error");
      });
    });

    describe("getInventory tool", () => {
      it("should have correct configuration", () => {
        const tool = toolExecutions.getInventory;
        expect(tool.description).toContain(
          "Check what ingredients and kitchenware"
        );
        expect(tool.inputSchema).toBeDefined();
        expect(tool.execute).toBeDefined();
      });

      it("should execute getInventory correctly", async () => {
        const mockInventory = {
          ingredientInventory: [
            {
              id: "1",
              name: "eggs",
              type: "ingredient",
              userId: "user-123",
              quantity: 6,
              unit: "pieces",
              dateAdded: new Date("2024-01-01T10:00:00.000Z"),
              lastUpdated: new Date("2024-01-01T10:00:00.000Z"),
            },
            {
              id: "2",
              name: "flour",
              type: "ingredient",
              userId: "user-123",
              quantity: 1,
              unit: "kg",
              dateAdded: new Date("2024-01-01T10:00:00.000Z"),
              lastUpdated: new Date("2024-01-01T10:00:00.000Z"),
            },
          ],
          kitchenwareInventory: [
            {
              id: "3",
              name: "pan",
              type: "kitchenware",
              userId: "user-123",
              quantity: null,
              unit: null,
              dateAdded: new Date("2024-01-01T10:00:00.000Z"),
              lastUpdated: new Date("2024-01-01T10:00:00.000Z"),
            },
          ],
        };

        mockedGetInventory.mockResolvedValue(mockInventory);

        const result = await toolExecutions.getInventory.execute({});

        expect(mockedGetInventory).toHaveBeenCalledWith("user-123");
        expect(result).toEqual({
          content: "Current inventory: 2 ingredients, 1 kitchenware items",
          inventory: mockInventory,
        });
      });

      it("should handle empty inventory", async () => {
        const emptyInventory = {
          ingredientInventory: [],
          kitchenwareInventory: [],
        };

        mockedGetInventory.mockResolvedValue(emptyInventory);

        const result = await toolExecutions.getInventory.execute({});

        expect(result).toEqual({
          content: "Current inventory: 0 ingredients, 0 kitchenware items",
          inventory: emptyInventory,
        });
      });

      it("should handle getInventory errors", async () => {
        mockedGetInventory.mockRejectedValue(new Error("Database error"));

        await expect(toolExecutions.getInventory.execute({})).rejects.toThrow(
          "Database error"
        );
      });
    });

    describe("removeInventoryItem tool", () => {
      it("should have correct configuration", () => {
        const tool = toolExecutions.removeInventoryItem;
        expect(tool.description).toContain("Remove items from inventory");
        expect(tool.inputSchema).toBeDefined();
        expect(tool.execute).toBeDefined();
      });

      it("should execute removeInventoryItem correctly", async () => {
        mockedRemoveInventoryItem.mockResolvedValue(undefined);

        const itemNames = ["eggs", "flour"];
        const result = await toolExecutions.removeInventoryItem.execute({
          itemNames,
        });

        expect(mockedRemoveInventoryItem).toHaveBeenCalledWith(
          itemNames,
          "user-123"
        );
        expect(result).toEqual({ content: "Items removed from inventory" });
      });

      it("should handle removeInventoryItem errors", async () => {
        mockedRemoveInventoryItem.mockRejectedValue(
          new Error("Database error")
        );

        const itemNames = ["eggs"];

        await expect(
          toolExecutions.removeInventoryItem.execute({ itemNames })
        ).rejects.toThrow("Database error");
      });
    });
  });
});
