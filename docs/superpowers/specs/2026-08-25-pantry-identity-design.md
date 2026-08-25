# Pantry identity: one canonical key for matching and dedupe

Closes #491. Closes the duplicates half of #487.

## The problem

Two bugs that look separate share one missing concept: the app has no single
answer to *"are these two ingredient names the same thing?"*

**#491 — the matcher is over-permissive.** `ingredientMatches`
(`src/lib/recipes/matchIngredient.ts`) returns true when the recipe ingredient
and a pantry name share **any** token after stopword removal:

```ts
ingredientMatches("dark soy sauce", ["fish sauce"]) // → true, via "sauce"
ingredientMatches("rice noodles",   ["rice"])       // → true, via "rice"
```

That silently marks ingredients as *have*, moving the pantry pill, the 🛒
buttons, the substitutions sentence, and Close vs. Stretch classification.

**#487 — the pantry accumulates near-duplicates.** `normalizeName`
(`src/lib/inventory/Inventory.ts:19`) trims, collapses whitespace and
sentence-cases. Combined with `@@unique([userId, name, type])` that makes
*exact* duplicates impossible, but nothing folds plurals, so a real pantry
grows `Shallot` alongside `Shallots`.

**They are coupled.** The reconcile design
(`2026-08-22-substitutions-reconcile-design.md`) notes the loose matcher
*"incidentally prevents outright duplicates — an item sharing any token would
already have rendered as have and never offered an add."* Fixing #491 removes
that accident, so #487 gets worse unless both land together.

### A third bug, found while designing this

The current `STOPWORDS` list conflates two kinds of word:

- **prep** — `chopped`, `sliced`, `diced`, `minced`, `thin`, `large`, `fresh`.
  These describe how something was cut or sold. Identity survives.
- **form** — `dried`, `ground`, `powder`, `extract`, `cooked`, `raw`.
  These describe what something *is*. Dried chilli, garlic powder and vanilla
  extract are separate pantry items from chilli, garlic and vanilla.

Both are stripped today, so the app already treats **dried chilli ≡ chilli**,
and `canonicalShoppingKey` already collapses them on the Shopping List.
Splitting the list is what makes conservative folding possible: once form words
survive, the names that still collide differ only by plural, case or prep word —
so *either* name is a correct survivor and the merge cannot lose meaning.

## Design

### One module for ingredient identity

New `src/lib/ingredients/`, owning the word lists and both operations:

| Export | Purpose |
| --- | --- |
| `tokenize(name)` | strip parens, punctuation, numbers, `UNITS` and `PREP` words; singularize. `FORM` words survive. |
| `canonicalKey(name)` | `tokenize(name).join(" ")` — *is this the same pantry row?* |
| `ingredientMatches(ingredientName, inventoryNames)` | head-noun equality **and** one token set a subset of the other — *does the pantry cover this ingredient?* |

Two strictnesses over one tokenizer. Dedupe uses **key equality**; matching uses
the looser **subset** rule. The subset rule is what keeps `olive oil` ↔ `oil`
matching (the pantry holds a generic that covers a specific) while
`dark soy sauce` ↔ `fish sauce` correctly fails — `fish` is a modifier that
appears in neither direction.

A new top-level module rather than growing `shoppingList/`: pantry, recipes and
shopping list all consume this, so nesting it under any one of them inverts the
dependency.

`canonicalKey` falls back to the lightly-cleaned name when tokenizing leaves
nothing, so an input like `"Fresh"` still yields a stable non-empty key.

### Storage

`InventoryItem` gains a derived `canonicalKey String`. The unique constraint
moves from `[userId, name, type]` to `[userId, canonicalKey, type]`.

`name` continues to store the name as captured, so the UI keeps showing
`Chicken breast` rather than `chicken breast`. Folding becomes the database's
job: the existing upsert keeps working, keyed differently.

`addInventoryItem` and `removeInventoryItem` key off `canonicalKey`. Every write
path into the pantry — `/api/inventory/parse`, `captureMentionedInventory`, the
model's `addInventoryItem` tool, checklist ticks, reconcile ticks — already
funnels through those two functions, so no call site changes.

**Folding is silent.** Re-adding an item that folds into an existing row behaves
exactly as re-adding an exact duplicate does today: an upsert, no toast, no
prompt. The safety comes from the folding rule being conservative, not from UI
compensating for it.

