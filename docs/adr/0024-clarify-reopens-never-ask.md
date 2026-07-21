# ADR-0024 — Clarify reopens "never ask", bounded to parameters

**Status:** Accepted

## Context

The chat system prompt (`CHAT_SYSTEM_PROMPT`) has long carried a hard **"never ask"** stance. It exists for good reason: the recurring early bug was Ah Mah stalling — "Want me to suggest some recipes?", "Should I go ahead?", "Do you have X?" — instead of just cooking. [The "cooking intent" routing fix](../progress.md) collapsed the contradictory rules into one line: intent present → always emit a `suggestions`/`recipe` block in the same turn, never ask permission. "A granny just starts cooking."

That ban was written when **the only way to ask was prose**. A prose question is a bad interaction here: it forces the user to type a reply, and in practice it read as the model dodging its job. So "never ask" was really "never ask *in prose, as a permission gate*" — but it was phrased as a blanket, because there was no better channel.

There now is one. The **Clarify block** ([#462](https://github.com/alantay/ask-ah-mah/issues/462), [#463](https://github.com/alantay/ask-ah-mah/issues/463)) is a first-class fenced block — `clarify { question, options: [{ id, label, hint? }] }` — that renders as a single-select card; tapping an option sends its `label` back as the user's reply. Asking is now **one tap, not a typed reply**. That changes the cost calculus enough to revisit the ban.

This ADR settles whether reopening "ask" is the old stalling bug wearing a new hat, or a genuinely bounded, useful capability — and where the boundary sits.

## Decision

### Ah Mah may ask one clarifying question — bounded to a *parameter*

A new **Mode 4 — Clarify** is added to `CHAT_SYSTEM_PROMPT`. When a single missing constraint would meaningfully reshape her answer and she'd otherwise be guessing at it, she may emit one `clarify` block with 2–4 tappable options, then wait.

The governing boundary is **dish vs. parameter**:

- **Clarify picks a *parameter*** — a constraint that reshapes *which* dishes fit: meal type, diet, spice level, cuisine mood, effort (quick vs. slow), use-it-up vs. cook-fresh.
- **Suggestions picks a *dish*** — if the missing thing is *which dish*, that is Mode 1's job. Offer dishes; don't ask a question.

This keeps clarify from swallowing suggestions. "What should I cook?" with a workable pantry is answered by *showing dishes*, not by interrogating the user — unless a parameter genuinely gates *which* dishes those would be.

### The reopening is deliberately generous, but hard-guarded

The first-cut ask-policy is intentionally generous — Ah Mah may reach for clarify fairly readily when a parameter would sharpen the answer. Calibrating *how often* she asks is hand-tuning done in-app afterward, not frozen here. Three hard guards bound it:

1. **Can-act → act.** If pantry + request are enough to suggest or cook at a sensible default, she does that. Clarify is never a substitute for acting — this is the original "never stall" rule, preserved intact.
2. **No permission questions.** "Want me to suggest?", "Should I?", "Maybe soup?" stay forbidden. A clarify block offers *substantive* choices, not a yes/no gate on doing her job.
3. **Freshness stays off-limits (ADR-0008).** She never asks whether an item is still good / fresh / not expired / safe to eat. Clarify narrows the *request*; it never audits the user's perishables.

## Why not the alternatives

**Keep the blanket ban.** Simplest, and never risks a stall. Rejected because the ban's *reason* — prose questions are a bad, typing-forcing dodge — no longer holds now that a tap-to-answer interface exists. A well-placed parameter question ("dinner or a snack?", "keeping it quick tonight?") genuinely improves the answer and costs the user one tap. Holding the ban would forgo real value to defend a boundary that the new interface has moved.

**Reopen asking with no dish/parameter line.** Let the model ask whenever it judges useful, full stop. Rejected because without the dish-vs-parameter rule, clarify drifts into re-implementing suggestions as a text question ("which of these do you want?") — reintroducing exactly the stall the ban was built to kill. The parameter boundary is what makes the reopening safe.

**A freshness carve-out for clarify.** Since we're reopening "ask", allow "is your tofu still good?" too. Firmly rejected — this is the ADR-0008 line, and it holds regardless of interface. App state can't know a specific item's freshness; asking about it invites the user to rely on an answer the app has no basis for. Clarify is about the *request*, never the pantry's state.

## Consequences

- `CHAT_SYSTEM_PROMPT` gains a **Mode 4 — Clarify** section (block schema, dish-vs-parameter rule, generous-but-guarded policy, the three hard guards) and matching **Routing rules** rows. The "four output modes" count and the Behavior-section permission ban are reconciled to name clarify as the one allowed question.
- The prior "never ask" rule is **narrowed, not deleted**: never ask *permission*, never ask *"do you have X?"* in prose, never ask about *freshness*. The one channel now open is a `clarify` block about a parameter.
- `CONTEXT.md` gains a **Clarify block** glossary entry cross-linking this ADR and ADR-0008.
- Ask-frequency calibration and a dedicated "none of these" escape hatch are **out of scope** here — the always-present composer is the escape hatch for now; both are follow-ups if the feature warrants them once felt in-app.
- Multi-select clarify remains a separate future effort (it breaks the tap-to-send model this ADR assumes).
