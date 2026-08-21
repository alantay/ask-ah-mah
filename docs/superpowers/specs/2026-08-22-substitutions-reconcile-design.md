# Substitutions reconcile — correct the pantry at the point of use

**Date:** 2026-08-22
**Branch:** `feat/substitutions-picker`

## Problem

Tapping **"Ask Ah Mah for substitutions"** on a recipe fills the composer with
every ingredient the pantry record says the user lacks:

```
I'm missing dark soy sauce, galangal, candlenut, thick rice noodles for the
Ayam Masak Merah. Can you suggest substitutions or alternatives?
```

The owner's complaint: *"a lot of the time our inventory does not sync with the
real world."* The record under-reports (things owned but never entered) and
over-reports (things entered but since finished). The nudge trusts it blindly,
so the ask is routinely wrong, and the only way to fix it is to hand-edit prose
in the composer.

`CONTEXT.md` already names this gap. Under *Checklist block*:

> Additions **accept** the pantry record ("not in pantry — grab next shop"); the
> checklist **corrects** it ("you may already own this"). The checklist runs
> before the recipe exists; Additions run after, on whatever is genuinely absent.

Nothing corrects the record **after** a recipe exists. That is where this sits.

## Decision

### 1. Reconcile mode on the ingredients grid

`RecipeLetter` gains a local `reconciling` boolean. No new component, no card.

**Resting** — unchanged. Grid shows ingredients, missing rows get the cart
button, the nudge sits under the pantry pill.

**Reconciling** — the same "What to gather" grid flips: every row gains a
checkbox, pre-ticked from `ingredientHave()`. Cart buttons hide (a row being
re-classified is not a row being shopped for). The servings stepper stays. The
footer swaps to a submit labelled by what is still unticked — *"Ask about the 3
you're missing"*.

One list on screen, never two. A separate checkbox card was rejected: it would
put the same soy sauce on screen twice, in two states that can disagree.

### 2. Submit writes the pantry, then sends

Writes land **first and awaited**, then the message sends. The chat turn calls
`getInventory`; sending first races it and the model misses the corrections —
the same hazard `ChecklistBlock.onTicked` already guards.

The two directions are symmetric in intent but **not** in implementation,
because `ingredientMatches` matches on any shared token:

```ts
ingredientMatches("dark soy sauce", ["fish sauce"]) // → true, via "sauce"
```

A bad match on an **add** is harmless (one extra pantry row). A bad match on a
**delete** is destructive (unticking *dark soy sauce* removes *fish sauce*).

- **Tick a missing row** → `POST /api/inventory` with the recipe's ingredient
  name, `type: "ingredient"`, and its `category` passed straight through
  (`RecipeIngredientModel.category` and `InventoryItemSchema.category` are the
  same `CategorySchema`, so no re-classification round-trip). Upserts on
  `(userId, name, type)`, so re-adding is a no-op. Mirrors ADR-0026 §8.
- **Untick a have row** → `DELETE /api/inventory` with the **matched pantry
  item's** name (not the recipe's), and **only when exactly one pantry item
  matches** — i.e. exactly one entry of `inventoryItems` satisfies
  `ingredientMatches(ing.name, [item.name])`. On an ambiguous match (2+), skip
  the delete and treat the item as missing **for this dish only** — ADR-0026 §5's transient confirmed-absence,
  already the sanctioned fallback.

When the matched pantry name differs from the ingredient name, the row shows it
(`galangal` · *pantry: fresh galangal*) so no delete is a surprise.

### 3. The message

Same shape as today, over the corrected list:

> I'm missing dark soy sauce and galangal for the Ayam Masak Merah. Can you
> suggest substitutions or alternatives?

Nothing about what was ticked — the pantry write covers that and `getInventory`
picks it up. Ambiguous-match items appear in the sentence but were never
deleted: absent for this dish, record untouched.

No fence, no schema, no replay state. Unlike `ChecklistBlock` this is not a chat
block, so there is no locked view to reconstruct and no `checklist-reply`
equivalent. The sentence is the whole receipt (ADR-0006).

### 4. Gating

Drop the `missingIngredients.length > 0` condition on the nudge. It is now
wrong: the over-reporting case is *"pill says 10/10 but the bottle is empty"*,
and today the nudge is invisible at 10/10. New condition — pantry tracked
(`userId` and a non-empty inventory), not streaming. The copy reads fine at full
marks.

### 5. Edges

