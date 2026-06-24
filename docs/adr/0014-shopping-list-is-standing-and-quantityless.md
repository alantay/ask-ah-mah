# ADR-0014 — The Shopping List is a standing, quantity-less, user-curated list

**Status:** Accepted — amends the "deferred" consequence of [ADR-0013](0013-market-tips-are-llm-generated-and-shared.md)

## Context

[ADR-0013](0013-market-tips-are-llm-generated-and-shared.md) shipped **Market Tips** on the in-chat **Shortfall card** and deliberately *deferred* a standalone, persisted shopping list — "prove the tip value on the recipe-bound list first."

The recipe-bound list proved the tips, but in use it also proved its own ceiling. Three problems surfaced:

1. **It was wrong.** The Shortfall card lists every item not in the pantry and tells you to buy it — even when the recipe's own ingredient `note` says you already have a substitute ("not in pantry — use the chicken you have"). The list says *buy ground pork*; the row below says *you can skip it*.
2. **It clashed.** Each missing item then appeared twice — once on the Shortfall card with a **pick-tip** ("choose pale pink, firm, no sour smell"), once in **What to gather** with a **substitution/prep note**. Two advice voices answering different questions, stapled to the same item, on the same screen.
3. **It couldn't hold non-recipe wants.** A recipe-bound list has no room for "I just feel like buying apples and oranges" — a normal, recipe-independent shopping intent.

## Decision

### 1. Remove the Shortfall card from chat; tips leave the recipe

The in-chat recipe keeps a **single** ingredient list (**What to gather**) speaking a **single** voice (the ingredient `note`). Market Tips no longer render in chat at all.

### 2. Introduce a standing, per-user, persisted Shopping List

Market Tips render here instead — the true point-of-purchase surface, decoupled from the recipe's substitution advice so the two voices never co-locate.

### 3. The list is quantity-less

Items are **identities, not amounts**: a row is `shallot`, never `4 shallots`. Recipe "2 apples, sliced" and a typed-in "apple" canonicalize to the same row and merge. This is the simplification that makes cross-recipe aggregation tractable — it removes unit reconciliation and per-recipe provenance entirely.

### 4. Two on-ramps

- The **cart button** on a recipe's ingredient row — repurposed from *add-to-pantry* to **add-to-shopping-list**.
- **Direct type-in** on the list itself (the apples-and-oranges case).

### 5. Lifecycle (todo-list semantics)

- **✓ bought** — strikes through and persists *for the trip*; cleared in bulk ("clear bought") or on next fresh open.
- **✕ changed mind** — hard delete.
- Moving a bought item into the **Pantry** is a separate, opt-in action — never a side effect of checking it bought.

### 6. Placement: Pantry's "Need" tab

The Pantry gains two faces — **Have** (current stock) and **Need** (the Shopping List). The list is the conceptual inverse of the pantry, so it lives beside it and reuses the existing add-item flow. This is the one **easily-reversible** decision here (pure UI location, no data dependency); promoting Need to a standalone Section later costs nav work and zero migration.

## Why this amends ADR-0013

0013 deferred the standing list to first prove tips on the recipe-bound surface. It did — and simultaneously demonstrated that the recipe-bound surface is the *wrong* permanent home: it duplicates the gather list, clashes pick-tips against substitution notes, and cannot hold non-recipe wants. The standing list resolves all three and gives tips a home at the moment of buying.

## Why quantity-less

A cross-recipe list *with* quantities forces unit reconciliation ("2 shallots" + "4 shallots") and per-recipe provenance for negligible payoff. Quantity isn't the market-time decision — *which* and *whether* are; *how many* is recipe-time math. Dropping it removes the single hardest sub-problem at almost no cost.

## Why not the alternatives

**Per-recipe ephemeral list.** Can't hold apples-and-oranges and re-creates a silo per dish — the opposite of how the user actually shops (one mixed list).

**A 4th top-level Section.** Splits the symmetric Have/Need pair across two destinations. The list belongs beside the pantry it inverts; placement is also the cheapest thing to revisit if the tab proves wrong.

## Consequences

- New persisted model (e.g. `ShoppingListItem { id, userId, key (canonical), name, category?, bought, createdAt }`), scoped by `userId`, **no recipe foreign key**.
- The Market Tip engine needs **no change**: `/api/market-tip` already keys by canonical name and treats category as optional (absent → model decides), so typed items get tips like recipe items do.
- The recipe card's cart action changes meaning; the add-to-pantry path moves onto the Shopping List / Pantry.
- **Tips disappear from chat.** Their discoverability now depends on the user opening the Need tab — an accepted trade for ending the clash.
- The **Shortfall card** glossary term is retired; **Shopping List** replaces it as the shopping surface.
