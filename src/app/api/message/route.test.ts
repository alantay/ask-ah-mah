import { GET, POST } from "./route";
import { createMessage, getMessages } from "@/lib/messages";
import { NextRequest } from "next/server";

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

// Mock the message functions
jest.mock("@/lib/messages", () => ({
  createMessage: jest.fn(),
  getMessages: jest.fn(),
}));

const mockedCreateMessage = jest.mocked(createMessage);
const mockedGetMessages = jest.mocked(getMessages);

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

describe("Message API Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("GET /api/message", () => {
    it("should return messages for valid userId", async () => {
      const mockMessages = [
        {
          id: "msg-1",
          userId: "user-123",
          content: "Hello",
          role: "user",
          createdAt: new Date("2024-01-01T10:00:00.000Z"),
        },
        {
          id: "msg-2",
          userId: "user-123",
          content: "Hi there!",
          role: "assistant",
          createdAt: new Date("2024-01-01T10:01:00.000Z"),
        },
      ];

      mockedGetMessages.mockResolvedValue(mockMessages);

      const request = createMockRequest(
        "http://localhost:3000/api/message?userId=user-123"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockMessages);
      expect(mockedGetMessages).toHaveBeenCalledWith("user-123");
      expect(mockedGetMessages).toHaveBeenCalledTimes(1);
    });

    it("should return empty array when no messages found", async () => {
      mockedGetMessages.mockResolvedValue([]);

      const request = createMockRequest(
        "http://localhost:3000/api/message?userId=user-456"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
      expect(mockedGetMessages).toHaveBeenCalledWith("user-456");
    });

    it("should return 400 when userId is missing", async () => {
      const request = createMockRequest("http://localhost:3000/api/message");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "userId is required" });
      expect(mockedGetMessages).not.toHaveBeenCalled();
    });

    it("should return 400 when userId is empty string", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/message?userId="
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "userId is required" });
      expect(mockedGetMessages).not.toHaveBeenCalled();
    });

    it("should handle database errors gracefully", async () => {
      mockedGetMessages.mockRejectedValue(new Error("Database error"));

      const request = createMockRequest(
        "http://localhost:3000/api/message?userId=user-123"
      );

      // The route doesn't have try-catch, so this will throw
      await expect(GET(request)).rejects.toThrow("Database error");
      expect(mockedGetMessages).toHaveBeenCalledWith("user-123");
    });

    it("should handle multiple query parameters correctly", async () => {
      const mockMessages = [
        {
          id: "msg-1",
          userId: "user-123",
          content: "Test message",
          role: "user",
          createdAt: new Date("2024-01-01T10:00:00.000Z"),
        },
      ];

      mockedGetMessages.mockResolvedValue(mockMessages);

      const request = createMockRequest(
        "http://localhost:3000/api/message?userId=user-123&otherParam=ignored"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockMessages);
      expect(mockedGetMessages).toHaveBeenCalledWith("user-123");
    });
  });

  describe("POST /api/message", () => {
    it("should create a user message successfully", async () => {
      const newMessage = {
        id: "msg-new",
        userId: "user-123",
        content: "What can I cook?",
        role: "user",
        createdAt: new Date("2024-01-01T10:00:00.000Z"),
      };

      mockedCreateMessage.mockResolvedValue(newMessage);

      const requestBody = {
        userId: "user-123",
        content: "What can I cook?",
        role: "user",
      };

      const request = createMockRequest("http://localhost:3000/api/message", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ message: newMessage });
      expect(mockedCreateMessage).toHaveBeenCalledWith(
        "user-123",
        "What can I cook?",
        "user"
      );
      expect(mockedCreateMessage).toHaveBeenCalledTimes(1);
    });

    it("should create an assistant message successfully", async () => {
      const assistantMessage = {
        id: "msg-assist",
        userId: "user-123",
        content: "You can make scrambled eggs!",
        role: "assistant",
        createdAt: new Date("2024-01-01T10:01:00.000Z"),
      };

      mockedCreateMessage.mockResolvedValue(assistantMessage);

      const requestBody = {
        userId: "user-123",
        content: "You can make scrambled eggs!",
        role: "assistant",
      };

      const request = createMockRequest("http://localhost:3000/api/message", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ message: assistantMessage });
      expect(mockedCreateMessage).toHaveBeenCalledWith(
        "user-123",
        "You can make scrambled eggs!",
        "assistant"
      );
    });

    it("should return 400 when userId is missing", async () => {
      const requestBody = {
        content: "Test message",
        role: "user",
      };

      const request = createMockRequest("http://localhost:3000/api/message", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: "userId, content, and role are required",
      });
      expect(mockedCreateMessage).not.toHaveBeenCalled();
    });

    it("should return 400 when content is missing", async () => {
      const requestBody = {
        userId: "user-123",
        role: "user",
      };

      const request = createMockRequest("http://localhost:3000/api/message", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: "userId, content, and role are required",
      });
      expect(mockedCreateMessage).not.toHaveBeenCalled();
    });

    it("should return 400 when role is missing", async () => {
      const requestBody = {
        userId: "user-123",
        content: "Test message",
      };

      const request = createMockRequest("http://localhost:3000/api/message", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: "userId, content, and role are required",
      });
      expect(mockedCreateMessage).not.toHaveBeenCalled();
    });

    it("should return 400 when fields are empty strings", async () => {
      const requestBody = {
        userId: "",
        content: "",
        role: "",
      };

      const request = createMockRequest("http://localhost:3000/api/message", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: "userId, content, and role are required",
      });
      expect(mockedCreateMessage).not.toHaveBeenCalled();
    });

    it("should handle partial empty fields", async () => {
      const testCases = [
        { userId: "", content: "test", role: "user" },
        { userId: "user-123", content: "", role: "user" },
        { userId: "user-123", content: "test", role: "" },
      ];

      for (const requestBody of testCases) {
        const request = createMockRequest("http://localhost:3000/api/message", {
          method: "POST",
          body: JSON.stringify(requestBody),
          headers: { "Content-Type": "application/json" },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toEqual({
          error: "userId, content, and role are required",
        });
      }

      expect(mockedCreateMessage).not.toHaveBeenCalled();
    });

    it("should handle special characters in content", async () => {
      const specialMessage = {
        id: "msg-special",
        userId: "user-123",
        content: "What's for 🍳 dinner? I have £10 & 2kg of 🥔!",
        role: "user",
        createdAt: new Date("2024-01-01T10:00:00.000Z"),
      };

      mockedCreateMessage.mockResolvedValue(specialMessage);

      const requestBody = {
        userId: "user-123",
        content: "What's for 🍳 dinner? I have £10 & 2kg of 🥔!",
        role: "user",
      };

      const request = createMockRequest("http://localhost:3000/api/message", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ message: specialMessage });
      expect(mockedCreateMessage).toHaveBeenCalledWith(
        "user-123",
        "What's for 🍳 dinner? I have £10 & 2kg of 🥔!",
        "user"
      );
    });

    it("should handle database errors during creation", async () => {
      mockedCreateMessage.mockRejectedValue(new Error("Database error"));

      const requestBody = {
        userId: "user-123",
        content: "Test message",
        role: "user",
      };

      const request = createMockRequest("http://localhost:3000/api/message", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      });

      // The route doesn't have try-catch, so this will throw
      await expect(POST(request)).rejects.toThrow("Database error");
      expect(mockedCreateMessage).toHaveBeenCalledWith(
        "user-123",
        "Test message",
        "user"
      );
    });

    it("should handle malformed JSON", async () => {
      const request = createMockRequest("http://localhost:3000/api/message", {
        method: "POST",
        body: "invalid json",
        headers: { "Content-Type": "application/json" },
      });

      // The route doesn't have try-catch, so this will throw
      await expect(POST(request)).rejects.toThrow();
    });

    it("should handle different role types", async () => {
      const systemMessage = {
        id: "msg-system",
        userId: "user-123",
        content: "System initialized",
        role: "system",
        createdAt: new Date("2024-01-01T10:00:00.000Z"),
      };

      mockedCreateMessage.mockResolvedValue(systemMessage);

      const requestBody = {
        userId: "user-123",
        content: "System initialized",
        role: "system",
      };

      const request = createMockRequest("http://localhost:3000/api/message", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ message: systemMessage });
      expect(mockedCreateMessage).toHaveBeenCalledWith(
        "user-123",
        "System initialized",
        "system"
      );
    });
  });
});
