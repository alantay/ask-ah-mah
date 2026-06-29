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

  it("starts in staging state (null) when localStorage is empty", () => {
    swrData.set(`/api/conversation?userId=${mockUserId}`, {
      conversations: [makeConversation("conv-from-api")],
    });

    const { result } = renderHook(() => useConversationContext(), { wrapper });

    expect(result.current.activeConversationId).toBe(null);
  });

  it("uses the localStorage value instead of fetching an active conversation", () => {
    localStorageMock.getItem.mockReturnValueOnce("conv-from-storage");
    swrData.set(`/api/conversation?userId=${mockUserId}`, {
      conversations: [makeConversation("conv-from-storage")],
    });

    const { result } = renderHook(() => useConversationContext(), { wrapper });

    expect(result.current.activeConversationId).toBe("conv-from-storage");
  });

  it("startNewConversation clears active id and enters staging state without a fetch", () => {
    const current = makeConversation("conv-current", {
      title: "Dinner",
      _count: { messages: 2 },
    });
    localStorageMock.getItem.mockReturnValueOnce("conv-current");
    swrData.set(`/api/conversation?userId=${mockUserId}`, {
      conversations: [current],
    });

    const { result } = renderHook(() => useConversationContext(), { wrapper });

    act(() => {
      result.current.startNewConversation();
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.activeConversationId).toBe(null);
  });

  it("renameConversation PATCHes the given id", async () => {
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
      await result.current.renameConversation("conv-abc", "My Kitchen");
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/conversation/conv-abc", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "My Kitchen" }),
    });
  });

  it("deleteConversation fires DELETE immediately and switches active conversation when deleting active id", async () => {
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
      await result.current.deleteConversation("conv-delete");
    });

    expect(result.current.activeConversationId).toBe("conv-fallback");
    expect(mockFetch).toHaveBeenCalledWith(
      `/api/conversation/conv-delete`,
      { method: "DELETE" }
    );
  });

  it("deleteConversation rolls back optimistic update and shows error toast on DELETE failure", async () => {
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
      await result.current.deleteConversation("conv-delete");
    });

    await waitFor(() => {
      expect(result.current.activeConversationId).toBe("conv-delete");
    });
    expect(toast.error).toHaveBeenCalledWith(
      "Could not delete conversation. Try again."
    );
  });

  it("deleteConversation rolls back to original active id when no fallback exists and DELETE fails", async () => {
    const { toast } = await import("sonner");
    // Only one conversation with messages — enters staging state, then rolls back on failure
    const active = makeConversation("conv-only", {
      title: "Solo Chat",
      _count: { messages: 2 },
    });
    localStorageMock.getItem.mockReturnValueOnce("conv-only");
    swrData.set(`/api/conversation?userId=${mockUserId}`, {
      conversations: [active],
    });

    // DELETE fails
    mockFetch.mockResolvedValueOnce({ ok: false });

    const { result } = renderHook(() => useConversationContext(), { wrapper });

    await act(async () => {
      await result.current.deleteConversation("conv-only");
    });

    // After DELETE failure the original active id must be restored
    await waitFor(() => {
      expect(result.current.activeConversationId).toBe("conv-only");
    });
    // SWR cache rolled back — globalMutate called with previousConversations (the original list)
    expect(mockMutate).toHaveBeenCalledWith(
      `/api/conversation?userId=${mockUserId}`,
      { conversations: [active] },
      false
    );
    expect(toast.error).toHaveBeenCalledWith(
      "Could not delete conversation. Try again."
    );
  });

  it("deleteConversation leaves activeConversationId unchanged when deleting a non-active conversation", async () => {
    const active = makeConversation("conv-active", {
      title: "Active Chat",
      _count: { messages: 2 },
    });
    const other = makeConversation("conv-other", {
      title: "Other Chat",
      _count: { messages: 1 },
    });
    localStorageMock.getItem.mockReturnValueOnce("conv-active");
    swrData.set(`/api/conversation?userId=${mockUserId}`, {
      conversations: [active, other],
    });
    mockFetch.mockResolvedValueOnce({ ok: true });

    const { result } = renderHook(() => useConversationContext(), { wrapper });

    await act(async () => {
      await result.current.deleteConversation("conv-other");
    });

    expect(result.current.activeConversationId).toBe("conv-active");
    expect(mockFetch).toHaveBeenCalledWith(
      `/api/conversation/conv-other`,
      { method: "DELETE" }
    );
  });
});
