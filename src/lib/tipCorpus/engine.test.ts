import { runTipCorpus, type TipCorpusAdapter } from "./engine";

type Item = { name: string; pickable?: boolean };

/** Canonicalization mirroring canonicalTipKey: lowercase, trim, single-space. */
const canonicalKey = (item: Item) =>
  item.name.trim().toLowerCase().replace(/\s+/g, " ");

/** Adapter with a cache, like the market-tip / storage-tip routes. */
function cachedAdapter(
  overrides: Partial<TipCorpusAdapter<Item>> = {},
): TipCorpusAdapter<Item> & {
  readCache: jest.Mock;
  writeCache: jest.Mock;
  generate: jest.Mock;
} {
  return {
    canonicalKey,
    readCache: jest.fn().mockResolvedValue([]),
    writeCache: jest.fn().mockResolvedValue(undefined),
    generate: jest.fn().mockResolvedValue(new Map()),
    omissionLabel: "",
    ...overrides,
  } as never;
}

beforeEach(() => jest.clearAllMocks());

describe("runTipCorpus", () => {
  it("returns cached labels without calling the generator", async () => {
    const adapter = cachedAdapter({
      readCache: jest
        .fn()
        .mockResolvedValue([{ key: "tomato", label: "deep red, no bruises" }]),
    });

    const result = await runTipCorpus([{ name: "Tomato" }], adapter);

    expect(result).toEqual({ tomato: "deep red, no bruises" });
    expect(adapter.generate).not.toHaveBeenCalled();
    expect(adapter.writeCache).not.toHaveBeenCalled();
  });

  it("sends only the misses to the generator, in one batch", async () => {
    const adapter = cachedAdapter({
      readCache: jest
        .fn()
        .mockResolvedValue([{ key: "tomato", label: "deep red" }]),
      generate: jest
        .fn()
        .mockResolvedValue(new Map([["avocado", "gives slightly"]])),
    });

    const result = await runTipCorpus(
      [{ name: "Tomato" }, { name: "Avocado" }],
      adapter,
    );

    expect(adapter.generate).toHaveBeenCalledTimes(1);
    expect(adapter.generate).toHaveBeenCalledWith([
      { key: "avocado", item: { name: "Avocado" } },
    ]);
    expect(result).toEqual({ tomato: "deep red", avocado: "gives slightly" });
    expect(adapter.writeCache).toHaveBeenCalledTimes(1);
    expect(adapter.writeCache).toHaveBeenCalledWith("avocado", "gives slightly");
  });

  it("gives an omitted key the omission label and does NOT cache-write it", async () => {
    const adapter = cachedAdapter({
      generate: jest.fn().mockResolvedValue(new Map()),
      omissionLabel: "",
    });

    const result = await runTipCorpus([{ name: "Avocado" }], adapter);

    expect(result).toEqual({ avocado: "" });
    expect(adapter.writeCache).not.toHaveBeenCalled();
  });

  it("cache-writes an explicit empty label from the generator (negative cache)", async () => {
    // Distinct from omission: the model answered "" (out-of-domain rejection),
    // which must be cached so the item is never re-asked.
    const adapter = cachedAdapter({
      generate: jest.fn().mockResolvedValue(new Map([["climbing harness", ""]])),
    });

    const result = await runTipCorpus([{ name: "Climbing harness" }], adapter);

    expect(result).toEqual({ "climbing harness": "" });
    expect(adapter.writeCache).toHaveBeenCalledWith("climbing harness", "");
  });

  it("negative-caches a pre-filtered item without calling the generator", async () => {
    const adapter = cachedAdapter({
      prefilter: (item: Item) => item.pickable !== false,
      negativeLabel: "",
    });

    const result = await runTipCorpus(
      [{ name: "Flour", pickable: false }],
      adapter,
    );

    expect(result).toEqual({ flour: "" });
    expect(adapter.generate).not.toHaveBeenCalled();
    expect(adapter.writeCache).toHaveBeenCalledWith("flour", "");
  });

  it("swallows a cache-write failure with a warning and still returns the result", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const adapter = cachedAdapter({
      writeCache: jest.fn().mockRejectedValue(new Error("db down")),
      generate: jest
        .fn()
        .mockResolvedValue(new Map([["avocado", "gives slightly"]])),
    });

    const result = await runTipCorpus([{ name: "Avocado" }], adapter);

    expect(result).toEqual({ avocado: "gives slightly" });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("returns {} for empty input without touching cache or generator", async () => {
    const adapter = cachedAdapter();

    const result = await runTipCorpus([], adapter);

    expect(result).toEqual({});
    expect(adapter.readCache).not.toHaveBeenCalled();
    expect(adapter.generate).not.toHaveBeenCalled();
  });

  it("dedupes items that canonicalize to the same key (first occurrence wins)", async () => {
    const adapter = cachedAdapter({
      generate: jest.fn().mockResolvedValue(new Map([["tomato", "deep red"]])),
    });

    const result = await runTipCorpus(
      [{ name: "Tomato" }, { name: "  tomato " }],
      adapter,
    );

    expect(adapter.generate).toHaveBeenCalledWith([
      { key: "tomato", item: { name: "Tomato" } },
    ]);
    expect(result).toEqual({ tomato: "deep red" });
  });

  it("skips items whose canonical key is empty", async () => {
    const adapter = cachedAdapter({
      generate: jest.fn().mockResolvedValue(new Map([["tomato", "deep red"]])),
    });

    const result = await runTipCorpus(
      [{ name: "   " }, { name: "Tomato" }],
      adapter,
    );

    expect(adapter.generate).toHaveBeenCalledWith([
      { key: "tomato", item: { name: "Tomato" } },
    ]);
    expect(result).toEqual({ tomato: "deep red" });
  });

  it("works without a cache (classify's shape): generates all keys, no writes", async () => {
    const generate = jest
      .fn()
      .mockResolvedValue(new Map([["apple", "Produce"]]));
    const adapter: TipCorpusAdapter<string> = {
      canonicalKey: (name) => name.trim().toLowerCase(),
      generate,
      omissionLabel: "Other",
    };

    const result = await runTipCorpus(["Apple", "mystery item"], adapter);

    expect(generate).toHaveBeenCalledTimes(1);
    expect(generate).toHaveBeenCalledWith([
      { key: "apple", item: "Apple" },
      { key: "mystery item", item: "mystery item" },
    ]);
    expect(result).toEqual({ apple: "Produce", "mystery item": "Other" });
  });
});
