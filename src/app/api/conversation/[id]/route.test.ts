import { DELETE, PATCH } from "./route";
import {
  autoTitleIfNull,
  deleteConversation,
  renameConversation,
} from "@/lib/conversations";
import { NextRequest } from "next/server";

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
  renameConversation: jest.fn(),
  autoTitleIfNull: jest.fn(),
  deleteConversation: jest.fn(),
}));

const mockedRenameConversation = jest.mocked(renameConversation);
const mockedAutoTitleIfNull = jest.mocked(autoTitleIfNull);
const mockedDeleteConversation = jest.mocked(deleteConversation);

global.Response = class {
  status: number;

  constructor(_body?: BodyInit | null, init?: ResponseInit) {
    this.status = init?.status ?? 200;
  }
} as typeof Response;

const createMockRequest = (url: string, options: RequestInit = {}) =>
  ({
    nextUrl: new URL(url),
    json: async () => {
      if (options.body) {
        return JSON.parse(options.body as string);
      }
      return {};
    },
  }) as NextRequest;

const params = Promise.resolve({ id: "conv-1" });

describe("Conversation by-id API routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("PATCH /api/conversation/[id]", () => {
    it("renames a conversation", async () => {
      const conversation = { id: "conv-1", title: "Weeknight noodles" };
      mockedRenameConversation.mockResolvedValue(conversation as never);

      const request = createMockRequest("http://localhost:3000/api/conversation/conv-1", {
        method: "PATCH",
        body: JSON.stringify({ title: "Weeknight noodles" }),
      });

      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ conversation });
      expect(mockedRenameConversation).toHaveBeenCalledWith(
        "conv-1",
        "Weeknight noodles"
      );
    });

    it("keeps auto-title rename behaviour", async () => {
      const conversation = { id: "conv-1", title: "Egg ideas" };
      mockedAutoTitleIfNull.mockResolvedValue(conversation as never);

      const request = createMockRequest("http://localhost:3000/api/conversation/conv-1", {
        method: "PATCH",
        body: JSON.stringify({ title: "Egg ideas", autoTitle: true }),
      });

      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ conversation });
      expect(mockedAutoTitleIfNull).toHaveBeenCalledWith("conv-1", "Egg ideas");
    });

    it("returns 400 when title is missing", async () => {
      const request = createMockRequest("http://localhost:3000/api/conversation/conv-1", {
        method: "PATCH",
        body: JSON.stringify({}),
      });

      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "title is required" });
    });
  });

  describe("DELETE /api/conversation/[id]", () => {
    it("returns 204 on success", async () => {
      mockedDeleteConversation.mockResolvedValue(undefined);

      const request = createMockRequest(
        "http://localhost:3000/api/conversation/conv-1?userId=user-1",
        { method: "DELETE" }
      );

      const response = await DELETE(request, { params });

      expect(response.status).toBe(204);
      expect(mockedDeleteConversation).toHaveBeenCalledWith("conv-1", "user-1");
    });

    it("returns 404 when the conversation does not belong to the user", async () => {
      mockedDeleteConversation.mockRejectedValue(new Error("Conversation not found"));

      const request = createMockRequest(
        "http://localhost:3000/api/conversation/conv-1?userId=user-1",
        { method: "DELETE" }
      );

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: "Conversation not found" });
    });
  });
});