**The existing row keeps its name.** The upsert's `update` branch must not write
`name` — `Shallots` arriving against a stored `Shallot` refreshes
`quantity`/`unit`/`category`/`lastUpdated` and leaves the display name alone.
This is the runtime counterpart of the migration's oldest-row-survives rule.
Since colliding names differ only by plural, case or prep word, either name is
correct and stability beats recency.

### Migration

Three steps, because the unique index cannot be added while collisions exist:

1. Additive migration adds `canonicalKey` as nullable.
2. Backfill script computes each row's key and merges collisions — the oldest
   `dateAdded` row survives and keeps its `quantity`/`unit`/`category`; the rest
   are deleted.
3. Migration makes the column required, drops `@@unique([userId, name, type])`
   and adds `@@unique([userId, canonicalKey, type])`.

Normally a risky shape. The app is not public — the only real data is the
owner's own test pantry — so a bad merge costs a re-add, not an incident. Doing
this before launch is far cheaper than after.

### Matcher and call sites

`matchIngredient.ts` re-points at the new module; its hand-maintained stopword
copy is deleted. Three consumers, none of which change shape:

- `src/features/Chat/components/recipe/RecipeLetter.tsx:80`
- `src/features/Chat/components/recipe/reconcile.ts:14`
- `src/features/Chat/components/recipe/pantryUtils.ts:9`

The warning comment at `reconcile.ts:6` about loose matching is removed — the
"only delete when exactly one pantry item matches" guard stays, since ambiguity
is still possible, just rarer.

### Shopping list

`canonicalShoppingKey` delegates to the shared tokenizer, deleting the word-list
copy that `canonicalKey.ts:5` admits it mirrors by hand.

`canonicalTipKey` is **not** touched. It keys a shared cross-user cache; changing
it would orphan every stored tip.

Two consequences, both accepted:

- `dried chilli` and `chilli` become separate Shopping List rows. Correct, but a
  visible change to shipped behaviour.
- The aisle-classification cache is keyed by `canonicalShoppingKey`, so
  form-word entries miss once and reclassify. Non-fatal — an unknown key falls
  back to `Other` and is reclassified on the next pass.

## What visibly changes

- Pantry pill counts drop on recipes that were matching loosely.
- More 🛒 buttons appear, because more ingredients are honestly missing.
- Some recipes reclassify Close → Stretch.
- The pantry stops accumulating plural variants.
- `dried chilli` and `chilli` split into two Shopping List rows.

## Testing

The prototyped cases become the unit suite — 18 matching, 12 dedupe, all passing
against the design:

```
matching: all 12 existing matchIngredient tests, plus both #491 bug cases,
          plus seed-pantry cases (vegetable oil ↔ Cooking oil, oyster sauce
          ↮ Soy sauce, garlic cloves ↔ Garlic, rice vinegar ↮ Rice)
dedupe:   Shallot=Shallots, Tomato=Tomatoes, Chicken breast=Chicken breasts,
          Chilli=Fresh chilli;  Chilli≠Dried chilli, Garlic≠Garlic powder,
          Vanilla≠Vanilla extract, Mushroom≠Dried mushroom,
          Minced beef≠Minced meat≠Minced pork, Seaweed≠Nori
```

The migration script is tested against a seeded database, including the merge
path. Then a `/verify` pass in the running app — the pill and cart changes are
exactly what unit tests will not catch.

## Out of scope

- **Synonym folding** (`Seaweed`/`Nori`). No token rule reaches a pure synonym;
  it needs a lookup table. Filed as a follow-up.
- **`Seaweed` / `Roasted seaweed`.** #487 lists these as duplicates. Declined on
  the same logic as dried chilli — roasting is a form change, not prep.
- **Over-long captured names** (`"Fresh firm fish (mackerel, snapper,
  barramundi)"`). The other half of #487, an extraction-prompt problem with no
  deterministic fix. Separate effort.
- **`spring onion` vs `Onion`.** Structurally identical to `olive oil` vs `oil`
  (generic subset, matching head) but wants the opposite answer. No token-shape
  rule separates them. Accepted limitation, documented in the ADR.
- **`type` in the unique key.** `("Ginger", "ingredient")` and
  `("Ginger", "kitchenware")` remain two legal rows, per #487's own note.

## Docs

- **ADR-0029** — one canonical key decides both pantry identity and recipe
  matching; prep words are stripped and form words are not. `0027` and `0028`
  are taken, so the reconcile spec's pencilled "ADR-0027" is stale.
- `CONTEXT.md` — glossary term for **Canonical Key**, cross-linked from
  *Addition* and *Reconcile mode*.
- `docs/progress.md` — one entry.
