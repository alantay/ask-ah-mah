import { renderHook, act, waitFor } from "@testing-library/react";
import { useShareRecipe } from "./useShareRecipe";

jest.mock("@/contexts/SessionContext", () => ({
  useSessionContext: () => ({ userId: "user-1" }),
}));

const toastError = jest.fn();
const toastSuccess = jest.fn();
jest.mock("sonner", () => ({
  toast: {
    error: (...a: unknown[]) => toastError(...a),
    success: (...a: unknown[]) => toastSuccess(...a),
  },
}));

describe("useShareRecipe", () => {
  const originalFetch = global.fetch;
  const originalShare = (navigator as unknown as { share?: unknown }).share;
  const originalClipboard = navigator.clipboard;

  afterEach(() => {
    global.fetch = originalFetch;
    (navigator as unknown as { share?: unknown }).share = originalShare;
    Object.defineProperty(navigator, "clipboard", { value: originalClipboard, configurable: true });
    jest.clearAllMocks();
  });

  it("mints a token then calls navigator.share when available", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ token: "tok1" }) }) as never;
    const shareMock = jest.fn().mockResolvedValue(undefined);
    (navigator as unknown as { share: unknown }).share = shareMock;

    const { result } = renderHook(() => useShareRecipe("recipe-1", "Fried Rice"));
    await act(async () => {
      await result.current.share();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/recipe/recipe-1/share", { method: "POST" });
    expect(shareMock).toHaveBeenCalledWith({
      title: "Fried Rice",
      url: expect.stringContaining("/r/tok1"),
    });
  });

  it("falls back to clipboard + toast when navigator.share is unavailable", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ token: "tok2" }) }) as never;
    (navigator as unknown as { share?: unknown }).share = undefined;
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

    const { result } = renderHook(() => useShareRecipe("recipe-1"));
    await act(async () => {
      await result.current.share();
    });

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("/r/tok2"));
    expect(toastSuccess).toHaveBeenCalled();
  });

  it("silently ignores an AbortError from a cancelled native share sheet", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ token: "tok3" }) }) as never;
    const abortError = Object.assign(new Error("cancelled"), { name: "AbortError" });
    (navigator as unknown as { share: unknown }).share = jest.fn().mockRejectedValue(abortError);

    const { result } = renderHook(() => useShareRecipe("recipe-1"));
    await act(async () => {
      await result.current.share();
    });

    expect(toastError).not.toHaveBeenCalled();
  });

  it("toasts an error when minting the token fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as never;

    const { result } = renderHook(() => useShareRecipe("recipe-1"));
    await act(async () => {
      await result.current.share();
    });

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Couldn't make a link. Try again?"));
  });
});
