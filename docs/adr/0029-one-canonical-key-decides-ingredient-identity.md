# ADR-0029 — One canonical key decides ingredient identity

**Status:** Accepted

**Resolves the open question in:** [ADR-0027](0027-the-pantry-is-corrected-at-the-point-of-use.md)

## Context

Two bugs that looked separate share one missing concept: the app had no single answer to *"are these two ingredient names the same thing?"*

**#491 — the matcher was over-permissive.** `ingredientMatches` returned true when the recipe ingredient and a pantry name shared **any** token after stopword removal:

```ts
ingredientMatches("dark soy sauce", ["fish sauce"]) // → true, via "sauce"
ingredientMatches("rice noodles",   ["rice"])       // → true, via "rice"
```

That silently marked ingredients as *have*, moving the pantry pill, the 🛒 buttons, the substitutions sentence, and Close vs. Stretch classification.

**#487 — the pantry accumulated near-duplicates.** `normalizeName` trimmed, collapsed whitespace and sentence-cased. Combined with `@@unique([userId, name, type])` that made *exact* duplicates impossible, but nothing folded plurals, so a real pantry grew `Shallot` alongside `Shallots`.

**They were coupled.** The loose matcher incidentally prevented outright duplicates — an item sharing any token with an existing entry would already have rendered as *have* and never been offered as an add. Fixing #491 alone removes that accident, so #487 gets *worse* unless both land together. [ADR-0027](0027-the-pantry-is-corrected-at-the-point-of-use.md) flagged exactly this and left it open: *"If #491 tightens the matcher, this cost gets worse, and that is a thing to weigh when it is picked up."* This ADR is that pickup, and the answer is below.

**A third bug, found while designing the fix.** The matcher's stopword list conflated two kinds of word: **prep** (`chopped`, `sliced`, `fresh`) describes how something was cut or sold — identity survives. **Form** (`dried`, `ground`, `powder`, `extract`) describes what something *is* — dried chilli, garlic powder and vanilla extract are different pantry items from chilli, garlic and vanilla. Both were stripped, so the app already treated dried chilli ≡ chilli in both the matcher and the Shopping List's own hand-rolled word list.

## Decision

### One tokenizer, two strictnesses

New `src/lib/ingredients/` owns the word lists and both operations, so pantry, recipes and shopping list share one definition of ingredient identity instead of three hand-maintained copies:

- `canonicalKey(name)` — **equality**. Decides whether two names are the same pantry row. Used for the `InventoryItem` unique constraint and the write path (`addInventoryItem` / `removeInventoryItem`).
- `ingredientMatches(ingredientName, inventoryNames)` — **coverage**, strictly looser. Decides whether the pantry covers a recipe ingredient: a pantry holding `oil` covers `olive oil` (matches) even though the two are still separate things to stock (different keys).

Coverage requires two rules, both necessary — either alone lets a real bug through (see Rejected below): the **head noun** (last content token) must agree between the two names, and **one token set must be a subset of the other**.

### The prep/form split

`tokenize()` strips prep words and leaves form words untouched. This is what makes conservative folding possible for dedupe: once form words survive, the names that still collide differ only by plural, case or prep word, so *either* name is a correct survivor and a silent merge cannot lose meaning. It is also what separates `dried chilli` from `chilli` in both the matcher and the Shopping List, closing the gap in the Context above.

## Rejected alternatives

**Head-noun match alone.** Drop the subset requirement, keep only "last token agrees." `dark soy sauce` and `fish sauce` share the head noun `sauce` and would still match — the exact #491 bug, unfixed.

**Subset alone.** Drop the head-noun requirement, keep only "one token set contains the other." `rice noodles` and `rice` — `{rice}` is a subset of `{rice, noodle}` — would still match, because subset alone says nothing about *what the thing is*, only what it's built from.

**A synonym table.** The one class of bug neither rule can reach: `Seaweed` and `Nori` share no tokens at all. Rejected — it needs a data source nobody has, and a bad synonym entry is a worse failure mode than a missed one. Filed as a follow-up.

## Accepted limitation

`spring onion` vs. a pantry holding `Onion` is structurally identical to `olive oil` vs. `oil` — generic subset, matching head noun — but wants the opposite answer: a spring onion is not covered by an onion. No token-shape rule separates the two cases; telling them apart needs knowledge the tokenizer doesn't have. Accepted rather than solved.

## This resolves ADR-0027's open question

ADR-0027 shipped reconcile mode on top of the loose matcher and named the coupling explicitly: tightening #491 would make the recipe-phrased-entries cost *worse*, because the loose matcher was incidentally the only thing standing between a recipe-worded add (`thick rice noodles (laksa noodles)`) and an outright duplicate. That ADR left the question open rather than answered.

The answer: tightening the matcher and giving dedupe its own mechanism are not sequential, they are the same fix. `ingredientMatches` no longer prevents duplicates by accident — nothing about coverage matching ever should have been doing that job — because `canonicalKey` now prevents them on purpose, at the database constraint, independent of what the matcher does. The predicted cost doesn't land because its silent guard was replaced with an explicit one in the same change.

## Consequences

- **Pantry pill counts drop** on recipes that were matching loosely.
- **More 🛒 buttons appear**, because more ingredients are honestly missing.
- **Some recipes reclassify Close → Stretch.**
- **The pantry stops accumulating plural and case variants** — `Shallot` and `Shallots` fold to one row.
- **`dried chilli` and `chilli` split into two Shopping List rows.** Correct under the prep/form split, but a visible change to shipped behaviour.
- **`RecipeLetter.tsx` and `reconcile.ts` keep their three delete guards.** Ambiguous matches are rarer now, not impossible, so the guards (exactly one pantry match, no ticked ingredient claiming the same item, ingredient-only delete pool) stay exactly as ADR-0027 specified them. Their code comments are updated to stop calling the matcher "loose" — the label was stale, the guards' reasoning was not.

### Known test-fixture debt

Two existing tests still pass but no longer test what their names claim, now that the matcher is tighter:

- `RecipeLetter.test.tsx:369-381`, *"never captions a kitchenware match — it is not deletable"*, uses `jasmine rice` against a pantry `rice cooker`. Under the old matcher this exercised the type-filter guard; under the new one the head nouns (`rice` vs. `cooker`) already disagree, so the assertion passes whether or not the guard fires. It can no longer distinguish its two outcomes.
- `reconcile.test.ts:112`, *"still reports an ambiguous unticked ingredient as missing,"* pairs `dark soy sauce` against `["fish sauce", "soy sauce"]`. Under the new rules only `soy sauce` matches — the input is no longer ambiguous — and the assertion checks `stillMissing`, which every unticked ingredient enters regardless of match count, so it never exercised the ambiguous branch either way.

Both tests are correct as written and neither is wrong to keep; noted here as debt rather than fixed, since fixing test fixtures is not this task.

## Outstanding

**Migrations are written, not applied.** `DATABASE_URL` points at the owner's real hosted data; nothing on this branch has touched it. See `docs/progress.md` for the exact sequence and its ordering constraint.

**The in-app `/verify` pass has not run.** The spec calls for a manual pass in the running app — pantry dedupe, the soy-sauce-vs-fish-sauce match, and the `N/M in your pantry` pill — because unit tests cannot see pill counts or cart buttons. That pass is the owner's to run after the migrations land; it has not happened yet.

Designed in `docs/superpowers/specs/2026-08-25-pantry-identity-design.md`.
