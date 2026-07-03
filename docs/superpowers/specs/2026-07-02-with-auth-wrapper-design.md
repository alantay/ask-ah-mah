# withAuth Route Wrapper — Design Spec

**Issue:** #364  
**Date:** 2026-07-02  
**Status:** Approved

---

## Problem

Every authenticated API route repeats the same two lines:

```ts
const userId = await getSessionUserId(req);
if (!userId) return unauthorized();
```

This appears ~20 times across `src/app/api/**/route.ts`. There is no single seam to audit or test "is this route protected".

---

## Solution

Two wrapper functions in `src/lib/withAuth.ts`:

### `withAuth` — for static routes (no URL segments)

```ts
export function withAuth(
  handler: (req: NextRequest, ctx: { userId: string }) => Promise<Response>
): (req: NextRequest) => Promise<Response>
```

Usage:
```ts
export const POST = withAuth(async (req, { userId }) => {
  // userId is verified; proceed
});
```

### `withAuthDynamic` — for dynamic routes (with URL segments)

```ts
export function withAuthDynamic<P extends Record<string, string>>(
  handler: (req: NextRequest, ctx: { userId: string; params: Promise<P> }) => Promise<Response>
): (req: NextRequest, routeCtx: { params: Promise<P> }) => Promise<Response>
```

Usage:
```ts
export const PATCH = withAuthDynamic<{ id: string }>(async (req, { userId, params }) => {
  const { id } = await params;
  // proceed
});
```

Both wrappers call `getSessionUserId(req)` and return `unauthorized()` on null — exactly the current per-route pattern, extracted once.

---

## Files

| File | Action |
|---|---|
| `src/lib/withAuth.ts` | Create — exports `withAuth` and `withAuthDynamic` |
| `src/lib/withAuth.test.ts` | Create — unit tests for both wrappers |
| All authed routes | Migrate to use the wrapper |

---

## Tests (`src/lib/withAuth.test.ts`)

For each wrapper:
- Returns 401 and does not call handler when `getSessionUserId` returns null
- Calls handler with injected `userId` when authenticated
- (`withAuthDynamic` only) Passes `params` through to the handler unchanged

---

## Migration Map

### Use `withAuth`

- `src/app/api/chat/route.ts` — POST
- `src/app/api/conversation/route.ts` — GET, POST, DELETE
- `src/app/api/inventory/route.ts` — GET, POST, DELETE
- `src/app/api/inventory/parse/route.ts` — POST
- `src/app/api/inventory/seed/route.ts` — POST
- `src/app/api/market-tip/route.ts` — GET
- `src/app/api/message/route.ts` — GET, POST
- `src/app/api/recipe/route.ts` — GET, POST
- `src/app/api/recipe/extract/route.ts` — POST
- `src/app/api/shopping-list/route.ts` — GET, POST, DELETE
- `src/app/api/shopping-list/classify/route.ts` — POST
- `src/app/api/storage-tip/route.ts` — GET

### Use `withAuthDynamic`

- `src/app/api/conversation/[id]/route.ts` — PATCH, DELETE
- `src/app/api/recipe/[id]/route.ts` — PATCH
- `src/app/api/recipe/[id]/share/route.ts` — POST
- `src/app/api/recipe/[id]/tweak/route.ts` — POST

### Skip

- `src/app/api/auth/[...all]/route.ts` — this is the auth provider itself

---

## Impact on Existing Tests

Existing route tests mock `getSessionUserId` directly. Since both wrappers call `getSessionUserId` internally, existing mocks continue to intercept the call — no route test changes required.

---

## Out of Scope

- Typed error hierarchy (tracked separately as issue #363)
- Rate limiting or other middleware concerns
