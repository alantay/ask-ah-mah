# ADR-0007 — Pantry selection signals feature-emphasis, not hard constraint

**Status:** Accepted

## Context

The Cook With What You Have feature lets the user select pantry items before asking for recipes. The feature name reads as a hard constraint: "the recipe must use ONLY what I have." That literal reading is the most natural one — and it's the wrong one.

Three semantics were considered for what a **Featured Selection** means to the model:

1. **Hard constraint** — recipe must use *only* the selected items (plus a free-staples whitelist).
2. **Strong preference with budget** — selected items are starred, but the model may call for a small number of missing items as **Additions**.
3. **Hint** — selected items are emphasis, the model is free to use the rest of the pantry as well as the selection.

Future PR reviewers will reach for option 1 because it matches the feature name. This ADR exists to prevent that drift.

## Decision

Selection signals **feature-emphasis**, with the response structured as two recipes:

- **Close Recipe** — 0–2 Additions, prefer fewer. Honors the spirit of "cook with what you have" while permitting the model to suggest a single missing item when the selection is otherwise pathological.
- **Stretch Recipe** — 3–4 Additions, hard cap at 4. Always present in the response.

Beyond the selection itself, the whole pantry is free — items in the pantry the user did *not* check are still used silently. Only items genuinely missing from the pantry count as Additions. Salt, pepper, water, and cooking oil are free regardless.

The selection is a *preference signal*, not a fence. The user is saying "feature these"; they are not saying "ignore the rest of my kitchen."

## Why not alternatives

**Pure hard constraint (option 1).** Most literal reading of the feature name, and the most attractive choice for honesty. Rejected because, in practice, zero-addition recipes from a typical user selection are usually pathological — "plain rice with tofu," "boiled noodles with tomato." The model is forced to write slop to honor the constraint, and the user blames the model. The Stretch slot — even with the floor of 3 additions — would be the recipe the user actually wants anyway.

**Hint with no budget (option 3).** Without a numeric contract, the model drifts toward "any recipe that incidentally uses one of these ingredients," and the feature collapses into "chat, but with a preselected prompt." The Close/Stretch split with explicit Addition counts is what makes the response distinguishable from a free-form chat suggestion.

**Single recipe instead of two.** A single Close-only response leaves Stretch ideas unreachable without a second user turn. A single Stretch-only response abandons the "cook tonight, no shopping" promise. The two-recipe structure lets the response carry both contracts in one streaming turn; neither can be added later without a UX retrofit.

## Consequences

- **UI copy diverges from the glossary.** Cards are labeled *"Right now"* and *"Worth a small trip"*, not "Close" and "Stretch." The glossary terms are internal; the captions are the product promise.
- **Shelf-life prioritization is part of the contract.** The model sees `shelfLife` for every pantry item and is instructed to prioritize short-shelf ingredients. This is the latent justification for keeping `shelfLife` in the data model — see [progress.md](../progress.md) for context.
- **Kitchenware selection follows the same metaphor.** Selecting a wok = "prefer recipes that use a wok," not "only use a wok." Selecting nothing = any equipment is fair game.
