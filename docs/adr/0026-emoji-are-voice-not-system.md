# ADR-0026 — Emoji are hand-placed voice, never a visual system

**Status:** Accepted

## Context

The app is Ah Mah — a warm Singaporean grandmother — yet it carries almost no emoji: 🍳 closing the chat greeting (`src/features/Chat/constants.ts`) and 🥬 on the pantry suggestion chip (`ChatEmptyState.tsx`). Everything else that reads as a glyph is a typographic mark doing UI work (`✓ Picked`, `✕`, `↗`, `→`). A future reader will reasonably expect a persona this warm to be emoji-rich, and wonder whether the near-absence is neglect.

It is not. Adding emoji as a *system* was considered — one glyph per row on the Pantry, the Shopping List, and the conversation sidebar — with scannability as the goal, and rejected on three grounds:

**The list surfaces already solve scanning structurally.** The Pantry groups into Category cards; the Shopping List groups by Aisle headers ([ADR-0016](0016-shopping-list-groups-by-aisle.md)). A 🥕 on a row already sitting under a **Produce** header is redundant decoration.

**On the conversation sidebar — the one surface with a genuine scanning problem — the vocabulary is degenerate.** This is a Singaporean home-cooking app: a model picking a food emoji per conversation returns 🍜 / 🍚 / 🍲 for the large majority of chats. A shape repeated down the rail actively suppresses the differences the eye should catch, while stealing width from an already-truncated title. The sidebar's real defect was diagnosed elsewhere and fixed at its source: the title generator was asked for a *warm* title in a 3–6 word budget, so warmth crowded out the dish name. See the `Conversation Title` entry in `CONTEXT.md`.

**Emoji ship their own colours into a deliberately narrow palette.** Butter / terracotta / jade is tuned tightly enough that nav icons are stroke-only with no fill swap ([ADR-0001](0001-butter-is-where-you-are.md), `CONTEXT.md` § Nav Selection). Emoji are unownable — multi-colour, OS-dependent, and outside the token system entirely.

Two smaller costs: an emoji baked into a stored conversation title is read aloud by screen readers and appears as editable text in the rename input.

## Decision

**Emoji are hand-placed punctuation in Ah Mah's voice, never a system.** One glyph, chosen by a person, at a warm moment — the greeting, a welcome chip. Never model-generated, never per-row, never carrying meaning that a label or an icon should carry.

Concretely:

- Prose written in Ah Mah's voice may carry an occasional hand-placed emoji. The two that exist stay.
- No emoji in model-generated output. The conversation-title prompt states `No emoji` explicitly, because a title that now names a dish invites the model to reach for a glyph unprompted. Where that output is **persisted**, the prompt is backed by enforcement — generated titles are stripped of emoji before storage, since a prompt is not a guarantee and the asymmetry below makes the database the expensive place to be wrong.
- No emoji as a row-level or category-level visual affordance. Where scanning is weak, fix it with structure (grouping headers), with the label itself, or with content the user wrote — not with a glyph.
- Iconography remains lucide, styled with project tokens.

This is a sibling of [ADR-0023](0023-tips-speak-in-a-plain-register-not-ah-mahs-voice.md), which found the same thing on a different surface: **warmth belongs in prose, where it has room; labels do a job.**

## Consequences

- Scannability is bought with structure and wording rather than glyphs, which keeps every surface inside the token system.
- The conversation sidebar gives up a pre-attentive cue. If dish-naming titles prove insufficient, the next move is a second line carrying the user's own first message — their phrasing is the one thing in the row a model did not homogenise — not a glyph.
- Reversing is cheap for prose and expensive for data: adding emoji to a surface is a render change, but adding them to model-generated *stored* titles writes them into the database, where removal means a migration. The asymmetry is the reason this is written down.
