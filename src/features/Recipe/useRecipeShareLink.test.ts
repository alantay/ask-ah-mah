import { renderHook, act, waitFor } from "@testing-library/react";
import { useRecipeShareLink } from "./useRecipeShareLink";

const mockUseSessionContext = jest.fn(() => ({ userId: "user-1" as string | null }));
jest.mock("@/contexts/SessionContext", () => ({
  useSessionContext: () => mockUseSessionContext(),
}));

const toastError = jest.fn();
jest.mock("sonner", () => ({
  toast: {
    error: (...a: unknown[]) => toastError(...a),
  },
}));

describe("useRecipeShareLink", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    mockUseSessionContext.mockReturnValue({ userId: "user-1" });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("mints a token and derives the share url", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ token: "tok1" }) }) as never;

    const { result } = renderHook(() => useRecipeShareLink("recipe-1"));
    await act(async () => {
      await result.current.mint();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/recipe/recipe-1/share", { method: "POST" });
    expect(result.current.token).toBe("tok1");
    expect(result.current.url).toContain("/r/tok1");
  });

  it("does not re-mint once a token is already set", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ token: "tok1" }) }) as never;

    const { result } = renderHook(() => useRecipeShareLink("recipe-1"));
    await act(async () => {
      await result.current.mint();
    });
    await act(async () => {
      await result.current.mint();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("toasts an error when minting fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as never;

    const { result } = renderHook(() => useRecipeShareLink("recipe-1"));
    await act(async () => {
      await result.current.mint();
    });

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Couldn't make a link. Try again?"));
    expect(result.current.url).toBeNull();
  });

  it("does nothing without a signed-in user", async () => {
    mockUseSessionContext.mockReturnValue({ userId: null });
    global.fetch = jest.fn() as never;

    const { result } = renderHook(() => useRecipeShareLink("recipe-1"));
    await act(async () => {
      await result.current.mint();
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.url).toBeNull();
  });
});
