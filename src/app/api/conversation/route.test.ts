import { GET, POST } from "./route";
import {
  getOrCreateEmptyConversation,
  listConversations,
} from "@/lib/conversations";
import { getSessionUserId } from "@/lib/session";
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

jest.mock("@/lib/session", () => ({ getSessionUserId: jest.fn() }));

const mockedListConversations = jest.mocked(listConversations);
const mockedGetOrCreateEmptyConversation = jest.mocked(getOrCreateEmptyConversation);
const mockedGetSessionUserId = jest.mocked(getSessionUserId);

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
    mockedGetSessionUserId.mockResolvedValue("user-1");
  });

  describe("GET /api/conversation", () => {
    it("should return flat conversations for the session user", async () => {
      const conv = makeConversation({ id: "conv-1" });
      mockedListConversations.mockResolvedValue([conv]);

      const request = createMockRequest("http://localhost:3000/api/conversation");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ conversations: [conv] });
      expect(mockedListConversations).toHaveBeenCalledWith("user-1");
    });

    it("should return 401 when unauthenticated", async () => {
      mockedGetSessionUserId.mockResolvedValue(null);
      const request = createMockRequest(
        "http://localhost:3000/api/conversation"
      );
      const response = await GET(request);

      expect(response.status).toBe(401);
      expect(mockedListConversations).not.toHaveBeenCalled();
    });

    it("ignores a userId in the query and uses the session user", async () => {
      mockedListConversations.mockResolvedValue(emptyList);
      const request = createMockRequest(
        "http://localhost:3000/api/conversation?userId=victim-999"
      );
      await GET(request);

      expect(mockedListConversations).toHaveBeenCalledTimes(1);
      expect(mockedListConversations).toHaveBeenCalledWith("user-1");
    });

    it("should return empty list when no conversations exist", async () => {
      mockedListConversations.mockResolvedValue(emptyList);

      const request = createMockRequest("http://localhost:3000/api/conversation");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ conversations: emptyList });
    });
  });

  describe("POST /api/conversation", () => {
    it("should return the reusable empty conversation for the session user", async () => {
      const newConv = makeConversation({ id: "conv-new", userId: "user-1" });
      mockedGetOrCreateEmptyConversation.mockResolvedValue(newConv);

      const request = createMockRequest(
        "http://localhost:3000/api/conversation",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ conversation: newConv });
      expect(mockedGetOrCreateEmptyConversation).toHaveBeenCalledWith("user-1");
    });

    it("should return 401 when unauthenticated", async () => {
      mockedGetSessionUserId.mockResolvedValue(null);
      const request = createMockRequest(
        "http://localhost:3000/api/conversation",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(401);
      expect(mockedGetOrCreateEmptyConversation).not.toHaveBeenCalled();
    });

    it("ignores a userId in the body and uses the session user", async () => {
      const newConv = makeConversation({ id: "conv-new", userId: "user-1" });
      mockedGetOrCreateEmptyConversation.mockResolvedValue(newConv);
      const request = createMockRequest(
        "http://localhost:3000/api/conversation",
        {
          method: "POST",
          body: JSON.stringify({ userId: "victim-999" }),
          headers: { "Content-Type": "application/json" },
        }
      );

      await POST(request);

      expect(mockedGetOrCreateEmptyConversation).toHaveBeenCalledTimes(1);
      expect(mockedGetOrCreateEmptyConversation).toHaveBeenCalledWith("user-1");
    });

    it("should handle database errors gracefully", async () => {
      mockedGetOrCreateEmptyConversation.mockRejectedValue(new Error("DB error"));

      const request = createMockRequest(
        "http://localhost:3000/api/conversation",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      await expect(POST(request)).rejects.toThrow("DB error");
    });
  });
});
