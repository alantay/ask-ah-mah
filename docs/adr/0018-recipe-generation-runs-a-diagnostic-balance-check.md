# ADR-0018 — Recipe generation runs a diagnostic balance check, not a mandatory one

**Status:** Accepted

## Context

Generated recipes were coming out **flat** — technically correct and cookable, but under-seasoned, one-note, missing brightness. The dish worked; it just wasn't *yummy*.

The chat system prompt already teaches Ah Mah to *explain* the science of cooking — Maillard, fond, deglazing, doneness cues in the Kenji López-Alt spirit (`src/app/api/chat/constants.ts`). But nothing made her **check that the dish she just wrote is actually balanced** before serving it. Explaining technique and composing a balanced plate are different jobs; only the first was covered.

The fix draws on Samin Nosrat's *Salt / Fat / Acid / Heat* — a lens for diagnosing *why a dish tastes flat*. The open question was **how prescriptive** to make it, and **where** it should apply.

Options considered:

1. **Mandatory checklist** — every recipe MUST carry a salt element, a fat element, an acid element, and a suitable heat method. Clean, enforceable, testable.
2. **Diagnostic lens** — before emitting, run the dish through the four axes; add an element only where the dish would be flat without it, and leave deliberately-clean dishes alone.
3. **Do nothing** — rely on the existing science-voice guidance to carry balance implicitly (the status quo that produced flat dishes).

## Decision

### The balance check is a diagnostic, not a mandate

Ah Mah runs Salt/Fat/Acid/Heat as a self-check before emitting a full recipe, but is explicitly told it is *diagnostic, not a checklist*: add or adjust an axis only when the dish would be flat without it, and leave a dish that is **deliberately clean** on an axis alone.

A mandatory rule breaks on this app's own cuisine. Plain **congee** needs no acid; **Teochew steamed fish** wants little fat — its whole point is clean, sweet fish. A "every savoury dish must contain acid" rule would force lime into congee and make generation *worse* while feeling more rigorous. Samin wrote SFAH as a lens for diagnosing flatness, not a bill of materials every plate must carry — so we encode it as she intended.

### The four axes are read for this cuisine, not literally

"Salt" means savoury depth (soy, fish sauce, oyster sauce, miso, shrimp paste), not just NaCl. "Acid" means brightness (black/rice vinegar, calamansi, lime, tamarind, tomato). "Fat" is the richness/carrier (oil, coconut milk, sesame oil, lard). "Heat" is the right method and level (wok hei vs a gentle simmer vs a steam). A literal reading would mislead toward table salt and lemon.

### Balance surfaces only through the existing `steps[].tip`

When a balancing move is the non-obvious save, the *why* rides the step tip that already exists for exactly this purpose ("a squeeze of calamansi at the end lifts everything — don't skip it"). No new recipe field, no "balance section." A dedicated balance voice would be a fourth advice channel competing with `steps[].tip`, the recipe-level `notes`, and the ingredient-level `note` — the exact kind of co-located-voice clash that [ADR-0014](0014-shopping-list-is-standing-and-quantityless.md) and the `notes`-vs-`note` distinction in `CONTEXT.md` were written to prevent.

### Scope is full-recipe generation only — Mode 2 and Mode 3

The check is added once to `CHAT_SYSTEM_PROMPT`, governing the named-dish recipe (Mode 2) and Cook With What You Have (Mode 3, which already inherits the Mode 2 recipe rules). It is **deliberately excluded** from two other paths:

- **Mode 1 (suggestions)** emits only blurbs and `keyIngredients` — no steps, no method, so there is no composition surface to balance.
- **The Tweak route** (`src/app/api/recipe/[id]/tweak/route.ts`) has a hard *minimal-change* contract: return only what the user's instruction changed. A balance check there would add ingredients the user never asked for and pollute the "What changed" list — a contract violation, not an improvement.

## Why not the alternatives

**Mandatory checklist (option 1).** Testable and tidy, but wrong for the food: it forces elements into deliberately-clean dishes and degrades exactly the recipes it means to protect. The failure we are fixing is the model *never considering* balance, not the model *lacking a rule to obey* — a diagnostic closes that gap without the collateral damage.

**Do nothing (option 3).** The science-voice guidance teaches Ah Mah to *narrate* technique, but a well-narrated dish can still be flat. That is precisely the observed status quo, so it is not a fix.

## Consequences

- A `PROMPT_FRAGMENTS.balanceCheck` fragment in `src/lib/prompts/fragments.ts`, interpolated into `CHAT_SYSTEM_PROMPT` (mirrors the `comprehensibleVoice` precedent). A unit test asserts its presence, matching the existing fragment tests.
- No schema change, no new recipe field, no `CONTEXT.md` glossary term — the balance check has no user-facing surface, so it stays out of the domain glossary.
- Kenji's technique/doneness guidance is untouched; this ADR adds only Samin's balance lens on top of it.
- A future contributor who wants to "tighten" this by making balance mandatory, or by adding it to the Tweak route, should re-read this ADR first: both were considered and rejected for the reasons above.
