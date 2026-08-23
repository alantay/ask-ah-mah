# ADR-0028 — Substitutions are answered from the shelf first

**Status:** Accepted

**Extends:** [ADR-0006](0006-cook-with-what-you-have-is-a-conversation.md)
**Repairs a premise in:** [ADR-0027](0027-the-pantry-is-corrected-at-the-point-of-use.md)

## Context

[ADR-0027](0027-the-pantry-is-corrected-at-the-point-of-use.md) shipped reconcile mode: the user corrects the pantry on the recipe card, the corrections are written and awaited, and only then does the ask go out —

> I'm missing bok choy, shaoxing wine for the Ginger Chicken. Can you suggest substitutions or alternatives?

The answer came back generic. Verified end-to-end against the real model with the pantry holding `chicken thigh`, `dry sherry`, and `napa cabbage` — exact covers for both missing items: **zero tool calls**. `getInventory` never fired. The reply did name dry sherry and napa cabbage, but mid-list among five other options, as the textbook substitutes anyone would recite, with no sign it knew they were on the shelf.

That is the app's premise inverted. *"You've already got dry sherry — 1:1, done"* is [ADR-0006](0006-cook-with-what-you-have-is-a-conversation.md). A five-option substitution essay is its opposite: the user did the work of correcting their pantry, and the answer ignored it.

### The cause was an instruction, not an omission

The obvious reading is that `CHAT_SYSTEM_PROMPT` lacked a routing-table row for a substitution ask. It is worse than that. **Two lines told the model to skip the pantry**, and it obeyed.

The routing table's last row classified the ask:

> General cooking *knowledge* question with no single thing to make — a comparison ("baking soda vs baking powder"), **a substitution ("can I use yogurt instead of buttermilk?")**, a definition, or how-something-works → Plain text, no block

And the `getInventory` tool description barred the tool for that class:

> call this before suggesting recipes or answering "what can I cook" … **Do NOT call it for general cooking knowledge questions**

A substitution was a knowledge question; knowledge questions were barred from `getInventory`. Every routing row that funnelled through the tool was a recipe or suggestions path. The model was following the prompt precisely. Mode 2's prose repeated the same classification a third time.

This matters for how the fix is judged: adding a row on top of the two suppressing lines would have left the model with a direct contradiction, not a rule.

## Decision

### 1. A substitute ask for a named ingredient calls `getInventory` and leads with the pantry

A dedicated routing row, placed **above** the knowledge row so the narrower rule is read first: the user asks what to use **instead of** a named ingredient → `getInventory` first → plain text, lead with what the pantry already covers.

The two suppressing lines are repaired rather than overridden. The knowledge row narrows to *"no single thing to make **and nothing to replace**"* and states the tool ban explicitly for what remains. The tool description gains substitute asks among its triggers and carves them out of the knowledge-question ban — *"a substitute ask is not one of those: the pantry IS the answer there."* Mode 2's prose keeps its substitution mention, since the answer genuinely is still prose, but gains a pointer that prose is not tool-free.

A Behavior rule carries the substance, because a routing cell is too terse to hold it: **lead with what they already have** — name it, give the ratio — then at most one short line for what the pantry genuinely cannot cover. Never open with a ranked list of five generic swaps when a cover is sitting on the shelf.

### 2. The scope is every named-ingredient substitute ask, not just the reconcile-generated one

Typed or tapped, the same question gets the same answer.

Scoping the rule to reconcile's message shape was the safer-looking option and was rejected. It would make the prompt pattern-match a **client-authored string**, coupling the model's routing to a template in `RecipeLetter.tsx`. Worse, it would split one question into two answers: tapping the nudge gets pantry awareness, typing *"what can I use instead of shaoxing wine?"* gets an essay. A user cannot see why, and there is no honest account of the difference.

### 3. The boundary is replacement intent, not the word "substitute"

Extending the rule to every substitution-adjacent question — comparisons included — was also rejected. *"Baking soda vs baking powder"* has nothing the user is trying to replace, so the pantry has nothing to contribute and the tool call is pure cost.

The line is **replacement intent for a named thing**. Comparisons, definitions, and how-something-works stay pantry-free, and a live negative case guards that the new row did not leak into them.

### 4. The answer stays prose; the recipe card is not re-emitted

Re-emitting a `recipe` block with the swaps written in was considered and rejected on two grounds: it contradicts Mode 2's trigger — no dish was named, the user asked a question about one already on screen — and it duplicates `/api/recipe/[id]/tweak`, which exists to edit a recipe in place ([ADR-0010](0010-recipe-tweak-returns-a-patch.md)). Applying a swap to the card stays that path's job.

## Consequences

- **One extra tool call** on substitute-ask turns. Accepted: it is the turn where the pantry is the entire value of the answer.
- **Answers get shorter and more specific.** The generic list is no longer the opening move, and often is not needed at all.
- **[ADR-0027](0027-the-pantry-is-corrected-at-the-point-of-use.md)'s await ordering was correct for the wrong reason.** It justifies awaiting the pantry writes before sending *because "the chat turn calls `getInventory`, so sending first races the writes."* Until now that race could not occur — the call was never made. The ordering was right and worth keeping; its stated reason only becomes true with this ADR. Nothing in ADR-0027 changes.
- **The prompt's internal contradiction is retired.** The tool description and the routing table no longer disagree about whether a substitution may touch the pantry.
- **Mode 5 is untouched.** The checklist is dish-anchored — its trigger requires a specific dish in play whose load-bearing ingredients are missing. A substitute ask names no dish to cook, so the new row cannot collide with it.
- **[ADR-0024](0024-clarify-reopens-never-ask.md)'s *can-act → act* guard is unaffected.** This adds a tool call before prose, not a question. Nothing new stalls.

## Verification

Behaviour lives in the model, so the guards are in two layers.

String assertions in `src/app/api/chat/constants.test.ts` prove the five prompt edits survive future rewrites — cheap, in CI, and blind to behaviour.

Behaviour is proven in `eval/chat-routing.eval.ts` (`pnpm test:eval`) — real model, canned `getInventory`, opt-in and deliberately out of CI, which already exists for exactly this class of regression: prompt routing that `route.test.ts` cannot see because it mocks `streamText`. The harness gained tool-call capture (`runTurn` returns `toolNames` read off `generateText`'s `steps`); before this it could observe only output text, which is why a silent tool skip could ship at all.

Three cases, red before the prompt edit at 5/7 and green after at 7/7: the reconcile ask verbatim, its typed twin, and the negative comparison guard. The "leads with" check is a position assertion — the pre-fix reply *did* name dry sherry, just fifth — and it reads the **earliest** pantry cover rather than a fixed one, because which cover leads follows the order the user named the missing items.

**Out of scope**: free staples still counted as Additions ([#490](https://github.com/alantay/ask-ah-mah/issues/490)); tightening `ingredientMatches` ([#491](https://github.com/alantay/ask-ah-mah/issues/491)); applying a swap to the recipe card without a manual tweak.

Designed in `docs/superpowers/specs/2026-08-22-substitutions-consult-pantry-design.md`.
