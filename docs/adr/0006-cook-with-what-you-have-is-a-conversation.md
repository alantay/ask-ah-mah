# ADR-0006 — Cook With What You Have lives inside the Conversation model

**Status:** Accepted

## Context

"Cook With What You Have" lets the user select items in their pantry and request recipe suggestions. The output is at least one (usually two) generated recipes — a **Close Recipe** and a **Stretch Recipe**.

Two architectural questions had to be answered:

1. **Does the submission create a Conversation, or is it a one-shot endpoint that returns recipes inline?**
2. **If it's a Conversation, does it reuse `/api/chat`, or get a dedicated route like Recipe Tweak did in [ADR-0004](0004-recipe-tweak-uses-dedicated-route.md)?**

The Tweak Bench precedent (ADR-0004 / ADR-0005) goes the other way — Recipe Tweak is its own route. A future reader will reasonably ask: why does this feature *not* follow the same pattern?

## Decisions

### Cook With What You Have spawns a new Conversation

A submission creates a `Conversation` row exactly the same way a first chat message does (per [ADR-0002](0002-conversation-requires-at-least-one-message.md)). The **Featured Selection** is formatted into a synthetic user message — e.g. *"Suggest recipes using: tomato, tofu — featuring air fryer"* — that is persisted and visible in the thread. The assistant then streams the Close + Stretch recipes as a normal assistant turn.

After submission, the Pantry selection clears. The Conversation is the only durable record of what was asked.

### The pipeline is `/api/chat`, not a new route

The submission goes through the existing chat pipeline. `CHAT_SYSTEM_PROMPT` gains a Mode 3 — "Cook With What You Have" — that branches on the synthetic message pattern and produces exactly two recipes (or one, when Close is infeasible) with the Close/Stretch contract.

The "More ideas like these" button sends a second synthetic message (*"More ideas — different from these"*) in the same Conversation. The model has the prior recipes in context (`CONTEXT_WINDOW = 15`) and avoids repeats without needing the original selection payload re-attached.

## Why not alternatives

**One-shot endpoint returning recipes inline on the Pantry page.** This was the second-cheapest option to build but introduces a third recipe-creation path alongside Chat and `/api/recipe/extract`. Worse, it has no natural home for the "More ideas" follow-up — either we'd build a parallel chat surface inside Pantry or we'd lose the multi-turn affordance entirely. Using a Conversation gets multi-turn iteration, auto-titling, history, and recipe persistence for free.

**Dedicated route, following ADR-0004.** Recipe Tweak's dedicated route exists because a tweak is single-turn, ephemeral, and operates on an *existing* recipe — none of the chat pipeline's machinery (conversation persistence, inventory tools, multi-step logic) applies. Cook With What You Have is the opposite: every piece of that machinery is exactly what we need. `getInventory` is part of the prompt's input. `proposeRecipe` is the output convention. Conversation persistence is the storage model. A dedicated route would replicate `/api/chat/route.ts` almost line-for-line.

**Hidden synthetic message (assistant turn appears unprompted).** Considered for cleaner aesthetics. Rejected because scrolling back in the thread would be incomprehensible — a recipe response with no visible question. The synthetic message is the *receipt* of what was asked and keeps the thread legible forever.
