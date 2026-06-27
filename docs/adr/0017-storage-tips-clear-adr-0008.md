# ADR-0017 — Storage Tips are universal home-care knowledge, and clear ADR-0008

**Status:** Accepted

## Context

A new Pantry feature gives each kitchen item a **Storage Tip** — Ah Mah's advice on how to *keep it well at home*: food longevity (*"potatoes in a cool, dark place, never the fridge"*, *"herbs stem-down in a glass of water"*) and equipment care (*"dry the wok on the heat, wipe a little oil so it won't rust"*).

This sits on top of an existing, deliberately sharp boundary. **[ADR-0008](0008-no-shelf-life-ui.md)** removed the shelf-life / "use soon" system. **[ADR-0013](0013-market-tips-are-llm-generated-and-shared.md)** then introduced **Market Tips** and was careful to define them as *point-of-purchase* advice only — the `CONTEXT.md` glossary entry for Market Tip explicitly excludes "how long something keeps once home." A Storage Tip is *precisely* that excluded thing.

So a future reader sees "freshness tips in the pantry" and reasonably reaches for the ADR-0008 revert. This ADR exists to settle whether a Storage Tip is the rejected shelf-life idea wearing a new hat, or a genuinely different concept that clears the same bar Market Tips did.

Three options were considered:

1. **A distinct concept that clears ADR-0008** — define Storage Tip as its own thing, alongside Market Tip.
2. **Fold it into Market Tip** — widen the existing term to cover both picking and storing.
3. **Don't build it** — keep the pantry tip-free, treat it as too close to the shelf-life line.

## Decision

### A Storage Tip is a distinct concept that clears ADR-0008

ADR-0008 rejected shelf-life because **the freshness of a *specific* item cannot be reliably known from app state** — `dateAdded` is not an acquisition or expiry date, and steering the product by guessed urgency degrades it.

A Storage Tip asks a *different* question, the same way a Market Tip does:

- **Shelf-life (rejected):** "is *my* potato still good?" — per-item, time-dependent, unknowable from app state.
- **Market Tip (ADR-0013):** "how do I *pick* a good potato?" — universal, time-independent general knowledge.
- **Storage Tip (this ADR):** "how do I *keep* a potato well?" — also universal, time-independent general knowledge.

Nothing about a Storage Tip depends on app-state accuracy. "Store potatoes cool and dark" is true for every potato, every user, forever — exactly the property that made Market Tips safe. The failure mode that sank shelf-life (unreliable per-item state) does not apply.

### Storage Tip and Market Tip stay separate terms

A Market Tip is *pick it well at the shop*; a Storage Tip is *keep it well at home*. They fire at different moments and read differently per item — `tomato` has both a pick tip ("firm, deep red, no soft spots") and a keep tip ("on the counter, out of the fridge"). They are kept as separate concepts with separate shared corpora, each keyed by canonical item name, neither carrying a `userId`.

### Both tip kinds are gated by kitchen-domain relevance

A tip is generated only for items used in cooking or eating — **food, drink, fresh groceries, and cooking equipment**. Anything unrelated to the kitchen (sports gear, vehicles, clothing, toiletries) returns no tip and is negative-cached, never re-asked. A wok is in-domain (it gets both a pick tip and a care tip); a climbing harness is not. This rule is enforced at the generation prompt for both tip kinds — the category pre-filter alone cannot tell an uncategorized `dragon fruit` from an uncategorized `climbing harness`.

## Why not the alternatives

**Fold into Market Tip (option 2).** One table, one prompt, one toggle — simplest data model. Rejected because it erases a boundary ADR-0013 drew on purpose. Market Tip was *defined* as shop-only; widening it to "and also how to store it" smuggles "how long it keeps" back in under an existing name, which is exactly the confusion ADR-0008 and the Market Tip glossary entry were written to prevent. Two clearly-named concepts are cheaper to reason about than one overloaded one. It also collides physically: `MarketTip.key` is a single-column `@id`, so one `tomato` row cannot hold both a pick tip and a keep tip without a painful primary-key migration of an already-populated table.

**Don't build it (option 3).** Safe, but gives up real user value (less food waste, more of the "Ah Mah knows best" warmth the shopping list already earns) over a boundary that, on inspection, the feature actually clears. The ADR-0008 risk is about *per-item state*, which Storage Tips never touch.

## Consequences

- A new shared corpus (e.g. `StorageTip { key @id, tip, createdAt }`, `@@map("storage_tips")`) with **no `userId`**, mirroring `MarketTip`. Generation normalizes item strings to the same canonical key, and negative-caches both staples-without-a-tip and kitchen-irrelevant items.
- The relevance rule is **retrofitted to the existing Market Tip generator** — closing a live bug where non-kitchen items (e.g. a climbing harness) received a picking tip.
- Storage Tips surface per item in the Pantry and are **toggleable**, defaulting **off** (opt-in); Market Tips remain **on**. Toggle state is per-surface and persists in `localStorage`. See the **Storage Tip** and **Market Tip** entries in `CONTEXT.md`.
- This is the second freshness-*adjacent* feature admitted under the "universal vs. per-item-state" test first articulated in ADR-0013. That test — not the word "freshness" — is the line. A future freshness-shaped proposal should be judged the same way: if it depends on the state of a *specific* user's *specific* item, ADR-0008 still rejects it.
