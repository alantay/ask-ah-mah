# ADR-0026 — Checklist reopens "never ask" for a *possession*, and names the fallback honestly

**Status:** Accepted

**Amends:** [ADR-0024](0024-clarify-reopens-never-ask.md)

## Context

Ah Mah writes recipes against the pantry record. The record is routinely incomplete — the user owns things they never told the app about. The owner's framing: *"the AI gives me a recipe based on my inventory, but I may not have added the ingredient, or the missing item is easily obtainable."* Pressed, the real worry surfaced: *"in the act of giving a recipe based on the pantry, we lose the true essence of the dish."*

Today the model resolves that gap silently. Ask for laksa with no laksa paste and it substitutes chilli and belacan, adds a `note`, and still calls the result **laksa**. Nothing about that output tells the user the dish has been bent. That silent bending is the failure this ADR addresses.

[ADR-0024](0024-clarify-reopens-never-ask.md) reopened "never ask" for exactly one thing — a **parameter**, through the tap-to-answer `clarify` block — and explicitly kept *"do you have X?"* shut. It also left one guard first among equals: **can-act → act**, *"a granny doesn't interview you when she can already start."*

The checklist reopens a **third** category the ADR did not sanction: a **possession**. That needs arguing for, not slipping in.

## Decision

### 1. Ah Mah may ask, once, whether the user owns what a named dish stands on

A new **Mode 5 — Checklist** is added to `CHAT_SYSTEM_PROMPT`: a fenced ` ```checklist ` block (`{ question, deal, rows: [{ id, label, hint?, category? }] }`) rendered as a **multi-select card** with staging and an explicit submit. It is a **gate** — emitted alone, then she waits, then cooks exactly one recipe. It never pairs with a `suggestions` or `recipe` block.

It fires only when a **named dish is in play** *and* that dish's **load-bearing** ingredients are missing. A thin pantry is not a trigger; open-ended browsing stays Suggestions.

### 2. The name test decides what goes on the list — and whether the name survives

> An ingredient qualifies **iff** removing or substituting it means the dish can no longer honestly carry its name.

Laksa → laksa paste, coconut milk, thick rice noodles. Not garlic, shallots, oil, soy.

One rule does double duty: it selects the rows *and* decides the fallback's name, so the two can never disagree. The list is literally *"what stands between this and being laksa."* 1–4 rows; **more than 4 missing → do not ask** (the dish is out of reach, not one tap away). Free staples and pantry items never appear.

### 2b. The makeable fork — *how* before *what*

Added after the first live review. When the missing load-bearing item is makeable in one session (rempah, curry paste, stock, sambal, pasta), asking straight about the product asks the wrong question: the user has two honest routes to the real dish, and each has a different possession question behind it. So the fork comes first as a Mode 4 `clarify` — "make my own" vs. "store-bought" is an **effort parameter**, precisely clarify's job — and the checklist follows next turn for whichever route was picked, never both.

Two existing blocks chained; no new fence, schema, or component. The governing rule (*suggestions picks a dish, clarify picks a parameter, checklist asks about a possession*) is what makes the chain legible rather than a special case.

**The from-scratch card is the better question.** It asks about the paste's makings — dried chilli, belacan, galangal, candlenut — and those are exactly what an incomplete pantry record misses. A jar of laksa paste is a thing you remember buying; loose candlenuts at the back of a cupboard are not. Ticking them satisfies the name test via §7's guard: making the thing is not substituting it, so the dish keeps its real name.

**This overrides the original "one tap, never two" instinct**, on the owner's call: *"i think its totally fine if we ask a couple of questions."* The cost is bounded — the fork only fires where a checklist was going to be raised anyway, so the floor is unchanged and the ceiling is two taps. Three guards keep it there: nothing long-ferment (soy sauce, fish sauce, vinegar, miso, gochujang, cheese) forks, more than 4 makings cannot fit a card, and a dish she can already cook never forks — that would be a permission question wearing a costume, which ADR-0024 bans outright.

### 3. The deal is stated up front

The ask names the dish, states what ticking **buys** (the real dish, by name) and what leaving it blank **costs** (she still cooks, under an honest name). `deal` is a distinct schema field rather than folded into `question`, so this is structural rather than a hope about phrasing. Announcing the fallback *before* the tap is what stops the rename reading as a climb-down — and it gives the user a reason to answer at all.

### 4. The name is binary; the dish is a gradient

Re-run the name test with the ticks counted as owned. Everything accounted for → the real dish, the real name. Anything still missing → she may **not** use the name, but the recipe uses **every** ticked item and lands as close as it honestly can. A majority-threshold rename ("tick most and keep the name") is rejected outright — it reintroduces exactly the bending this exists to stop.

### 5. A shown-but-unticked row is *confirmed absent*, and binds the name only

Stronger than "not in the pantry record", because the user engaged and said no. Substitution continues unchanged; the item may still be listed as an **Addition** with a `note`. The one forbidden thing is the result wearing the original name. The change is deliberately narrow: today substitution happens **and keeps the name** — this keeps the substitution and kills only the silence.

### 6. The gate is per-dish, and carries nothing

At most one checklist per dish; no limit per conversation. A new dish standing on a previously-declined item **asks again**. Confirmed-absence is written nowhere: it lives in the transcript, binds one dish's name, and expires with the exchange. Ticks need no such handling — they are in the pantry.

**"Per dish" means per *cooking*, not per conversation** — the clarification a live run forced. Asked for laksa, blanked the card, got the honest fallback, then asked for laksa again: she silently re-served the bent dish under the old verdict, with no way back short of typing *"I have laksa paste now"*. That contradicts this section's own premise — a no is dish-scoped **in time**, and one shopping trip later it is false. The second ask *is* the signal that something changed, so it re-opens the card.

The same run exposed the mirror case: *"laksa but I don't have laksa paste or coconut milk"* raised a card asking for laksa paste and coconut milk. A **prose-declared absence is already an answer**, so those items never earn a row — and if that empties the list, there is no card, just the honest fallback. Both are row-authoring rules, consistent with §5: the gate decides what to ask, never what a "no" means afterwards.

### 7. The carve-out from ADR-0024's *can-act → act*

Under this policy Ah Mah **can** act — she could write a bent laksa — and asks instead. The carve-out is that *"a sensible default"* was never meant to license **silently mis-naming the output**. Acting at the cost of the dish's identity is not acting at a sensible default; it is the failure mode this was chartered against. The gate shape keeps the stall to exactly one tap, and the hard guards bound it to the one moment it pays for itself.

**ADR-0024's other two guards survive verbatim.** No permission questions. And **freshness stays off-limits** ([ADR-0008](0008-no-shelf-life-ui.md)): *"do you have coconut milk?"* is knowable by the user; *"is your coconut milk still good?"* is not, at any interface.

### 8. Ticks write to the pantry, client-side

A tick is a factual claim — *"I own this"* — so the write is deterministic and client-driven (`POST /api/inventory`), not left to the model to choose to call `addInventoryItem`. `addInventoryItem` normalises the name and upserts on `(userId, name, type)`, so an item the user already had is not duplicated. The model assigns `category` at emit time, so a ticked row lands in the right pantry bucket without a second classification round-trip.

### 9. The reply rides a user-authored fence

Submitting sends a human sentence **plus** a hidden ` ```checklist-reply ` fence (`{ ticked, absent }`) — the first user-authored fence in the app. `Message.content` is a single `String`, so structure must ride inside the text, and *confirmed absent* cannot survive a reload on prose alone: a prose scan false-positives on negation (*"but no laksa paste"* scans as present), and a zero-tick answer carries no labels at all, so it is indistinguishable from an ignored card. **Replay reads the fence, never the prose.** The sentence remains the durable receipt that keeps the thread legible ([ADR-0006](0006-cook-with-what-you-have-is-a-conversation.md)).

