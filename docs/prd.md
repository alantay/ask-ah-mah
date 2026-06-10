---
description: "Product vision for Ask Ah Mah — a Next.js web app that helps cooking beginners turn the ingredients they already have into recipes through natural-language conversation"
globs:
  - "**/*.{ts,tsx,js,jsx}"
  - "**/*.json"
  - "**/*.md"
alwaysApply: true
---

# Ask Ah Mah — Product Vision

> **Scope of this doc:** the durable *why* and *who*. It does **not** track
> what's built, the current architecture, or the roadmap — those drift too fast
> to live here. For that, see:
>
> - **What's shipped / what's next** → [`docs/progress.md`](./progress.md)
> - **Why things are built the way they are** → [`docs/adr/`](./adr/)
> - **Canonical domain vocabulary** → [`CONTEXT.md`](../CONTEXT.md)
> - **How to run it / tech stack** → [`README.md`](../README.md)

## 1. Product Vision

"Ask Ah Mah" helps cooking beginners discover what to cook through natural
language conversation. It makes cooking feel accessible and unintimidating by
remembering what's in their kitchen and suggesting recipes built around the
ingredients they already have.

The persistent kitchen — inventory plus what's been cooked and saved — is the
core moat. The app's job is to turn "I have all these ingredients but no idea
what to make" into a recipe the user feels confident cooking.

## 2. Problem Statement

Beginner cooks struggle to:

- Know what they can make with the ingredients they have on hand
- Keep track of what's in their kitchen
- Find recipes that match both their ingredients and their (limited) skill
- Get cooking guidance in an intuitive, conversational way — not a wall of UI

The emotional core: ingredients go bad, money gets wasted, and cooking feels
overwhelming. The product should make the user feel encouraged, not judged.

## 3. Target User

- **Who:** cooking beginners, any age.
- **Needs:** simple recipe discovery, low-friction inventory tracking,
  confidence-building guidance.
- **Behaviour:** prefers natural-language interaction over complex forms and
  filters.
- **Goal:** learn to cook with what they already have.

## 4. Success Criteria

Functional:

- Users can add ingredients and kitchenware via natural language, and the
  inventory persists between sessions.
- The app suggests recipes grounded in the user's actual inventory, and is
  honest about what's missing.
- Users can get detailed, beginner-friendly cooking guidance for a suggestion.

Experience (future, once we measure):

- Engagement — average session time, return visits.
- Adoption — inventory use, recipe requests per session.
- Satisfaction — recipe completion, positive feedback.

## 5. Durable Constraints & Assumptions

- **Conversational-first.** Inventory management and recipe discovery are
  primarily driven through chat; traditional UI is the backstop, not the front
  door.
- **Encouraging tone.** Every interaction should build confidence — mistakes
  are part of learning to cook.
- **Web-first.** Users primarily access via desktop and mobile web browsers.
- **No real-time freshness tracking.** The app cannot reliably know what's gone
  bad; it does not guess (see [ADR-0008](./adr/0008-no-shelf-life-ui.md)).
