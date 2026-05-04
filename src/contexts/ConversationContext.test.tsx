/**
 * Tests for ConversationContext
 *
 * Strategy:
 * - Mock SWR so we control what the hook returns without real network calls
 * - Mock fetch for POST/PATCH mutations
 * - Mock SessionContext so we can supply a userId
 * - Use React Testing Library renderHook / render to exercise the context
 */

import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
  ConversationProvider,
  useConversationContext,
} from "./ConversationContext";

// ── Mock SWR ──────────────────────────────────────────────────────────────────

type SwrMockReturn = {
  data: { conversation: { id: string; title: null; createdAt: Date; updatedAt: Date; userId: string; archived: boolean } } | undefined;
  isLoading: boolean;
};

let swrMockReturn: SwrMockReturn = { data: undefined, isLoading: false };

jest.mock("swr", () => ({
  __esModule: true,
  default: jest.fn(() => swrMockReturn),
  mutate: jest.fn(),
}));

// ── Mock SessionContext ───────────────────────────────────────────────────────

const mockUserId = "user-test-123";

jest.mock("@/contexts/SessionContext", () => ({
  useSessionContext: jest.fn(() => ({ userId: mockUserId, isLoading: false })),
}));

// ── Mock localStorage ─────────────────────────────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

// ── Mock fetch ────────────────────────────────────────────────────────────────

const mockFetch = jest.fn();
global.fetch = mockFetch;

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeConversation(id = "conv-1") {
  return {
    id,
    userId: mockUserId,
    title: null,
    archived: false,
    createdAt: new Date("2024-01-02T10:00:00.000Z"),
    updatedAt: new Date("2024-01-02T10:00:00.000Z"),
  };
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ConversationProvider>{children}</ConversationProvider>
);

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ConversationContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    swrMockReturn = { data: undefined, isLoading: false };
  });

  describe("useConversationContext outside provider", () => {
    it("throws when used outside ConversationProvider", () => {
      // Suppress React error boundary noise in test output
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useConversationContext());
      }).toThrow("useConversationContext must be used within a ConversationProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("ConversationProvider mounting", () => {
    it("sets activeConversationId from the active-conversation endpoint when localStorage is empty", async () => {
      const conv = makeConversation("conv-from-api");
      swrMockReturn = {
        data: { conversation: conv },
        isLoading: false,
      };

      const { result } = renderHook(() => useConversationContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.activeConversationId).toBe("conv-from-api");
      });
    });

    it("uses the localStorage value instead of calling API when present", () => {
      localStorageMock.getItem.mockReturnValueOnce("conv-from-storage");

      // SWR should NOT be called with a key when localStorage has a value
      swrMockReturn = { data: undefined, isLoading: false };

      const { result } = renderHook(() => useConversationContext(), { wrapper });

      expect(result.current.activeConversationId).toBe("conv-from-storage");
    });

    it("exposes isLoading=true while SWR is loading and no localStorage value", () => {
      swrMockReturn = { data: undefined, isLoading: true };

      const { result } = renderHook(() => useConversationContext(), { wrapper });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe("startNewConversation", () => {
    it("POSTs to /api/conversation and updates activeConversationId", async () => {
      const newConv = makeConversation("conv-new");
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversation: newConv }),
      });

      // Start with a stored conversation so context is not in loading state
      localStorageMock.getItem.mockReturnValueOnce("conv-old");

      const { result } = renderHook(() => useConversationContext(), { wrapper });

      await act(async () => {
        await result.current.startNewConversation();
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: mockUserId }),
      });

      expect(result.current.activeConversationId).toBe("conv-new");
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "ask-ah-mah-active-conversation",
        "conv-new"
      );
    });
  });

  describe("renameActiveConversation", () => {
    it("PATCHes /api/conversation/:id with the new title", async () => {
      localStorageMock.getItem.mockReturnValueOnce("conv-abc");
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversation: { ...makeConversation("conv-abc"), title: "My Kitchen" } }),
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

    it("does nothing when activeConversationId is null", async () => {
      swrMockReturn = { data: undefined, isLoading: false };

      const { result } = renderHook(() => useConversationContext(), { wrapper });

      await act(async () => {
        await result.current.renameActiveConversation("Ignored");
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("archiveActiveConversation", () => {
    it("PATCHes with { archived: true } then POSTs to create a new conversation", async () => {
      localStorageMock.getItem.mockReturnValueOnce("conv-to-archive");

      const newConv = makeConversation("conv-fresh");

      // First call: PATCH archive
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      // Second call: POST startNewConversation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversation: newConv }),
      });

      const { result } = renderHook(() => useConversationContext(), { wrapper });

      await act(async () => {
        await result.current.archiveActiveConversation();
      });

      // First fetch: PATCH with archived: true
      expect(mockFetch).toHaveBeenNthCalledWith(1, "/api/conversation/conv-to-archive", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true }),
      });

      // Second fetch: POST /api/conversation to create a new one
      expect(mockFetch).toHaveBeenNthCalledWith(2, "/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: mockUserId }),
      });

      expect(result.current.activeConversationId).toBe("conv-fresh");
    });
  });
});
