import { fetchRecipePhoto } from "./fetchPhoto";

const MOCK_PHOTO = {
  urls: { regular: "https://images.unsplash.com/photo-123" },
  user: {
    name: "Jane Cook",
    links: { html: "https://unsplash.com/@janecook" },
  },
};

function mockUnsplashResponse(results: unknown[]) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ results }),
  } as unknown as Response);
}

beforeEach(() => {
  process.env.UNSPLASH_ACCESS_KEY = "test-key";
});

afterEach(() => {
  jest.resetAllMocks();
});

describe("fetchRecipePhoto", () => {
  it("uses the recipe title as the primary query", async () => {
    mockUnsplashResponse([MOCK_PHOTO]);

    const result = await fetchRecipePhoto("Economy Fried Bee Hoon", ["stir-fry", "quick", "budget"]);

    expect(result).toEqual({
      url: "https://images.unsplash.com/photo-123",
      photographerName: "Jane Cook",
      photographerUrl: expect.stringContaining("https://unsplash.com/@janecook"),
    });

    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toContain("query=Economy+Fried+Bee+Hoon");
    expect(calledUrl).not.toContain("budget");
    expect(calledUrl).not.toContain("stir-fry");
  });

  it("falls back to tags when title is empty", async () => {
    mockUnsplashResponse([MOCK_PHOTO]);

    await fetchRecipePhoto("", ["stir-fry", "pork", "rice", "spicy"]);

    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toContain("query=stir-fry+pork+rice");
    expect(calledUrl).not.toContain("spicy");
  });

  it("falls back to 'food cooking' when both title and tags are empty", async () => {
    mockUnsplashResponse([MOCK_PHOTO]);

    await fetchRecipePhoto("", []);

    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toContain("query=food+cooking");
  });

  it("retries with 'food cooking' when primary query returns zero results", async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ results: [] }) } as unknown as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ results: [MOCK_PHOTO] }) } as unknown as Response);

    const result = await fetchRecipePhoto("obscuredish123", []);

    expect(global.fetch).toHaveBeenCalledTimes(2);
    const secondUrl = (global.fetch as jest.Mock).mock.calls[1][0] as string;
    expect(secondUrl).toContain("query=food+cooking");
    expect(result?.url).toBe("https://images.unsplash.com/photo-123");
  });

  it("returns null on network error without throwing", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("network failure"));

    const result = await fetchRecipePhoto("pork", []);

    expect(result).toBeNull();
  });

  it("returns null when API returns non-ok response", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as unknown as Response);

    const result = await fetchRecipePhoto("pork", []);

    expect(result).toBeNull();
  });

  it("returns null when UNSPLASH_ACCESS_KEY is not set", async () => {
    delete process.env.UNSPLASH_ACCESS_KEY;
    global.fetch = jest.fn();

    const result = await fetchRecipePhoto("pork", []);

    expect(result).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
