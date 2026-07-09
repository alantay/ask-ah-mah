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

Rendered as a small chip row beside the step (`StepUses`), visually separate from the step's prose
`body` — never woven in as inline `{{token}}` markup, which is fragile and a broken token would
mangle the sentence.

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
- Three surfaces render the same chip row via the shared `StepItem`/`StepList` (recipe page Method
  section, chat `RecipeLetter`) and via `CookingMode`'s own local step renderer (it doesn't use
  `StepItem`, so the chip logic — `StepUses` — is a standalone component both sides call).
- Legacy and pasted recipes without `uses` render exactly as before — the field is optional and the
  chip row simply doesn't appear.
- A tweak that adds/removes/renames an ingredient must also update matching `uses` entries or the
  chips will reference stale ingredient names — the tweak prompt carries this instruction, but
  correctness still depends on the model applying it (same trust model as every other tweak field).
