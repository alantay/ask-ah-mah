# ADR-0019 — Keep querystring tabs; the bundle lever is the markdown/math renderer, not the routing

**Status:** Accepted

## Context

[Issue #338](https://github.com/alantay/ask-ah-mah/issues/338) proposed migrating the four
top-level tabs (Chat / Pantry / Shopping / Cookbook) from a single `?tab=` querystring route to
per-feature App Router routes (`/pantry`, `/shopping`, `/cookbook`, …), on the theory that
route-level code splitting would shrink the initial bundle. Today `src/app/(app)/page.tsx` is one
client route that statically imports and `forceMount`s all four feature wrappers, so every panel's
JS ships in the `/` client bundle regardless of the landing tab.

The issue was explicitly gated on **measured evidence** before committing to the refactor. This ADR
records that measurement and the decision. A `@next/bundle-analyzer` pass (gated behind
`ANALYZE=true`, see the `analyze` script) was run against a production build.

### What the build reports (First Load JS, per `next build`)

| Route | First Load JS |
|---|---|
| `/` (chat landing, all four panels) | **476 kB** |
| `/recipe/[id]` | 385 kB |
| `/r/[token]` (public recipe) | 383 kB |
| Shared by all routes | 108 kB |

### What actually composes `/` (analyzer treemap, parsed/uncompressed bytes)

The heavy weight is a **markdown/math rendering stack**, not the feature panels:

| Module | Parsed | Who pulls it |
|---|---|---|
| `streamdown` | 342 kB | chat response renderer + `RecipeDisplay` |
| `katex` (math typesetting) | 253 kB | transitive via `streamdown` |
| `marked` | 38 kB | transitive via `streamdown` |
| `next` (framework) | 350 kB | everything |
| `@ai-sdk/provider-utils` + `ai` | ~110 kB | chat |
| `zod` | 75 kB | shared |

By contrast, the **non-chat panels' own source is tiny**: Inventory 13 kB + Shopping 5 kB +
RecipeList 21 kB (parsed). `streamdown` is imported **statically** in both
`src/components/ai-elements/response.tsx` (chat) and `src/features/RecipeDisplay/RecipeDisplay.tsx`,
and there are **zero** `next/dynamic` / `React.lazy` call sites in the codebase — nothing is deferred.

## Decision

### 1. Do **not** migrate the tabs to per-feature routes for bundle reasons.

The landing route would remain Chat, and Chat statically imports the markdown/math stack
(`streamdown` → `katex` + `marked`, ~633 kB parsed) via its response renderer — so that payload
**stays on `/` after any split.** Route-splitting would defer only the three non-chat panels' own
source (~40 kB parsed ≈ ~10–15 kB gzipped, <10% of the 476 kB landing), because all the genuinely
heavy dependencies (`next`, `streamdown`/`katex`, `ai`, `zod`, `better-auth`, Radix, `sonner`,
`swr`) are shared with — or owned by — the chat route we keep on `/`.

That small, uncertain win does not justify the migration's real costs (previously flagged in #338):
the chat stream/session and in-flight inventory edits currently survive tab switches via
`forceMount`; real routes unmount panels, forcing that state up into the layout/context, and the
instant local-state tab switch becomes a route navigation (a perceived-speed regression without
prefetch/shared-layout work). High risk, low measured reward.

### 2. The real lever is lazy-loading the markdown/math renderer.

`katex` (253 kB) is LaTeX math typesetting — recipes essentially never contain math — and the whole
`streamdown` stack only needs to render *after* content arrives, not on first paint. Deferring it
with `next/dynamic` at the two import sites (`ai-elements/response.tsx`, `RecipeDisplay.tsx`) would
cut the initial First Load across **all three** heavy routes (`/`, `/recipe/[id]`, `/r/[token]`) by
far more than the routing refactor ever could, at a fraction of the risk — it touches two files and
lifts no state. Dropping/parking `katex` entirely (if `streamdown` allows disabling math) is worth
evaluating as part of that work.

This is left as a **follow-up optimization issue**, independent of the tab architecture.

## Why not the alternatives

- **Migrate anyway (the #338 proposal).** Rejected on the evidence above: the heavy payload is
  chat's own and stays on the landing route, so the split yields <10% of the landing bundle while
  incurring the state-lifting and perceived-speed costs. If the panels later grow their *own* heavy,
  panel-specific dependencies, revisit — the measurement, not the architecture instinct, should
  trigger it.
- **Do nothing.** Leaves ~600 kB of markdown/math parsed weight eagerly on every content route.
  Decision 2 captures the cheap win instead.

## Consequences

- The querystring-tab architecture (`useActiveTab`, `forceMount` panels) stays; no cross-tab state
  needs lifting.
- `@next/bundle-analyzer` remains wired behind `ANALYZE=true` (zero cost to normal builds via the
  `analyze` script) so this measurement is repeatable — e.g. to confirm the renderer optimization,
  or to re-trigger the routing question if a panel's own bundle grows materially.
- A follow-up issue should scope lazy-loading `streamdown` (and evaluating `katex` removal).
