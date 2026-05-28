# ADR-0004 — Recipe Tweak uses a dedicated API route

**Status:** Accepted

## Context

The Recipe Tweak feature lets users refine a saved recipe via a short AI instruction (e.g. "add green chilli"). We needed to decide where the AI call should go: reuse the existing `/api/chat` route, or create a new dedicated route.

## Decision

Recipe Tweak uses `POST /api/recipe/[id]/tweak` — a separate, lean `streamText` call — rather than routing through `/api/chat`.

## Reasons

`/api/chat` carries infrastructure that a tweak does not need:
- Conversation and message persistence
- Inventory tool bindings (`addInventoryItem`, `getInventory`, `removeInventoryItem`)
- Context window loading (`getMessages`, `CONTEXT_WINDOW = 15`)
- `validateUIMessages` and multi-step logic (`stepCountIs(5)`)

A Recipe Tweak is a single-turn call: "here is the recipe, here is the instruction, return an updated recipe block." Routing through chat would mean working around all of the above.

## Trade-offs

Using a dedicated route means a second AI entry point to maintain. The upside is that the tweak route stays small and purpose-built, and the chat route stays uncluttered.
