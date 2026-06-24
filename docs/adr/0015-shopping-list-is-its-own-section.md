# ADR-0015 — The Shopping List is its own top-level Section, not a tab inside the Pantry

**Status:** Accepted — amends [ADR-0014](0014-shopping-list-is-standing-and-quantityless.md) §2 and §6

## Context

[ADR-0014](0014-shopping-list-is-standing-and-quantityless.md) placed the standing **Shopping List** on a **Need** tab inside the Pantry, opposite a **Have** tab (current stock). Its §2 ("Why not the alternatives") explicitly *rejected* a standalone Section — "splits the symmetric Have/Need pair across two destinations; the list belongs beside the pantry it inverts" — and §6 called the tab placement "the one **easily-reversible** decision here (pure UI location, no data dependency)."

In use, the Have/Need tab strip was wrong on its own terms:

1. **It contradicted the app's navigation model.** Per [the `Section` glossary entry](../../CONTEXT.md), destinations are chosen from the `AppSidebar` / mobile drawer, and "the Radix `Tabs` container … is an implementation detail … there is no visible tab strip." The Have/Need strip was the **only visible tab strip in the entire app** — a control whose signified meaning ("navigate to another tab") collided with the established rule that you change destinations from the nav, never from tabs.
2. **The styling had nowhere to belong.** The shared `TabsTrigger` is a folder tab whose active state merges into the **Chat** surface (`bg-chat` / `border-b-chat`), but the Pantry panel is `bg-muted paper`. The tab's colour never matched the surface under it, so it read as orphaned.

These are the symptoms ADR-0014 §6 invited us to revisit: placement was the cheap thing to change, and it proved wrong.

## Decision

Promote the **Shopping List** to its own top-level **Section**, peer to Chat / Pantry / Cookbook.

- **Nav** becomes **Chat · Pantry · Shopping List · Cookbook**. Shopping List sits immediately after Pantry so the inverse-pair stays adjacent — the co-location ADR-0014 valued is preserved as *nav adjacency* instead of *nested tabs*.
- **The Have/Need tab strip is deleted.** `InventoryWrapper` no longer wraps content in `Tabs`; the Pantry renders `<Inventory />` directly and once again means **stock only**. The Shopping List renders in its own content panel, switched by the same `?tab=` nav mechanism as every other Section (`?tab=shopping`).
- **"Have" and "Need" are retired as user-facing terms.** They existed only as the two faces of one tabbed surface; with the surface gone, the Pantry is just the Pantry and the Shopping List is just the Shopping List. The nav label is **Shopping List** (self-evident to a first-time user in a way "Need" never was).

No data changes — exactly as ADR-0014 §6 predicted. The `ShoppingListItem` model, its routes, and the Market Tip engine are untouched; this is nav + routing only.

## Why this amends ADR-0014

0014 §2 rejected a standalone Section to keep the Have/Need pair from being "split across two destinations." That cost is real but mild, and it is fully paid down by **nav adjacency**: the two destinations sit side by side, visibly an inverse pair, without forcing a foreign tab control onto one of them. 0014 §6 already flagged its own placement as the reversible bet; this ADR collects on it.

## Consequences

- One visible "Have/Need" affordance disappears; the Shopping List gains nav-level discoverability it lacked behind a tab (it no longer hides one click deep inside the Pantry).
- `SidebarContent` gains a fourth nav item with a hand-drawn basket `ShoppingListIcon`; `MobileTopBar` (which reuses `SidebarContent` for its drawer) gains the `Shopping List` section label; `page.tsx` gains a fourth content panel; `useActiveTab` accepts `shopping`.
- The glossary's `Section` entry now lists four destinations; `Have`/`Need` are removed as named faces.
- Cross-references that described the Shopping List as "the Pantry's Need tab" are reworded to "its own Section, the inverse of the Pantry."
- Reversibility is unchanged: collapsing it back into the Pantry (or elsewhere) remains pure UI/nav work with zero migration.
