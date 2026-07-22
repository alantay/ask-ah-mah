# ADR-0025 — The balance check broadens to five-taste harmony

**Status:** Accepted
**Extends:** [ADR-0018](0018-recipe-generation-runs-a-diagnostic-balance-check.md)

## Context

[ADR-0018](0018-recipe-generation-runs-a-diagnostic-balance-check.md) added a diagnostic `balanceCheck` pass that runs a generated dish through Samin Nosrat's **Salt / Fat / Acid / Heat** lens before emitting a full recipe. It fixed *flat* — but SFAH's four axes cover only **three of the five basic tastes** (Salt≈salty, Acid≈sour, umami arriving obliquely through savoury depth). **Sweet** and **bitter** are uncovered, and a research pass (issue #455) surfaced a second cluster of *composition* moves — texture contrast, staged seasoning, aromatic bloom, fresh finish, umami stacking — that the model rarely volunteers unprompted.

This is strongly on-cuisine: SEA/SG cooking balances on sweet-salt-sour-heat (sambal, kecap manis, the dark sweet soy in char kway teow, Thai four-way balance). A dish generated without a sweet-rounding instinct comes out sharp or one-note in exactly the ways this cuisine is built to avoid.

The terminal spec is issue #460 (wayfinder map #454); this ADR records the build.

## Decision

### Broaden the existing pass — do not add a second one

The new dimensions extend the *same* "taste it in your head" pass rather than adding a parallel fragment beside it. Two back-to-back "before you emit, run this check" fragments is the co-located-voice clash ADR-0018 and the `notes`-vs-`note` distinction were written to prevent, and it doubles the mental action the model performs. The taste additions are *taste axes* — siblings of Salt and Acid — so they belong **inside** the balance lens. The key name `balanceCheck` stays (the ADR-0018 presence test already references it); only its content grows.

### SFAH → five-taste harmony

- **Sweet is added as a fifth taste axis** — the real gap. Read widely for this cuisine (palm sugar, kecap manis, mirin, a pinch of sugar to round acid or heat). Same diagnostic stance as every other axis: a rounding move where the dish is sharp or one-note, **never sugar for its own sake**.
- **Bitter is a minor clause, not an axis.** In home cooking bitter is almost always a *tame-it* move (rinse bitter melon, don't burn the garlic), rarely an *add-it* one — one short clause, not its own bullet.
- **Fat and Heat stay unchanged** — they are mouthfeel/technique, not tastes, but they stay in the pass as before.

### An "also consider" composition tail

After the taste lens, a compact bulleted tail of composition moves, all diagnostic ("where the dish would be flat/incomplete without it"): **textural counterpoint** (unless deliberately smooth), **staged seasoning** (phrased proportionally, never absolute amounts — respects the no-quantities-in-step-bodies rule), **aromatic bloom** (spices/aromatics in fat before liquid), **fresh finish** off-heat, **umami stacking** from more than one source. **Temperature contrast** rides along as a minor clause with bitter.

### What stays out

- **Maillard / browning / doneness / general technique** — already carried by the Kenji science-voice and the earned-step-depth rules (ADR-0011). The lens must **not** restate them; that is redundant tokens.
- **Visual / colour / plating** — weakly addressable in a text recipe, partly served by existing finish guidance.
- **Named-dish authenticity** — the one dimension #455 found a prompt instruction can't reliably fix. It stays out of v1, prototype-gated on the RAG spike in #459; if greenlit it gets its own ADR mirroring 0018.

### Everything else carries ADR-0018 exactly

Diagnostic-not-a-checklist; leave deliberately-clean dishes alone (the permission now extends to the new dimensions — a silken dish stays silken); read every axis for this cuisine, not literally; surface only through `steps[].tip` (no new field, no balance section); **Mode 2 and Mode 3 only** (excluded from Mode 1 suggestions and the minimal-change Tweak route). The fragment is interpolated at the same single point — after the Mode 2 rules in `CHAT_SYSTEM_PROMPT`.

## Why not the alternatives

**A second fragment beside the balance check.** Rejected: the co-located-voice clash above, plus doubled mental action, for dimensions that are siblings of the existing axes. One broadened pass is strictly cheaper and cleaner.

**Sweet as a minor clause like bitter.** Rejected: sweet is a genuine *add-it* balancing move central to this cuisine, not a tame-it edge case. It earns a full axis; bitter does not.

**Everything from #455, including plating and named-dish authenticity.** Rejected on cost/efficacy: plating is weakly model-addressable in text, and authenticity is the dimension a prompt can't fix — it needs grounding, which is a gated follow-up, not this fragment.

## Consequences

- `BALANCE_CHECK` in `src/lib/prompts/fragments.ts` grows to five taste axes + the composition tail; the exported key `balanceCheck` and its single interpolation point are unchanged.
- **A permanent per-request prompt-cost commitment.** The tail is kept a compact bulleted list, not prose — near-zero added tokens is the whole value of this mechanism.
- No schema change, no new recipe field, no `CONTEXT.md` glossary term (unchanged from 0018 — the pass has no user-facing surface).
- The existing presence test (`constants.test.ts`) passes unchanged.
- A future contributor tempted to split this back into two fragments, add plating, or make any axis mandatory should re-read this ADR and 0018 first.
