import { mutateResource } from "./mutateResource";

// Mirrors the mocking pattern in useTips.test.ts: mock `swr` entirely so we
// can inspect exactly what mutateResource hands to `mutate`.
const mockMutate = jest.fn();
jest.mock("swr", () => ({
  __esModule: true,
  mutate: (...args: unknown[]) => mockMutate(...args),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

type Bag = { items: string[] };

describe("mutateResource", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true });
  });

  it("forwards a functional optimisticData to mutate unchanged", async () => {
    const updater = (current?: Bag): Bag => ({
      items: (current?.items ?? []).filter((i) => i !== "duck"),
    });

    await mutateResource<Bag>({
      url: "/api/inventory",
      method: "DELETE",
      body: { itemNames: ["duck"] },
      key: "/api/inventory?userId=u1",
      optimisticData: updater,
    });

    expect(mockMutate).toHaveBeenCalledWith(
      "/api/inventory?userId=u1",
      updater,
      { revalidate: false },
    );
  });

  it("still forwards a plain-value optimisticData", async () => {
    const next: Bag = { items: [] };

    await mutateResource<Bag>({
      url: "/api/inventory",
      method: "DELETE",
      body: {},
      key: "k",
      optimisticData: next,
    });

    expect(mockMutate).toHaveBeenCalledWith("k", next, { revalidate: false });
  });

  it("skips the optimistic write when no key is given", async () => {
    await mutateResource({
      url: "/api/inventory",
      method: "DELETE",
      body: {},
    });

    expect(mockMutate).not.toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalled();
  });
});
