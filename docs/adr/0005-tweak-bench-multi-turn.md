# ADR-0005 — Tweak Bench is multi-turn with a structured change list

**Status:** Accepted  
**Supersedes:** [ADR-0004](0004-recipe-tweak-uses-dedicated-route.md)

## Context

ADR-0004 established that Recipe Tweak uses a dedicated route (`POST /api/recipe/[id]/tweak`) rather than the chat pipeline. That part stands.

What changed: the original design was single-turn (one instruction → one preview → save or discard). The new design replaces the bottom input bar with a **Tweak Bench** — a right-side panel supporting multiple turns of iterative refinement, paired with an inline structural diff on the recipe.

Two decisions needed to be made:

1. **Multi-turn vs. single-turn.** The bench layout implies iteration ("anything still off?"). But ADR-0004 explicitly chose single-turn.
2. **How to drive the inline diff.** The mockup shows per-row annotations (NEW chips, "was X" strikethrough, step highlights) alongside a narrative "What changed" panel. These two views must stay in sync.

## Decisions

### Multi-turn within an ephemeral session

The Tweak Bench supports multiple turns within one open session. The turn log and working draft are in-memory only — no DB persistence, no localStorage. Saving commits the working draft; Discarding or closing collapses the bench and the draft evaporates. "Try a different tweak" resets the log and draft to the original without closing the bench.

### Model returns recipe + structured change list

Each turn the model returns a JSON object with:
- `recipe` — the full updated `RecipeBlock`
- `changes` — an array of `{ kind, ref, label }` entries

`ref` is an optional structural locator object (`type`, `index`, `basis`) that drives the inline diff overlay for ingredient and step rows. It uses `workingDraft` indices for visible added/changed rows and `original` indices for removed rows. `label` is narrative text rendered in the "What changed" panel. Because both views read from the same source, they cannot disagree.

The change list is **cumulative against the original saved recipe** — not against the previous turn's draft. The route receives both `originalRecipe` and `workingDraft`; the model applies the instruction to `workingDraft` but writes the change list against `originalRecipe`. This means the diff overlay always answers "what am I about to commit to my cookbook."

### Checkmarks are decorative

The "What changed" entries are read-only. Users correct unwanted changes by typing a new instruction. This keeps the model as the single source of truth for the draft and prevents client-side mutation from creating inconsistencies.

## Why not alternatives

**Keeping single-turn:** "Try a different tweak" already implied a reset path; making each turn an explicit commit-and-restart forced users to re-type context they'd already established. Multi-turn with an ephemeral session avoids a new DB entity while still supporting iteration.

**Client-side diff only (no model change list):** Would require structural diffing of two `RecipeBlock` objects. Ingredient and step matching is ambiguous (no stable IDs). The narrative labels ("to velvet the chicken") cannot be derived from a structural diff — they require the model's reasoning. Hybrid is the only way to guarantee coherence between the panel and the inline overlay.

**Interactive toggles on the change list:** Each "undo" toggle would produce an inconsistent draft (e.g., chicken in ingredients, step still says "marinate the chicken"). The multi-turn path already handles this more expressively. Decorative checkmarks kept the model authoritative.
