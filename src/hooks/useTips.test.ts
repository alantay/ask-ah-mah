import { renderHook } from "@testing-library/react";
import { useTips } from "./useTips";
import { marketTipKey, storageTipKey } from "@/lib/swr/keys";

// Mirrors the mocking pattern in ConversationContext.test.tsx: mock the
// `swr` module entirely so we can inspect exactly what key/fetcher useTips
// hands to useSWR, without needing a real network layer or SWR cache.
const mockUseSWR = jest.fn();

jest.mock("swr", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseSWR(...args),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("useTips", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSWR.mockReturnValue({ data: undefined, isValidating: false });
  });

  describe("market-only pickable filter", () => {
    it("filters non-pickable items out of the market request", () => {
      const items = [
        { name: "Salt", category: "condiments" }, // non-pickable
        { name: "Carrot", category: "vegetable" }, // pickable
      ];

      renderHook(() => useTips("market", items));

      const [key] = mockUseSWR.mock.calls[0];
      expect(key).toBe(marketTipKey(["carrot"]));
    });

    it("does not filter items for storage requests", () => {
      const items = [
        { name: "Salt", category: "condiments" },
        { name: "Carrot", category: "vegetable" },
      ];

      renderHook(() => useTips("storage", items));

      const [key] = mockUseSWR.mock.calls[0];
      expect(key).toBe(storageTipKey(["carrot", "salt"]));
    });

    it("sends only the filtered items in the market fetch body", async () => {
      const items = [
        { name: "Salt", category: "condiments" },
        { name: "Carrot", category: "vegetable" },
      ];
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ tips: {} }),
      });

      renderHook(() => useTips("market", items));

      const [, fetcher] = mockUseSWR.mock.calls[0];
      await fetcher();

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/market-tip",
        expect.objectContaining({
          body: JSON.stringify({ items: [{ name: "Carrot", category: "vegetable" }] }),
        }),
      );
    });
  });

  describe("enabled gating", () => {
    it("returns empty tips and isLoading=false, with no request, when disabled", () => {
      const items = [{ name: "Carrot", category: "vegetable" }];

      const { result } = renderHook(() => useTips("market", items, false));

      expect(result.current).toEqual({ tips: {}, isLoading: false });
      const [key] = mockUseSWR.mock.calls[0];
      expect(key).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("key construction", () => {
    it("builds distinct market vs storage keys with expected prefixes for the same items", () => {
      const items = [{ name: "Carrot", category: "vegetable" }];

      renderHook(() => useTips("market", items));
      const [marketKey] = mockUseSWR.mock.calls[0];

      renderHook(() => useTips("storage", items));
      const [storageKey] = mockUseSWR.mock.calls[1];

      expect(marketKey).toBe(marketTipKey(["carrot"]));
      expect(storageKey).toBe(storageTipKey(["carrot"]));
      expect(marketKey).not.toBe(storageKey);
      expect(marketKey).toMatch(/^market-tip:/);
      expect(storageKey).toMatch(/^storage-tip:/);
    });
  });

  describe("null/empty gating", () => {
    it("issues no request when the item list is empty", () => {
      const { result } = renderHook(() => useTips("market", []));

      const [key] = mockUseSWR.mock.calls[0];
      expect(key).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
      // enabled stays true, so isLoading reflects SWR's isValidating (false here)
      expect(result.current).toEqual({ tips: {}, isLoading: false });
    });

    it("issues no request when every item is filtered out for market", () => {
      const items = [{ name: "Salt", category: "condiments" }];

      renderHook(() => useTips("market", items));

      const [key] = mockUseSWR.mock.calls[0];
      expect(key).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
