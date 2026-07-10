import {
  SWR_CACHE_KEY,
  clearSwrCache,
  localStorageProvider,
} from "./swr-cache";

describe("localStorageProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts empty when nothing is persisted", () => {
    expect(localStorageProvider().size).toBe(0);
  });

  it("hydrates the map from a persisted blob", () => {
    window.localStorage.setItem(
      SWR_CACHE_KEY,
      JSON.stringify([["/api/recipe?userId=u1", { data: [{ id: "r1" }] }]]),
    );

    const map = localStorageProvider();

    expect(map.get("/api/recipe?userId=u1")).toEqual({ data: [{ id: "r1" }] });
  });

  it("persists the map when the page is hidden", () => {
    const map = localStorageProvider();
    map.set("/api/recipe?userId=u1", { data: [{ id: "r1" }] });

    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      configurable: true,
    });
    window.dispatchEvent(new Event("visibilitychange"));

    const raw = window.localStorage.getItem(SWR_CACHE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toEqual([
      ["/api/recipe?userId=u1", { data: [{ id: "r1" }] }],
    ]);
  });

  it("starts fresh when the persisted blob is corrupt", () => {
    window.localStorage.setItem(SWR_CACHE_KEY, "not json");
    expect(() => localStorageProvider()).not.toThrow();
    expect(localStorageProvider().size).toBe(0);
  });
});

describe("clearSwrCache", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("clears all keys and removes the persisted blob", () => {
    window.localStorage.setItem(SWR_CACHE_KEY, JSON.stringify([["k", { data: 1 }]]));
    const mutate = jest.fn();

    clearSwrCache(mutate as never);

    // Wipes every in-memory entry without revalidating…
    expect(mutate).toHaveBeenCalledWith(expect.any(Function), undefined, {
      revalidate: false,
    });
    // …and clears the persisted blob.
    expect(window.localStorage.getItem(SWR_CACHE_KEY)).toBeNull();
  });
});
