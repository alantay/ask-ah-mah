# Butter is "where you are"

Status: accepted

## Context

Butter — the warm fill `oklch(0.86 0.10 88)` with border `oklch(0.78 0.10 88)` and a matching 1px bottom shadow — is now used on two surfaces:

- The user's message bubble in chat (`src/components/ai-elements/message.tsx`).
- The active conversation row in the rail (`src/features/Conversations/components/ConversationItem.tsx`), introduced in #173.

Two surfaces, same treatment, same meaning: this is where *you* are. Without an explicit decision, future contributors might reuse butter for unrelated emphasis (warnings, highlights, callouts) and erode the signal.

## Decision

Butter is a load-bearing semantic token. Anywhere it appears, it must mean the surface is **"you, here, now"** — your current turn, your current selection, your current location. Decorative emphasis or unrelated states must pick a different token.

When a new surface needs a "selected / active / your-turn" affordance, reuse butter (fill + border + 1px shadow) rather than inventing a new color.

## Alternatives considered

- **Tone down the rail row** — butter fill but drop the border and shadow. Rejected: the half-treatment reads as a different concept, weakening the cross-surface link instead of reinforcing it.
- **Use a different color for the active row** — terracotta tint, warm neutral, or a new "selection" token. Rejected: introducing a second "this is you" color splits the semantic and makes future surfaces ambiguous.

## Consequences

- Surfaces that need to emphasise non-presence concepts (warnings, recipe highlights, pantry alerts) must pick a different token, not butter.
- Adding a new "selected/active" surface is now a copy-paste of the butter treatment, not a design exercise.
- If we ever need to retire butter, every surface using it has to move together — the semantic is what's load-bearing, not the specific oklch values.
