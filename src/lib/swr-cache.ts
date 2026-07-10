import type { ScopedMutator, State } from "swr";

// localStorage keys owned by the fast-return cache. See ADR-0023.
export const SWR_CACHE_KEY = "ah-mah-swr-cache";
export const USER_ID_KEY = "ah-mah-user-id";

/**
 * Persistent SWR cache backed by localStorage. Hydrates the in-memory Map from
 * localStorage on init and writes it back when the page is hidden or unloaded —
 * so a cold reload after the OS evicts the tab (common mid-cook on mobile) can
 * paint last-seen content without waiting on the network, then revalidates.
 *
 * Wire as `<SWRConfig value={{ provider: localStorageProvider }}>`.
 */
export function localStorageProvider(): Map<string, State> {
  const map = new Map<string, State>();
  if (typeof window === "undefined") return map; // SSR: start empty

  try {
    const raw = localStorage.getItem(SWR_CACHE_KEY);
    if (raw) {
      for (const [key, value] of JSON.parse(raw) as [string, State][]) {
        map.set(key, value);
      }
    }
  } catch {
    // Corrupt or unreadable cache — start fresh rather than crash on boot.
  }

  const persist = () => {
    try {
      localStorage.setItem(SWR_CACHE_KEY, JSON.stringify([...map.entries()]));
    } catch {
      // Quota exceeded or serialization failure — the cache is best-effort.
    }
  };

  // `visibilitychange → hidden` fires reliably when a mobile user backgrounds
  // the app (our core trigger); `pagehide` covers tab close / bfcache.
  // `beforeunload` is deliberately not used — it is unreliable on mobile.
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") persist();
  });
  window.addEventListener("pagehide", persist);

  return map;
}

/**
 * Drops every in-memory SWR entry and wipes the persisted blob. Used when the
 * resolved session identity no longer matches the optimistic one we painted
 * from, so a previous user's data can't linger or be re-persisted. Data is
 * cleared without revalidating — the caller's key change triggers fresh fetches.
 */
export function clearSwrCache(mutate: ScopedMutator) {
  mutate(() => true, undefined, { revalidate: false });
  try {
    localStorage.removeItem(SWR_CACHE_KEY);
  } catch {
    // ignore — nothing to clean up
  }
}
