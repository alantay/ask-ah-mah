# ADR-0023 — Instant cold return: persistent SWR cache + optimistic cached identity

**Status:** Accepted (Jul 2026)

## Context

The app is used mid-cook: the phone is backgrounded, then reopened to refer to a recipe, often
time-critically. When the OS has evicted the tab (common on iOS Safari under memory pressure),
"reopen" is a full cold reload, and **nothing paints until two network round-trips finish in
series**:

1. `authClient.useSession()` fetches `/api/auth/get-session`. Until it returns, `useSession`
   reports `isPending` and `userId` is `null`. Every data SWR key is `userId ? url : null`, so
   **not a single data fetch even starts** — the auth round-trip sits *in front of* the data.
2. The four force-mounted SWR hooks (`/api/conversation`, `/api/message`, `/api/inventory`,
   `/api/recipe`) then fetch. SWR's cache was in-memory only (no `SWRConfig` provider existed), so
   it is wiped on every reload.

Warm resume was already fast; true offline and "resume at the same cooking step" were explicitly
out of scope. The goal here is narrow: on a **cold return**, paint the last-seen content
immediately and revalidate in the background.

## Decision

**1. Persist the SWR cache to localStorage.** A global `SWRProvider` supplies SWR a `Map` hydrated
from `localStorage` on init and written back on `visibilitychange → hidden` / `pagehide`
(`src/lib/swr-cache.ts`, `src/app/SWRProvider.tsx`). Every existing `useSWR` call transparently
gains stale-while-revalidate across reloads, with no per-call changes.

**2. Paint from an optimistic, persisted `userId`.** We persist the last-known `userId` to
localStorage and, after mount, use it before the session round-trip settles
(`userId = session?.user?.id ?? persistedUserId`). This takes the `/api/auth` round-trip **off the
critical path to first content paint** — the single biggest win. The persisted id is read in a
mount effect, not during render, so the server's `null` userId matches the first client render (no
hydration mismatch); cached content paints on the next commit.

**This is display-only. The server still trusts only the session cookie** (`src/lib/session.ts`) —
the persisted id is never sent to or trusted by any API. So the established identity rule is intact;
this only decides *which cached blob to show first* on the client.

**3. Guard the identity-mismatch flash.** When the real session resolves to a different id than the
one we painted from (expired anonymous session, sign-in upgrade, or a different user on a shared
device), `useSession` evicts the cache (`clearSwrCache`) before revalidating under the new id. On
explicit sign-out, `AuthButton` clears both localStorage keys before reloading.

## Why not the alternatives

- **Wait for the session, then paint from cache.** Simpler and zero flash risk, but first paint
  still waits on the `/api/auth` round-trip — "fast" but not "instant" on bad kitchen signal. The
  optimistic id is what makes it feel instant; the flash is rare and bounded by the eviction guards.
- **Service worker (serwist / next-pwa) for a cached shell + offline.** Deferred as a **future
  enhancement**. The cold-load cost is the auth + data round-trips; the JS/HTML shell is already
  browser-cached via Next's immutable asset headers. A service worker adds true offline (not asked
  for), plus CSP changes (the app runs a strict CSP) and SW-lifecycle/versioning weight —
  disproportionate to the scenario being solved.
- **IndexedDB instead of localStorage.** Rejected — IndexedDB's async API defeats synchronous
  first-paint hydration. The cached payload is a few hundred KB of JSON, comfortably within
  localStorage's budget.

## Consequences

- A previous user's data can flash briefly on the rare identity-mismatch path; bounded by the
  eviction guards in `useSession` (mismatch) and `AuthButton` (sign-out). On a personal device the
  resolved anonymous identity is almost always the same one, so the common path never flashes.
- Loading gates that previously fell through to empty/not-found while `userId` was `null` now treat
  "identity still resolving" as loading (`RecipeList`, `recipe/[id]/page.tsx`) — this also fixes a
  pre-existing cold-load flash of "can't find that one".
- Two new localStorage keys are owned by this feature: `ah-mah-swr-cache`, `ah-mah-user-id`.
- No API, schema, or `CONTEXT.md` changes — this is an implementation concern, not domain vocabulary.
