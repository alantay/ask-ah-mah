import { GET, POST } from "./route";
import { createMessage, getMessages } from "@/lib/messages";
import { getSessionUserId } from "@/lib/session";
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

jest.mock("@/lib/session", () => ({ getSessionUserId: jest.fn() }));

// Mock conversations lib (pulls in ai SDK which requires TransformStream)
jest.mock("@/lib/conversations", () => ({
  autoTitleConversation: jest.fn().mockResolvedValue(undefined),
  maybeAutoTitleConversation: jest.fn().mockResolvedValue(undefined),
}));

// Mock prisma
jest.mock("@/lib/db", () => ({
  prisma: {
    message: {
      count: jest.fn().mockResolvedValue(0),
    },
  },
}));

const mockedCreateMessage = jest.mocked(createMessage);
const mockedGetMessages = jest.mocked(getMessages);
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

describe("Message API Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockedGetSessionUserId.mockResolvedValue("user-123");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("GET /api/message", () => {
    it("should return messages for valid conversationId", async () => {
      const mockMessages = [
        {
          id: "msg-1",
          conversationId: "conv-123",
          userId: "user-123",
          content: "Hello",
          role: "user",
          createdAt: new Date("2024-01-01T10:00:00.000Z"),
        },
        {
          id: "msg-2",
          conversationId: "conv-123",
          userId: "user-123",
          content: "Hi there!",
          role: "assistant",
          createdAt: new Date("2024-01-01T10:01:00.000Z"),
        },
      ];

      mockedGetMessages.mockResolvedValue(mockMessages);

      const request = createMockRequest(
        "http://localhost:3000/api/message?conversationId=conv-123"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockMessages);
      expect(mockedGetMessages).toHaveBeenCalledWith("conv-123", "user-123");
      expect(mockedGetMessages).toHaveBeenCalledTimes(1);
    });

    it("should return empty array when no messages found", async () => {
      mockedGetMessages.mockResolvedValue([]);

      const request = createMockRequest(
        "http://localhost:3000/api/message?conversationId=conv-456"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
      expect(mockedGetMessages).toHaveBeenCalledWith("conv-456", "user-123");
    });

    it("should return 401 when unauthenticated", async () => {
      mockedGetSessionUserId.mockResolvedValue(null);
      const request = createMockRequest(
        "http://localhost:3000/api/message?conversationId=conv-123"
      );
      const response = await GET(request);

      expect(response.status).toBe(401);
      expect(mockedGetMessages).not.toHaveBeenCalled();
    });

    it("should return 400 when conversationId is missing", async () => {
      const request = createMockRequest("http://localhost:3000/api/message");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "conversationId is required" });
      expect(mockedGetMessages).not.toHaveBeenCalled();
    });

    it("should return 400 when conversationId is empty string", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/message?conversationId="
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "conversationId is required" });
      expect(mockedGetMessages).not.toHaveBeenCalled();
    });

    it("should handle database errors gracefully", async () => {
      mockedGetMessages.mockRejectedValue(new Error("Database error"));

      const request = createMockRequest(
        "http://localhost:3000/api/message?conversationId=conv-123"
      );

      await expect(GET(request)).rejects.toThrow("Database error");
      expect(mockedGetMessages).toHaveBeenCalledWith("conv-123", "user-123");
    });

    it("should handle multiple query parameters correctly", async () => {
      const mockMessages = [
        {
          id: "msg-1",
          conversationId: "conv-123",
          userId: "user-123",
          content: "Test message",
          role: "user",
          createdAt: new Date("2024-01-01T10:00:00.000Z"),
        },
      ];

      mockedGetMessages.mockResolvedValue(mockMessages);

      const request = createMockRequest(
        "http://localhost:3000/api/message?conversationId=conv-123&otherParam=ignored"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockMessages);
      expect(mockedGetMessages).toHaveBeenCalledWith("conv-123", "user-123");
    });
  });

  describe("POST /api/message", () => {
    it("should create a user message successfully", async () => {
      const newMessage = {
        id: "msg-new",
        conversationId: "conv-123",
        userId: "user-123",
        content: "What can I cook?",
        role: "user",
        createdAt: new Date("2024-01-01T10:00:00.000Z"),
      };

      mockedCreateMessage.mockResolvedValue(newMessage);

      const requestBody = {
        conversationId: "conv-123",
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
        "conv-123",
        "user-123",
        "What can I cook?",
        "user"
      );
      expect(mockedCreateMessage).toHaveBeenCalledTimes(1);
    });

    it("should create an assistant message successfully", async () => {
      const assistantMessage = {
        id: "msg-assist",
        conversationId: "conv-123",
        userId: "user-123",
        content: "You can make scrambled eggs!",
        role: "assistant",
        createdAt: new Date("2024-01-01T10:01:00.000Z"),
      };

      mockedCreateMessage.mockResolvedValue(assistantMessage);

      const requestBody = {
        conversationId: "conv-123",
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
        "conv-123",
        "user-123",
        "You can make scrambled eggs!",
        "assistant"
      );
    });

    it("should return 400 when conversationId is missing", async () => {
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

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: "conversationId, content, and role are required",
      });
      expect(mockedCreateMessage).not.toHaveBeenCalled();
    });

    it("should return 401 when unauthenticated", async () => {
      mockedGetSessionUserId.mockResolvedValue(null);
      const requestBody = {
        conversationId: "conv-123",
        content: "Test message",
        role: "user",
      };

      const request = createMockRequest("http://localhost:3000/api/message", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      expect(mockedCreateMessage).not.toHaveBeenCalled();
    });

    it("ignores a userId in the body and writes as the session user", async () => {
      const newMessage = {
        id: "msg-new",
        conversationId: "conv-123",
        userId: "user-123",
        content: "Test message",
        role: "user",
        createdAt: new Date("2024-01-01T10:00:00.000Z"),
      };
      mockedCreateMessage.mockResolvedValue(newMessage);

      const request = createMockRequest("http://localhost:3000/api/message", {
        method: "POST",
        body: JSON.stringify({
          conversationId: "conv-123",
          userId: "victim-999",
          content: "Test message",
          role: "user",
        }),
        headers: { "Content-Type": "application/json" },
      });

      await POST(request);

      expect(mockedCreateMessage).toHaveBeenCalledTimes(1);
      expect(mockedCreateMessage).toHaveBeenCalledWith(
        "conv-123",
        "user-123",
        "Test message",
        "user"
      );
    });

    it("returns 404 when writing to a conversation the user does not own", async () => {
      mockedCreateMessage.mockRejectedValue(
        new Error("Conversation not found")
      );

      const request = createMockRequest("http://localhost:3000/api/message", {
        method: "POST",
        body: JSON.stringify({
          conversationId: "conv-foreign",
          content: "Hijack",
          role: "user",
        }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: "Conversation not found" });
    });

    it("should return 400 when content is missing", async () => {
      const requestBody = {
        conversationId: "conv-123",
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
        error: "conversationId, content, and role are required",
      });
      expect(mockedCreateMessage).not.toHaveBeenCalled();
    });

    it("should return 400 when role is missing", async () => {
      const requestBody = {
        conversationId: "conv-123",
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
        error: "conversationId, content, and role are required",
      });
      expect(mockedCreateMessage).not.toHaveBeenCalled();
    });

    it("should return 400 when fields are empty strings", async () => {
      const requestBody = {
        conversationId: "",
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
        error: "conversationId, content, and role are required",
      });
      expect(mockedCreateMessage).not.toHaveBeenCalled();
    });

    it("should handle special characters in content", async () => {
      const specialMessage = {
        id: "msg-special",
        conversationId: "conv-123",
        userId: "user-123",
        content: "What's for 🍳 dinner? I have £10 & 2kg of 🥔!",
        role: "user",
        createdAt: new Date("2024-01-01T10:00:00.000Z"),
      };

      mockedCreateMessage.mockResolvedValue(specialMessage);

      const requestBody = {
        conversationId: "conv-123",
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
        "conv-123",
        "user-123",
        "What's for 🍳 dinner? I have £10 & 2kg of 🥔!",
        "user"
      );
    });

    it("should handle database errors during creation", async () => {
      mockedCreateMessage.mockRejectedValue(new Error("Database error"));

      const requestBody = {
        conversationId: "conv-123",
        userId: "user-123",
        content: "Test message",
        role: "user",
      };

      const request = createMockRequest("http://localhost:3000/api/message", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      });

      await expect(POST(request)).rejects.toThrow("Database error");
      expect(mockedCreateMessage).toHaveBeenCalledWith(
        "conv-123",
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

      await expect(POST(request)).rejects.toThrow();
    });

    it("should handle different role types", async () => {
      const systemMessage = {
        id: "msg-system",
        conversationId: "conv-123",
        userId: "user-123",
        content: "System initialized",
        role: "system",
        createdAt: new Date("2024-01-01T10:00:00.000Z"),
      };

      mockedCreateMessage.mockResolvedValue(systemMessage);

      const requestBody = {
        conversationId: "conv-123",
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
        "conv-123",
        "user-123",
        "System initialized",
        "system"
      );
    });
  });
});