## Why not the alternatives

**Keep the blanket "do you have X?" ban.** Rejected for the same reason ADR-0024 gave: the ban's *reason* was that prose questions force typing and read as a dodge. A multi-select card costs taps, not typing. And the ban's cost here is concrete — every bent dish keeps its name.

**Ask reason-blind: "what could you use?"**, blending *have* with *would-buy*. Rejected: it makes the pantry write a lie the app tells itself forever. Items the user is merely willing to buy are already **Additions / Stretch**'s job.

**Cook the fallback now, offer the upgrade alongside** (companion, not gate). Rejected: it breaks the standing *one action per response* rule, spends a generation the user may discard immediately, and leaves the bent dish on screen — the very thing being fixed.

**Route un-ticked rows to the Shopping List.** Rejected during charting: ticks mean *have*, and the owner doubts the Shopping List is used.

**Record un-ticks as absence in the pantry.** Rejected: `InventoryItem` records what you *have*; absence is a different data model. With absence scoped to one exchange, there was never anything durable to write.

**Remember a "no" across the thread.** The intuitive favourite, rejected on two counts: a no is genuinely dish-scoped in time (one shopping trip later it is false), and the model sees only `CONTEXT_WINDOW = 15` messages, so a remembered no would work for a while and then silently start re-asking. Better consistently re-asking than intermittently amnesiac.

**A `multi: true` flag on `clarify` rather than a new fence.** Rejected: clarify picks a **parameter**, the checklist asks about a **possession**, and the two are governed by different rules. Sharing a fence would force one schema and one policy onto two different questions.

## Consequences

- `CHAT_SYSTEM_PROMPT` gains **Mode 5 — Checklist** (trigger, name test, deal, binary-name rule, honest naming, re-ask policy, hard guards) and matching Routing-rules rows. The mode count moves to **five**; Mode 2's *"no gate, no question"* gains its single named exception; the Behavior line *"Never ask 'do you have X?' in prose"* survives **verbatim** — a checklist is a block, not prose.
- A new Behavior line generalises the point: **never let a dish wear a name it hasn't earned**, checklist or not.
- `ChecklistBlockSchema`, `ChecklistReplySchema`, and the two fences join `parseBlocks`; `ChecklistBlock` joins the chat renderer, with progressive reveal ([ADR-0009](0009-progressive-reveal-via-partial-parse.md)) and an explicit streaming branch so a new fence kind can never fall through to `SuggestionsBlock` (the [#463](https://github.com/alantay/ask-ah-mah/issues/463) defect).
- `CONTEXT.md` gains **Checklist block** and **Name test** glossary entries.
- **Out of scope**: undoing a mistaken tick (the existing pantry delete stands for now), extending the checklist to **Cook With What You Have** (Mode 3), RAG grounding for named-dish authenticity ([#459](https://github.com/alantay/ask-ah-mah/issues/459) — a different, more expensive lever on the same worry), and ask-frequency telemetry.

Charted and built via the wayfinder map [Checklist block — ask before the dish bends](https://github.com/alantay/ask-ah-mah/issues/476).
