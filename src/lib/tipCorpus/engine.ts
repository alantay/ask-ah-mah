/**
 * Shared "tip corpus" engine: canonicalize → cache → generate misses in one
 * batch → negative-cache. Extracted from the three copies of this skeleton
 * (Market Tips, Storage Tips, aisle classification). Everything that differs
 * per corpus — cache table, prompt/model call, pre-filter, fallback labels —
 * is injected via the adapter, so the engine imports neither Prisma nor the
 * AI SDK.
 */
export interface TipCorpusAdapter<Item, Label extends string = string> {
  /** Canonical dedupe/cache key for an item; empty/null skips the item. */
  canonicalKey(item: Item): string | null;

  /** Batch cache read for the wanted keys. Omit for a cacheless corpus. */
  readCache?(keys: string[]): Promise<Array<{ key: string; label: Label }>>;

  /**
   * Persist one resolved label. Failures are swallowed with a warning so a
   * cache problem never breaks the response. Omit for a cacheless corpus.
   */
  writeCache?(key: string, label: Label): Promise<void>;

  /**
   * Pre-generation gate, no model call. Return false to resolve the item to
   * `negativeLabel` immediately (negative-cached) instead of generating.
   * Omit to send every miss to the generator.
   */
  prefilter?(item: Item, key: string): boolean;

  /** Label for items the prefilter rejects. Defaults to "". */
  negativeLabel?: Label;

  /**
   * One batched model call covering every miss that passed the prefilter.
   * The adapter owns the prompt, the model call, and any label coercion.
   * Return only the keys the model actually answered — an explicit empty
   * label counts as an answer (it is cached); omitted keys get
   * `omissionLabel` and stay uncached, so they are retryable later.
   */
  generate(
    misses: Array<{ key: string; item: Item }>,
  ): Promise<Map<string, Label>>;

  /** Label for a key the generator omitted. Never cache-written. */
  omissionLabel: Label;
}

/**
 * Resolve a label for every item: cache hits first, then one batched
 * generator call for the misses. Returns a record keyed by canonical key.
 */
export async function runTipCorpus<Item, Label extends string = string>(
  items: Item[],
  adapter: TipCorpusAdapter<Item, Label>,
): Promise<Record<string, Label>> {
  // Canonicalize + dedupe; first occurrence of a key wins.
  const wanted = new Map<string, Item>();
  for (const item of items) {
    const key = adapter.canonicalKey(item);
    if (!key || wanted.has(key)) continue;
    wanted.set(key, item);
  }

  const keys = [...wanted.keys()];
  const result: Record<string, Label> = Object.create(null);
  if (keys.length === 0) return result;

  if (adapter.readCache) {
    const cached = await adapter.readCache(keys);
    for (const row of cached) result[row.key] = row.label;
  }

  const misses = keys.filter(
    (k) => !Object.prototype.hasOwnProperty.call(result, k),
  );

  const writeCache = async (key: string, label: Label) => {
    if (!adapter.writeCache) return;
    await adapter
      .writeCache(key, label)
      .catch((e) => console.warn("tip-corpus cache write failed", key, e));
  };

  const toGenerate = adapter.prefilter
    ? misses.filter((k) => adapter.prefilter!(wanted.get(k)!, k))
    : misses;

  // Negative-cache prefilter rejections: no model call, resolved immediately.
  const rejected = misses.filter((k) => !toGenerate.includes(k));
  for (const k of rejected) {
    const label = adapter.negativeLabel ?? ("" as Label);
    result[k] = label;
    await writeCache(k, label);
  }

  if (toGenerate.length > 0) {
    const generated = await adapter.generate(
      toGenerate.map((key) => ({ key, item: wanted.get(key)! })),
    );
    for (const k of toGenerate) {
      if (generated.has(k)) {
        const label = generated.get(k)!;
        result[k] = label;
        await writeCache(k, label);
      } else {
        // Generator omitted this key — resolve it for this request but don't
        // cache, so it stays retryable on a later call.
        result[k] = adapter.omissionLabel;
      }
    }
  }

  return result;
}
