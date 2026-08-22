# ADR-0027 — The pantry is corrected at the point of use

**Status:** Accepted

**Amends:** [ADR-0026](0026-checklist-reopens-never-ask-for-possession.md)

## Context

Tapping **"Ask Ah Mah for substitutions"** on a recipe used to fill the composer with every ingredient the pantry record claimed the user lacked, then leave them to fix it by hand:

> I'm missing dark soy sauce, galangal, candlenut, thick rice noodles for the Ayam Masak Merah. Can you suggest substitutions or alternatives?

The owner's complaint: *"a lot of the time our inventory does not sync with the real world."* The record drifts in **both** directions. It **under-reports** — things owned but never entered, the gap [ADR-0026](0026-checklist-reopens-never-ask-for-possession.md) chartered the checklist against. It also **over-reports** — things entered once and since finished, which nothing in the app has ever corrected except a trip to the Pantry. The nudge trusted the record blindly, so the ask was routinely wrong in one direction or the other, and the only repair was editing prose in a text box.

`CONTEXT.md` had already named the hole, under *Checklist block*:

> Additions **accept** the pantry record ("not in pantry — grab next shop"); the checklist **corrects** it ("you may already own this"). The checklist runs before the recipe exists; Additions run after, on whatever is genuinely absent.

Nothing corrected the record **after** a recipe existed. That is the whole of what this ADR adds. The recipe card is the one moment in the app where the user is looking at a specific, finite list of ingredients and knows, item by item, whether they have them — which makes it the cheapest correction surface in the product, and the only one where correcting is a by-product of something the user came to do anyway.

ADR-0026 §8 established that a tick is a factual claim written straight to the pantry, client-side. It stopped at the recipe boundary — the checklist is a *gate before* the dish. This extends the same claim past that boundary and, for the first time, admits the opposite claim.

## Decision

### 1. Reconcile mode is the **What to gather** grid, flipped — not a new card

`RecipeLetter` gains a local `reconciling` boolean. No new component, no schema, no fence.

**Resting** is unchanged: the grid lists the ingredients, missing rows carry the cart button, the nudge sits under the pantry pill. **Reconciling** flips the *same* grid — every row gains a checkbox, pre-ticked from `ingredientHave()`; cart buttons hide (a row being re-classified is not a row being shopped for); the servings stepper stays; the footer swaps to a submit labelled by what is still unticked — *"Ask about the 3 you're missing"*.

The rule is **one list on screen, never two**. A separate checkbox card was the obvious build and is exactly wrong: it would put the same soy sauce on screen twice, in two states that can disagree, and leave the user to work out which one the app believes. Two lists of the same ingredients can contradict each other; one cannot.

### 2. A tick and an untick are both factual claims, and both write

ADR-0026 §8: *"a tick is a factual claim — 'I own this' — so the write is deterministic and client-driven."* Reconcile takes that sentence at its word in both directions. An untick is the same kind of claim with the sign reversed — *"I do not own this"* — made against a record that currently says otherwise, by a user looking at the item's name.

This is not the thing ADR-0026 rejected. That ADR declined to **record un-ticks as absence**, on the grounds that `InventoryItem` records what you *have* and absence is a different data model. Correct, and unchanged. But an untick here is not a request to store absence — it is a request to **delete a row that is in the record and should not be**. That is an ordinary correction to a have-list, not a new data model, and the reason it was never available was simply that nothing outside the Pantry screen could delete.

Writes land **first, and awaited**; the message sends only after. The chat turn calls `getInventory`, so sending first races the writes and the model reads the pre-correction pantry — the same hazard `ChecklistBlock.onTicked` already guards. On a failed write the ask is not sent at all: an uncorrected pantry plus a correct-looking sentence is worse than no send.

### 3. The two directions are deliberately asymmetric, because the matcher is loose

`ingredientMatches` matches on **any shared token**:

```ts
ingredientMatches("dark soy sauce", ["fish sauce"]) // → true, via "sauce"
```

