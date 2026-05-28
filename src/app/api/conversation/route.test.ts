import { GET, POST } from "./route";
import {
  getOrCreateEmptyConversation,
  listConversations,
} from "@/lib/conversations";
import { NextRequest } from "next/server";
import type { ConversationEntity } from "@/lib/conversations";

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

jest.mock("@/lib/conversations", () => ({
  listConversations: jest.fn(),
  getOrCreateEmptyConversation: jest.fn(),
}));

const mockedListConversations = jest.mocked(listConversations);
const mockedGetOrCreateEmptyConversation = jest.mocked(getOrCreateEmptyConversation);

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

const emptyList: ConversationEntity[] = [];

function makeConversation(overrides: Partial<{
  id: string;
  userId: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: { messages: number };
}> = {}) {
  return {
    id: "conv-1",
    userId: "user-1",
    title: null,
    createdAt: new Date("2024-01-01T10:00:00.000Z"),
    updatedAt: new Date("2024-01-01T10:00:00.000Z"),
    _count: { messages: 0 },
    ...overrides,
  };
}

describe("Conversation API Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/conversation", () => {
    it("should return flat conversations for valid userId", async () => {
      const conv = makeConversation({ id: "conv-1" });
      mockedListConversations.mockResolvedValue([conv]);

      const request = createMockRequest(
        "http://localhost:3000/api/conversation?userId=user-1"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ conversations: [conv] });
      expect(mockedListConversations).toHaveBeenCalledWith("user-1");
    });

    it("should return 400 when userId is missing", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/conversation"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "userId is required" });
      expect(mockedListConversations).not.toHaveBeenCalled();
    });

    it("should return empty list when no conversations exist", async () => {
      mockedListConversations.mockResolvedValue(emptyList);

      const request = createMockRequest(
        "http://localhost:3000/api/conversation?userId=user-empty"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ conversations: emptyList });
    });
  });

  describe("POST /api/conversation", () => {
    it("should return the reusable empty conversation for valid userId", async () => {
      const newConv = makeConversation({ id: "conv-new", userId: "user-1" });
      mockedGetOrCreateEmptyConversation.mockResolvedValue(newConv);

      const request = createMockRequest(
        "http://localhost:3000/api/conversation",
        {
          method: "POST",
          body: JSON.stringify({ userId: "user-1" }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ conversation: newConv });
      expect(mockedGetOrCreateEmptyConversation).toHaveBeenCalledWith("user-1");
    });

    it("should return 400 when userId is missing", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/conversation",
        {
          method: "POST",
          body: JSON.stringify({}),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "userId is required" });
      expect(mockedGetOrCreateEmptyConversation).not.toHaveBeenCalled();
    });

    it("should handle database errors gracefully", async () => {
      mockedGetOrCreateEmptyConversation.mockRejectedValue(new Error("DB error"));

      const request = createMockRequest(
        "http://localhost:3000/api/conversation",
        {
          method: "POST",
          body: JSON.stringify({ userId: "user-1" }),
          headers: { "Content-Type": "application/json" },
        }
      );

      await expect(POST(request)).rejects.toThrow("DB error");
    });
  });
});
