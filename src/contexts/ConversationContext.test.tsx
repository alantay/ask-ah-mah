import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  ConversationProvider,
  useConversationContext,
} from "./ConversationContext";

type Conversation = {
  id: string;
  userId: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { messages: number };
};

type SwrPayload =
  | { conversation: Conversation }
  | { conversations: Conversation[] }
  | undefined;

const swrData = new Map<string, SwrPayload>();
const mockMutate = jest.fn();

jest.mock("swr", () => ({
  __esModule: true,
  default: jest.fn((key: string | null) => ({
    data: key ? swrData.get(key) : undefined,
    isLoading: false,
  })),
  mutate: (...args: unknown[]) => mockMutate(...args),
}));

const mockUserId = "user-test-123";

jest.mock("@/contexts/SessionContext", () => ({
  useSessionContext: jest.fn(() => ({ userId: mockUserId, isLoading: false })),
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
  },
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeConversation(
  id = "conv-1",
  overrides: Partial<Conversation> = {}
): Conversation {
  return {
    id,
    userId: mockUserId,
    title: null,
    createdAt: new Date("2024-01-02T10:00:00.000Z"),
    updatedAt: new Date("2024-01-02T10:00:00.000Z"),
    _count: { messages: 0 },
    ...overrides,
  };
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ConversationProvider>{children}</ConversationProvider>
);

describe("ConversationContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    swrData.clear();
    localStorageMock.clear();
    mockMutate.mockResolvedValue(undefined);
  });

  it("throws when used outside ConversationProvider", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => useConversationContext());
    }).toThrow("useConversationContext must be used within a ConversationProvider");

    consoleSpy.mockRestore();
  });

  it("sets activeConversationId from the active-conversation endpoint when localStorage is empty", async () => {
    const conversation = makeConversation("conv-from-api");
    swrData.set(
      `/api/conversation?active=true&userId=${mockUserId}`,
      { conversation }
    );
    swrData.set(`/api/conversation?userId=${mockUserId}`, {
      conversations: [conversation],
    });

    const { result } = renderHook(() => useConversationContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.activeConversationId).toBe("conv-from-api");
    });
  });

  it("uses the localStorage value instead of fetching an active conversation", () => {
    localStorageMock.getItem.mockReturnValueOnce("conv-from-storage");
    swrData.set(`/api/conversation?userId=${mockUserId}`, {
      conversations: [makeConversation("conv-from-storage")],
    });

    const { result } = renderHook(() => useConversationContext(), { wrapper });

    expect(result.current.activeConversationId).toBe("conv-from-storage");
  });

  it("startNewConversation reuses the server-returned empty conversation", async () => {
    const current = makeConversation("conv-current", {
      title: "Dinner",
      _count: { messages: 2 },
    });
    const empty = makeConversation("conv-empty");
    localStorageMock.getItem.mockReturnValueOnce("conv-current");
    swrData.set(`/api/conversation?userId=${mockUserId}`, {
      conversations: [current, empty],
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ conversation: empty }),
    });

    const { result } = renderHook(() => useConversationContext(), { wrapper });

    await act(async () => {
      await result.current.startNewConversation();
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: mockUserId }),
    });
    expect(result.current.activeConversationId).toBe("conv-empty");
  });

  it("renameActiveConversation PATCHes the active id", async () => {
    const conversation = makeConversation("conv-abc");
    localStorageMock.getItem.mockReturnValueOnce("conv-abc");
    swrData.set(`/api/conversation?userId=${mockUserId}`, {
      conversations: [conversation],
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ conversation: { ...conversation, title: "My Kitchen" } }),
    });

    const { result } = renderHook(() => useConversationContext(), { wrapper });

    await act(async () => {
      await result.current.renameActiveConversation("My Kitchen");
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/conversation/conv-abc", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "My Kitchen" }),
    });
  });

  it("deleteActiveConversation fires DELETE immediately and switches active conversation", async () => {
    const active = makeConversation("conv-delete", {
      title: "Laksa",
      _count: { messages: 3 },
    });
    const fallback = makeConversation("conv-fallback", {
      title: "Egg ideas",
      _count: { messages: 1 },
    });
    localStorageMock.getItem.mockReturnValueOnce("conv-delete");
    swrData.set(`/api/conversation?userId=${mockUserId}`, {
      conversations: [active, fallback],
    });
    mockFetch.mockResolvedValueOnce({ ok: true });

    const { result } = renderHook(() => useConversationContext(), { wrapper });

    await act(async () => {
      await result.current.deleteActiveConversation();
    });

    expect(result.current.activeConversationId).toBe("conv-fallback");
    expect(mockFetch).toHaveBeenCalledWith(
      `/api/conversation/conv-delete?userId=${encodeURIComponent(mockUserId)}`,
      { method: "DELETE" }
    );
  });

  it("deleteActiveConversation rolls back optimistic update and shows error toast on DELETE failure", async () => {
    const { toast } = await import("sonner");
    const active = makeConversation("conv-delete", {
      title: "Laksa",
      _count: { messages: 3 },
    });
    const fallback = makeConversation("conv-fallback", {
      title: "Egg ideas",
      _count: { messages: 1 },
    });
    localStorageMock.getItem.mockReturnValueOnce("conv-delete");
    swrData.set(`/api/conversation?userId=${mockUserId}`, {
      conversations: [active, fallback],
    });
    mockFetch.mockResolvedValueOnce({ ok: false });

    const { result } = renderHook(() => useConversationContext(), { wrapper });

    await act(async () => {
      await result.current.deleteActiveConversation();
    });

    expect(result.current.activeConversationId).toBe("conv-delete");
    expect(toast.error).toHaveBeenCalledWith(
      "Could not delete conversation. Try again."
    );
  });
});
