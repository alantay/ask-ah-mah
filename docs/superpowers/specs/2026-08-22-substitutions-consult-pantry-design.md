# Substitution asks consult the pantry first

**Issue:** [#492](https://github.com/alantay/ask-ah-mah/issues/492)
**Date:** 2026-08-22

## Problem

Reconcile mode sends `I'm missing bok choy, shaoxing wine for the Ginger Chicken.
Can you suggest substitutions or alternatives?` and the model answers with generic
substitutions. Verified end-to-end against the real model (Playwright, full
`/api/chat` stream captured, 86,693 bytes): **zero tool calls**. `getInventory`
never fires, so Ah Mah cannot say "you already have dry sherry — use that."

The pantry held `dry sherry` and `napa cabbage` — exact covers for both missing
items. The reply did name them, but buried mid-list among five other options, as
the textbook swaps anyone would recite, with no sign it knew they were on the shelf.

## Root cause

The issue frames this as a *missing* routing row. It is worse than that: two
existing lines in `CHAT_SYSTEM_PROMPT` **instruct** the model to skip the pantry.

1. `constants.ts:322` — the routing table's last row:

   > General cooking *knowledge* question with no single thing to make — a
   > comparison ("baking soda vs baking powder"), **a substitution ("can I use
   > yogurt instead of buttermilk?")**, a definition, or how-something-works →
   > Plain text, no block

2. The `getInventory` tool description:

   > call this before suggesting recipes or answering "what can I cook" … **Do
   > NOT call it for general cooking knowledge questions**

A substitution ask is explicitly classified as a knowledge question, and knowledge
questions are explicitly barred from `getInventory`. The model is obeying the
prompt, not drifting from it. `constants.ts:70` repeats the same classification in
Mode 2's prose.

This matters because it inverts the app's premise. "You've already got dry sherry
— 1:1, done" is Cook With What You Have ([ADR-0006](../../adr/0006-cook-with-what-you-have-is-a-conversation.md));
a five-option substitution essay is its opposite.

## Decisions

### Scope: any named-ingredient substitute ask, not just reconcile

"Prefer what's on the shelf" applies whenever the user asks what to use instead of
a **named ingredient** — whether the message came from the reconcile button or was
typed by hand. Both get the same pantry-first answer.

Rejected: scoping the rule to the reconcile-generated message shape. It would make
the prompt pattern-match a client-authored string, and it would produce two
different answers to the same question depending on how it was asked — the button
gets pantry awareness, typing it gets an essay.

Also rejected: extending the rule to comparisons and definitions ("baking soda vs
baking powder"). Those pay a tool call for nothing; there is no ingredient the user
is trying to replace.

The line is **replacement intent for a named thing**, not the word "substitute".

### Answer shape: prose, pantry-first

The answer stays plain text — no block. What changes is its structure:

- **Lead** with the item(s) the pantry already covers, named, with the ratio.
- Anything the pantry cannot cover gets **one short line**, not a ranked list of
  five alternatives.

The recipe card on screen is not re-emitted. Applying a swap to the card is the
existing tweak path's job (`/api/recipe/[id]/tweak`); re-emitting a `recipe` block
here would contradict Mode 2's trigger (no dish was named) and duplicate that path.

## The change

Five edits to `CHAT_SYSTEM_PROMPT` in `src/app/api/chat/constants.ts`:

1. **New routing row**, above the knowledge row: user asks what to use instead of a
   named ingredient → `getInventory` → plain text, lead with what the pantry covers.
2. **Narrow the knowledge row** — remove the substitution clause and its
   `yogurt/buttermilk` example, which moves up to the new row. Comparisons,
   definitions, and how-it-works stay pantry-free.
3. **`getInventory` description** — add substitute asks to its triggers and carve
   them out of the "do NOT call for knowledge questions" clause, so the two lines
   stop contradicting each other.
4. **Behavior bullet** — the substance of pantry-first answering: lead with what is
   on the shelf and the ratio; one short line for what isn't; no generic essays.

5. **`constants.ts:70`** (Mode 2's "a *knowledge* question … stays plain prose")
   keeps its substitution mention — the answer *is* still prose — but gains a
   pointer that prose does not mean tool-free.

## What this does not touch

- **Mode 5 (checklist)** is dish-anchored: its trigger needs a specific dish in
  play whose load-bearing ingredients are missing. A substitution ask names no dish
  to cook, so the new row cannot collide with it.
- **[ADR-0024](../../adr/0024-clarify-reopens-never-ask.md)'s *can-act → act* guard**
  bars stalling with a question. This change adds a tool call before prose, not a
  question, so the guard is unaffected.
- **The reconcile await ordering** ([ADR-0027](../../adr/0027-the-pantry-is-corrected-at-the-point-of-use.md))
  stays exactly as it is. The issue is right that today it guards a race that
  cannot happen, because the call is never made — the guard is correct for the
  wrong reason. After this fix the call *does* happen and the reason becomes true.

## Verification

String assertions in `constants.test.ts` (matching that file's existing cheap-guard
style) prove the prompt text survived future edits. They do not prove behaviour.
Behaviour is verified end-to-end against the live model, reproducing the issue's
setup:

| Scenario | Assertion |
|---|---|
| Pantry `chicken thigh, dry sherry, napa cabbage`; reconcile ask for `bok choy, shaoxing wine` | `getInventory` fires; reply **leads** with dry sherry and napa cabbage |
| Typed "what can I use instead of shaoxing wine?" | Same pantry-first answer as the button — parity |
| "What's the difference between baking soda and baking powder?" | **No** tool call — the new row did not leak into knowledge questions |

The third row is the regression guard that earns the change: a prompt edit touches
every chat turn.

## Also shipped

- **ADR-0028** — records that substitutions are answered from the shelf first, and
  why the scope is every named-ingredient ask rather than reconcile only.
- **`docs/progress.md`** — updated for the behaviour change.

## Out of scope

- [#490](https://github.com/alantay/ask-ah-mah/issues/490) — free staples still count as Additions
- [#491](https://github.com/alantay/ask-ah-mah/issues/491) — `ingredientMatches` is over-permissive