| Case | Behaviour |
|---|---|
| Nothing missing after edits | Writes apply, no message sent, submit reads *"Save what I have"* |
| Exit without submitting | Done/✕ discards staged ticks, writes nothing |
| Writes landed | One toast — *"Pantry updated — 2 added, 1 removed"* |
| Streaming / guest / empty pantry | Nudge hidden, exactly as today |

The toast is not a confirm (rejected — the card's point is speed) but it is the
only feedback on a destructive write, so it is not optional.

### 6. Prop change: `onDraft` → `onSend`

`MessageList` already passes `onSend` to every other block (`ClarifyBlock`,
`SuggestionsBlock`, `ChecklistBlock`); `RecipeLetter` takes `onSend` the same
way and drops `onDraft`.

`RecipeLetter` is `onDraft`'s **only** consumer, so this orphans the whole
composer-seeding path: `handleDraft` and the re-seed nonce in `Chat.tsx`, the
`onDraft` prop on `MessageList`, and `MessageInput`'s seed handling. Removing it
is part of this change rather than left dead — this change is what orphans it,
and leaving an unused seeding mechanism plumbed through three components is a
trap for the next reader.

## Why not the alternatives

**Ephemeral picker, prompt only.** Selection shapes the drafted text and writes
nothing. Smallest change, but the pantry stays wrong and the same items get
re-corrected on the next recipe. Rejected: it treats the symptom.

**List only the missing ingredients.** Matches the entry copy and the
under-reporting direction. Rejected on the owner's call — it cannot express *"the
pill says I have it, but the bottle is empty."*

**Adds only, no deletes.** Leaves Pantry the sole place anything is removed.
Rejected: half-honest, and it drops the over-reporting case that motivated
listing every ingredient.

**Confirm before each delete.** Safest. Rejected: two decisions for one intent,
on a card whose whole value is being fast. The summary toast carries the signal
instead.

**Draft into the composer as today.** The composer round-trip only existed
because the drafted text was wrong. Once the picker corrects it, the step is
redundant. `ChecklistBlock` submits directly; this follows.

**Tighten `ingredientMatches`.** The genuine root cause of both drift directions.
Deliberately out of scope: it moves the pantry pill, the cart buttons, and every
existing test. File separately.

## Open question — what Pantry is for

Reconcile is **recipe-scoped by construction**: it only touches ingredients on
screen. It cannot surface what the user owns that no recipe asked about, cannot
seed a cold-start pantry, and cannot delete the finished oyster sauce when no
recipe is open. Cook With What You Have (Mode 3) reads the *whole* pantry, and
Featured Selection (ADR-0007) is a whole-pantry act — neither can be fed from
here.

The likely split is Pantry as *stock and survey*, reconcile as *correct in
place*. **Not settled here.** On the owner's call the Inventory feature is left
untouched and the question is deferred to live use: *"let's try the app first,
leave pantry as is, we will figure along."*

Known cost: the pantry accumulates recipe-phrased entries (*thick rice
noodles*) the user would not have typed. The loose matcher incidentally prevents
outright duplicates — an item sharing any token would already have rendered as
*have* and never offered an add — so the result is odd phrasing, not doubles.

## Testing

`RecipeLetter.test.tsx` gains:

- tapping the nudge flips the grid to checkboxes, pre-ticked from pantry state
- ticking a missing row POSTs it with its `category`
- unticking an unambiguously matched row DELETEs the **matched pantry name**
- an ambiguous match skips the DELETE but still lands in the sent sentence
- writes resolve before the message is sent
- zero-missing submit applies writes and sends nothing
- exit discards staged ticks without writing
- nudge renders at 10/10 when a pantry is tracked

`MessageInput.test.tsx` and `MessageList.test.tsx` lose their seed-text cases
along with the seeding path.

## Docs

- **ADR-0027** — decides what ADR-0026 ducked. ADR-0026 rejected *recording
  un-ticks as absence*; deleting a row that **is** in the record is a different
  claim, and this is the post-recipe corrector `CONTEXT.md` describes as missing.
  Note: the repo already carries two `0026-*` files, and the PWA decision was
  pencilled for 0027 but is on hold.
- `CONTEXT.md` — glossary entry for **Reconcile mode**, cross-linked from
  *Checklist block* and *Addition*.
- `docs/progress.md` — one line.

## Out of scope

Tightening `ingredientMatches`; undo for a landed delete; reconcile on Cook With
What You Have results; any change to `src/features/Inventory/`.
