# ADR-0011 — The recipe is a document, exempt from the chat brevity principle

**Status:** Accepted

## Context

`CHAT_SYSTEM_PROMPT` tells Ah Mah to keep responses *"tight and conversational —
short sentences, not lectures."* That principle is load-bearing for her character.
But it was being applied globally, including to the recipe she emits — so generated
recipes stayed thin: terse step bodies, time-based doneness ("cook 5–7 min") rather
than sensory cues, no make-ahead or storage guidance. Held against a Kenji/Serious-Eats
style write-up of the same dish, the gap was real: the richer version simply cooks better
and travels better.

The resolution is to separate two artifacts that were being governed by one rule:

- The **chat stream** (Ah Mah's prose, suggestions, asides) is a *conversation*. Brevity
  governs here — this is where "not lectures" applies.
- The **recipe** is a *document*. It has its own page, is saved to the Cookbook, gets
  cooked from and tweaked. A reference document is allowed to be thorough; nobody calls a
  recipe card a lecture.

## Decision

Scope the brevity principle to the **conversation**, and let the **recipe** carry depth.

- **Depth lives inside the recipe block**, gated on *"only where it changes the
  outcome"* — not length for its own sake. Concretely, in `steps[].body` / `steps[].tip`:
  the *why* when non-obvious (Maillard on the browning step, not "stir the sauce"),
  sensory doneness cues ("whites just set, yolks still jiggle"), and failure-mode
  cautions on the pivotal step or two. A soft cap keeps most step bodies to 1–2 sentences;
  only a pivotal step earns 3–4.
- **A new recipe-level `notes` field** (see [CONTEXT.md → Recipe Notes](../../CONTEXT.md))
  carries whole-dish asides: make-ahead, storage, serving, pantry-*independent* technique
  fallbacks. Explicitly **not** pantry substitutions — those already live in the
  ingredient `note` and the "Ask Ah Mah for substitutions" affordance.
- **The 140-char `description` and the granny voice are unchanged.** The depth is in the
  steps and notes, not in a longer soul-of-the-dish line and not in chattier prose.

## Why not alternatives

**Keep everything terse / make Ah Mah's chat chattier instead.** Rejected. Thin recipes
were the actual complaint, and lengthening the *conversation* would damage the character
the brevity rule protects. The split fixes the right artifact and leaves the voice intact.

## Consequences

- **Steps reference ingredients by name, never by absolute quantity.** Inline quantities
  in step bodies ("Add 250 g pork") were deliberately rejected: the `ServingsStepper`
  scales the ingredient list live (`scale = servings / baseServings`), but step text is
  static — a scaled recipe would show "500 g" in the list and "250 g" in the step,
  visibly contradictory, and would duplicate data the Tweak diff system must reconcile.
  Proportional prose ("half the salt now, the rest later") is allowed because it survives
  scaling; absolute numbers are not.
- **"Divided" seasoning is prose, not structure.** `amount` stays a single scalar feeding
  scaling and pantry-shortfall math; splitting an ingredient into fractional sub-uses was
  rejected as cost without proportional gain.
- A persisted `notes` field is added to the recipe schema and storage.