That is a real defect ([#491](https://github.com/alantay/ask-ah-mah/issues/491)), and it makes the two directions carry unequal risk. A bad match on an **add** costs one spare pantry row. A bad match on a **delete** destroys data — unticking *dark soy sauce* would remove *fish sauce*. Symmetric intent, asymmetric blast radius, so asymmetric implementation:

- **Tick a missing row** → `POST /api/inventory` with the **recipe's own** ingredient name, `type: "ingredient"`, and its `category` passed straight through (`RecipeIngredientModel.category` and `InventoryItemSchema.category` are the same `CategorySchema`, so there is no re-classification round-trip). Upserts on `(userId, name, type)`, so re-adding is a no-op. This mirrors ADR-0026 §8 exactly.
- **Untick a have row** → `DELETE /api/inventory` with the **matched pantry item's** name, never the recipe's, and only past three guards. **Exactly one pantry item matches**: on an ambiguous match (2+) the delete is skipped. **No ticked ingredient claims that same item**: one pantry row can be matched by two recipe ingredients, so unticking *fish sauce* against a pantry holding only *Soy sauce* would otherwise destroy the row the ticked *soy sauce* just affirmed — the claim is computed across the whole recipe before any delete is decided. **The delete pool is ingredient-type inventory only**: `DELETE /api/inventory` has no type filter, so an unticked *jasmine rice* matching a *Rice cooker* would remove the appliance. (The *display* pool stays combined — the pill, the carts and the pre-tick have always counted kitchenware, and this ADR does not move them. An ingredient whose only match was kitchenware is therefore pre-ticked and, on submit, **added** as an ingredient, which is the right record.) A row held back by any guard is treated as missing **for this dish only** — which is precisely ADR-0026 §5's transient confirmed-absence, already the sanctioned fallback for "the user said no but there is nothing durable to write." The item appears in the sentence; the record is untouched.

`buildReconcilePlan` is a pure function over `(ingredients, inventoryItems, ticked)` returning `{ adds, deletes, stillMissing }`, so the whole of this rule is testable without a DOM.

When the matched pantry name differs from the recipe's wording, reconcile mode shows it on the row (`galangal` · *pantry: fresh galangal*) — and shows it **only** on an unambiguous match, since naming a pantry item beside a row that will never be deleted would promise a write that cannot happen.

### 4. The submit sends directly; the composer round-trip is deleted

The drafted-text step existed for exactly one reason: the drafted text was wrong, so the user needed a chance to fix it. Once the picker corrects it, the round-trip is a step that asks the user to approve their own answer. `ClarifyBlock`, `SuggestionsBlock`, and `ChecklistBlock` all send directly; `RecipeLetter` now takes `onSend` on the same terms and drops `onDraft`.

`RecipeLetter` was `onDraft`'s only consumer, so this orphans the entire composer-seeding path — `handleDraft` and the re-seed nonce in `Chat.tsx`, the `onDraft` prop on `MessageList`, and `MessageInput`'s seed handling. Removed here rather than left dead: this change is what orphaned it, and an unused seeding mechanism plumbed through three components is a trap for the next reader.

The message itself keeps its shape, over the corrected list:

> I'm missing dark soy sauce and galangal for the Ayam Masak Merah. Can you suggest substitutions or alternatives?

It says nothing about what was ticked. The pantry write covers that and `getInventory` picks it up. There is no fence, no schema, and no replay state — unlike `ChecklistBlock` this is not a chat block, so there is no locked view to reconstruct and no `checklist-reply` equivalent. The sentence is the whole receipt ([ADR-0006](0006-cook-with-what-you-have-is-a-conversation.md)).

If nothing is left missing after the corrections, the writes still apply and **no message is sent** — the submit reads *"Save what I have"*. The corrections were the point; there is no substitution to ask for.

### 5. The nudge shows whenever a pantry is tracked, including at a full count

The old gate was `missingIngredients.length > 0`. Under the new purpose that condition is not merely loose, it is backwards: the over-reporting case *is* **"the pill says 10/10 but the bottle is empty"**, and at 10/10 the old gate hid the only affordance that could fix it. Over-reporting is invisible by construction — the record looks complete, which is what makes it wrong.

The condition is now: a pantry is tracked (`userId` and a non-empty inventory) and the recipe is not streaming. Guests, empty pantries, and streaming recipes see nothing, exactly as before. The copy — *"Short an ingredient? Ask Ah Mah for substitutions"* — reads fine at full marks, since the honest reading of a full pill is *"as far as I know."*

### 6. One toast, no per-delete confirm

A summary toast — *"Pantry updated — 2 added, 1 removed."* — fires once, after the writes land. It is not a confirmation step, deliberately; but it is the only feedback on a **destructive** write, so it is not optional either. The reconcile footer is two buttons and no more: the submit, labelled *"Ask about the N you're missing"* or *"Save what I have"* depending on what is still unticked, and a secondary **Never mind** beside it that discards the staged ticks and writes nothing. "Never mind" rather than "Done", because the button throws the user's corrections away and should say so.

## Why not the alternatives

**An ephemeral picker that only shapes the prompt.** Selection changes the drafted sentence and writes nothing. The smallest possible change, and the one that treats the symptom: the pantry stays wrong, so the same items get re-corrected on the next recipe, forever. The user does the work and the app forgets it.

**List only the missing ingredients.** Matches the entry copy (*"Short an ingredient?"*) and handles the under-reporting direction cleanly. Rejected on the owner's call: a missing-only list has no way to express *"the pill says I have it, but the bottle is empty."* Half the drift is invisible to it, and it is the half nothing else in the app catches.

**Adds only, no deletes.** Leaves Pantry as the sole place anything is removed, which is safe and keeps this ADR from having to argue §2 at all. Rejected: it is half-honest — it invites the user to correct the record and then silently declines half their corrections — and it drops the over-reporting case that motivated listing every ingredient rather than only the missing ones.

**Confirm before each delete.** The safest option, and the one a destructive write normally earns. Rejected: it puts two decisions behind one intent on a card whose entire value is being fast, and the second decision carries no information the first did not. The summary toast carries the signal instead, and the one-match guard carries the safety.

**Draft into the composer as today.** Covered in §4: the round-trip only ever existed because the draft was wrong.

**Tighten `ingredientMatches` here.** The genuine root cause of both drift directions, and the fix that would make §3's asymmetry unnecessary. Deliberately out of scope: the matcher moves the pantry pill, the cart buttons, and every existing test that touches either. Bundling it would make this change unreviewable and put a recipe-card feature on the critical path of a shared-matcher rewrite. Filed as [#491](https://github.com/alantay/ask-ah-mah/issues/491).

## Consequences

- `RecipeLetter` gains reconcile mode; `reconcile.ts` holds `matchingPantryItems` and the pure `buildReconcilePlan`. `onDraft` and the whole composer-seeding path through `Chat.tsx`, `MessageList`, and `MessageInput` are gone.
- `CONTEXT.md` gains a **Reconcile mode** glossary entry, cross-linked from **Checklist block** and **Addition**. The pair now reads as one story: the **Checklist block** is the *pre-recipe* corrector, reconcile the *post-recipe* one, and **Additions** still merely accept the record in between.
- **`src/features/Inventory/` is untouched.** Nothing about the Pantry screen changes, and no behaviour there is deprecated by this.

**The open question — what Pantry is for.**

Reconcile is **recipe-scoped by construction**: it only ever touches ingredients that are on screen. Three things follow, and none of them is a defect to be fixed later — they are the boundary of the mechanism:

- It cannot **seed a cold-start pantry**. A user with nothing recorded gets no nudge at all, because the gate requires a non-empty inventory. Reconcile corrects; it does not bootstrap.
- It cannot **survey the whole pantry**. It has no way to surface what the user owns that no recipe asked about, and no way to delete the finished oyster sauce while no recipe is open.
- It cannot **feed Featured Selection** ([ADR-0007](0007-pantry-selection-is-feature-emphasis.md)). Cook With What You Have (Mode 3) reads the *entire* pantry and Featured Selection is a whole-pantry act; neither can be driven from a recipe-scoped grid.

The likely split is **Pantry as *stock and survey*, reconcile as *correct in place***. That is a hypothesis recorded here, **not a decision** — this ADR does not settle what Pantry is for, and a later ADR will have to. The question is deferred to live use on the owner's call: *"let's try the app first. leave pantry as is. we will figure along."*

**The known cost, accepted with eyes open:** the pantry accumulates **recipe-phrased entries** the user would never have typed — *thick rice noodles (laksa noodles)* rather than *rice noodles* — because an add writes the recipe's own wording. The loose matcher incidentally prevents this from producing outright duplicates: an item sharing any token with an existing entry would already have rendered as *have* and never been offered as an add. So the result is odd phrasing, not doubles — and the same looseness that makes §3's delete guard necessary is what keeps this cost small. If [#491](https://github.com/alantay/ask-ah-mah/issues/491) tightens the matcher, this cost gets *worse*, and that is a thing to weigh when it is picked up.

**Out of scope**: tightening `ingredientMatches` ([#491](https://github.com/alantay/ask-ah-mah/issues/491)); free staples still counted as Additions in `RecipeLetter` ([#490](https://github.com/alantay/ask-ah-mah/issues/490)); undo for a landed delete; reconcile on Cook With What You Have results; any change to `src/features/Inventory/`.

Designed in `docs/superpowers/specs/2026-08-22-substitutions-reconcile-design.md`.
