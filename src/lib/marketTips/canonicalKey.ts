/** Canonical cache key for a Market Tip: lowercased, trimmed, single-spaced. */
export function canonicalTipKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}
