# ADR-0021 — Step quantities are per-use, not links

**Status:** Accepted

## Context

[Issue #407](https://github.com/alantay/ask-ah-mah/issues/407) asked for per-step ingredient
quantities in CookingMode — mid-cook, a step like "add the soy sauce" gives no amount, forcing the
cook to leave the step to check "What to gather."

The obvious shortcut is to have each step reference an index into the master `ingredients` array
(a "link"). That fails on the canonical split-use case: a cornstarch slurry with 5 tbsp total,
added 2 tbsp at step 2 and the remaining 3 tbsp at step 5. A link to the master row would show
"5 tbsp" at both steps — technically traceable, but wrong at the point of use, which is the entire
point of the feature.

## Decision

Each `RecipeStep` gets an optional `uses: { name, amount?, unit?, text? }[]` array, authored by the
model, independent of the master ingredient list. Each entry carries the **partial** quantity
consumed at that specific step — never the ingredient's full listed amount. `amount` + `unit` are
numeric and scale with the servings stepper via the same `servings / baseServings` ratio as the
master list (`scaleAmount`); `text` is a free-text fallback (`"remaining"`, `"to taste"`) that
renders unscaled.

Rendered inline: `StepBody` matches each `use.name` against the step's own prose `body` and turns
that word/phrase into a hoverable/tappable hint showing the quantity — no substitution of values
into the sentence, no separate chip row (see 2026-07-09 update below). Matching is best-effort and
silent: a `use` whose name isn't literally present in `body` (e.g. a later reference like "stir it
in") simply renders no hint for that entry.

There is no enforcement that a split ingredient's partial amounts sum to the master amount — it's a
model-authored soft invariant. A wrong split is a smaller failure than no quantity at all.

## Why not the alternatives

- **Link to the master ingredient row (an index/ref).** Rejected — collapses to the full amount at
  every step that uses it, which is actively misleading for split-use ingredients (the canonical
  case this feature exists to solve).
- **Quantities baked into step prose** (e.g. "add 2 tbsp of the slurry" written directly into
  `body`). Rejected — goes stale the moment servings change; the master list already solved this by
  keeping quantities in a scalable structured field instead of prose, and step quantities need the
  same treatment.
- **Inline `{{token}}` markup in `body`, expanded at render time.** Rejected — positional markup is
  fragile against model drift (a malformed or missing token doesn't just fail to expand, it mangles
  the surrounding sentence), and it entangles the step's prose voice with a rendering concern.

## Consequences

- `uses` flows through the existing recipe read/write paths automatically (`RecipeBlockSchema`,
  `TweakPatchSchema`, PATCH validation, `steps` as `Json?`) — no new endpoints, no DB migration.
- Three surfaces render the same inline hints via the shared `StepItem`/`StepList` (recipe page
  Method section, chat `RecipeLetter`) and via `CookingMode`'s own local step renderer (it doesn't
  use `StepItem`, so the rendering logic — `StepBody` — is a standalone component both sides call).
- Legacy and pasted recipes without `uses` render exactly as before — the field is optional and no
  hints appear.
- A tweak that adds/removes/renames an ingredient must also update matching `uses` entries or a hint
  will silently stop matching (rendering as plain text) — the tweak prompt carries this instruction,
  but correctness still depends on the model applying it (same trust model as every other tweak
  field).

## 2026-07-09 update — chip row replaced with inline hover/tap hints

The initial ship rendered `uses` as a small pill/chip row below the step (`StepUses`), visually
separate from `body`. User feedback: the chip row read as visually messy, and the preferred
experience was the quantity surfacing on the ingredient mention itself, not below it.

Considered baking the quantity into the prose directly (the user's first suggestion) — rejected,
same reasoning as "Quantities baked into step prose" above: it would go stale the instant servings
are scaled.

Landed instead on turning the existing prose mention into an interactive hint (`StepBody`,
replacing `StepUses`): find `use.name` in `body` (case-insensitive, word-boundary, first
non-overlapping occurrence per use), wrap it in a button that opens a small popover with the
scaled quantity on hover or tap. This keeps scaling correct (the popover computes from `scaleAmount`
at render time, same as the old chip) while meeting the "read naturally" ask — with the tradeoff
that a use only gets a hint if its name is actually mentioned in that step's body; unmatched uses
render no hint and there is no chip fallback (confirmed acceptable: "strictly no chip").
