# ADR-0016 — The Shopping List groups by Aisle, a shopping taxonomy distinct from the Pantry's storage Category

**Status:** Accepted

## Context

The [Shopping List](../../CONTEXT.md#shopping-list) rendered as a single flat list in build order. Once it holds more than a handful of rows it reads as an undifferentiated pile — you can't scan it the way you actually shop, aisle by aisle. We want the list grouped, like the Pantry already groups its stock into cards.

The obvious move is to reuse the Pantry's grouping. But the Pantry groups by its **storage Category** enum — `Protein / Carbs / Vegetable / Condiments / Spice / Misc` — and that taxonomy answers the wrong question for a shopping trip:

- It is a **storage** taxonomy ("where does this live at home"), not a **shopping** one ("where do I find this at the shop"). They diverge: you buy fruit and vegetables from the same produce stall, but the enum has no "Fruit" at all, so apples would land in `Misc`.
- Two further frictions make direct reuse impossible anyway:
  1. The Shopping List's `category` column is a free-form `String?`, **not** the Pantry `Category` enum.
  2. **Typed-in items carry no category at all** — the add path sends only `{ name }`. So grouping by the existing column would dump every hand-typed item into one bucket. Grouping is impossible until typed-in items *acquire* a category.

## Decision

Group the Shopping List by **[Aisle](../../CONTEXT.md#aisle)** — a small, fixed *shopping* vocabulary, separate from the Pantry's storage Category:

**Produce · Meat & Seafood · Rice & Noodles · Sauces & Seasoning · Other**

Ordered as a market walk, **Other** always last, **empty aisles hidden** (as the Pantry hides empty Category cards).

Three rules make an item find its Aisle without a new data model:

1. **Recipe items map deterministically.** An item added from a recipe already carries a Pantry-enum category. A pure `toAisle(category)` function bridges the two taxonomies — `Vegetable→Produce`, `Protein→Meat & Seafood`, `Carbs→Rice & Noodles`, `Condiments/Spice→Sauces & Seasoning`, `Misc→Other` — so these need **no model call**.
2. **Typed-in items are classified by the model, then persisted.** A typed-in item starts with `category: null`. A client-orchestrated classify step (mirroring how `useMarketTips` fetches tips) sends its name to a `gpt-5-mini` endpoint that returns one of the five aisles and **writes it back to the row's existing `category` column**. No new table, no migration — the column was already there.
3. **The add never blocks on classification.** An unclassified item renders in **Other** immediately; when the classify call returns and the list revalidates, the row **shifts** to its real aisle. This is the same "optimistic, then settle" shape as Market Tips, and it sidesteps the fact that a Vercel route handler can't reliably do work *after* it has sent its response — so the classify call is a distinct client-triggered request, not background work hung off the add.

## Why not the alternatives

- **Reuse the Pantry's Category enum.** Rejected: it is the wrong taxonomy (storage, not shopping), it has no Fruit, and the Shopping List doesn't store the enum anyway. Bridging *from* it (rule 1) gives us the recipe-item win without adopting it as the user-facing grouping.
- **Classify inline during the add (POST).** Rejected: it makes every add wait ~1s on a model call, for no reason — the user has already told us the name; showing the row instantly under *Other* and settling it later is strictly better UX.
- **A shared, name-keyed aisle corpus (like the Market Tip cache table).** Tempting for symmetry, and aisle-by-name is genuinely shareable across users. Rejected for now as **avoidable surface**: the `category` column already exists and recipe items already populate it, so persisting per-row reuses what's there with zero schema change. Promoting aisle to a shared corpus later remains open (and would mirror [ADR-0013](0013-market-tips-are-llm-generated-and-shared.md)).

## Consequences

- A new `toAisle` mapping + an aisle-grouping helper become the single source of truth for the list's shape; both are pure and unit-tested.
- A classify endpoint joins `/api/market-tip` as a second name-in, model-out helper — but unlike tips it **persists** to the per-row `category` rather than a shared cache.
- The `category` column now holds a *mix* of vocabularies: Pantry-enum values (from recipe on-ramp) and aisle strings (from classify). `toAisle` is the chokepoint that normalizes both at render — anything that reads `category` for grouping must go through it.
- The vocabulary is baked into UI copy and into classified rows, so widening or renaming the aisle set later is a real (if modest) change — hence this record.
- Layout is a single column with aisle subheadings, **not** the Pantry's masonry cards: a shopping list is a checklist scanned top-to-bottom on a trip, not a browseable stock view.
