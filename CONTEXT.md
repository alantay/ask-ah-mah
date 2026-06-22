# Context — Ask Ah Mah

Glossary of canonical terms for this codebase.

---

## Conversation

A thread that contains at least one **Message**. A `Conversation` row exists in the database only when a message has been sent. An "empty conversation" is not a Conversation — it is the **Staging State** of the chat.

**Why this matters:** clicking "New Chat" does not create a DB row. The row is created server-side when the first message is sent.

Related: [ADR-0002](docs/adr/0002-conversation-requires-at-least-one-message.md)

---

## Section

One of the three primary destinations — **Chat**, **Pantry**, **Cookbook**. Selected from the `AppSidebar` on desktop and from the nav drawer on mobile. The Radix `Tabs` container that switches the content panels underneath is an implementation detail, not a user-facing surface — there is no visible tab strip.

---

## Staging State

The UI state where the user is on the Chat section but has not yet sent a message. Indicated by `activeConversationId === null`. The greeting and suggestions are shown; no `Conversation` row exists yet.

When the user sends the first message, the staging path in `useChatSession` creates the `Conversation` row via `POST /api/conversation`, then transitions to **Pending State**.

---

## Pending State

The transient state between the first message being sent and the assistant stream completing. The conversation row exists in the DB, but is tracked via `pendingConversationId` in `ConversationContext` rather than `activeConversationId`. The sidebar entry appears optimistically during this window.

When the stream finishes (`onFinish`), `commitConversation(id)` flips `pendingConversationId → activeConversationId`.

---

## Nav Selection

"You are in this **Section**." Shown on the primary navigation items in `AppSidebar` and the mobile nav drawer (Chat / Pantry / Cookbook). Visual treatment: `bg-card` background, `text-foreground` label, terracotta (`text-primary`) icon outline (stroke color only — no fill swap).

The Chat nav item is highlighted only in **Staging State** (`activeConversationId === null && pendingConversationId === null`). Once a conversation becomes pending or committed, the Chat nav unhighlights and **Thread Selection** takes over.

Related: [ADR-0003](docs/adr/0003-nav-and-thread-selection-are-distinct.md)

---

## Thread Selection

"You are reading this conversation." Shown on conversation rows in the `Conversations` sidebar list. Visual treatment: **butter** (`oklch(0.86 0.10 88)`) background.

Applies when `conv.id === activeConversationId || conv.id === pendingConversationId`.

Related: [ADR-0001](docs/adr/0001-butter-is-where-you-are.md), [ADR-0003](docs/adr/0003-nav-and-thread-selection-are-distinct.md)

---

## Butter

The visual token reserved for "you, here, now" — the thing the user is currently reading or acting on. Applied to the active conversation row and the user's own message bubbles. Never applied to navigation items (those use `bg-card`).

See [ADR-0001](docs/adr/0001-butter-is-where-you-are.md) for the full rationale.

---

## Tweak Bench

The interactive right-side panel that hosts a multi-turn recipe refinement session. A user opens the Tweak Bench from a recipe page and sends one or more instructions; each instruction is a **Recipe Tweak**. State is ephemeral — the turn log and working draft live only in memory while the bench is open. Saving commits the working draft to the cookbook; Discarding or closing collapses the bench and the draft evaporates.

The bench displays a "What changed" checklist (decorative, read-only) alongside an inline diff overlay on the recipe (NEW chips, "was X" strikethrough, highlighted rows). Both views are driven by the structured change list returned by the model — they cannot disagree.

Related: [ADR-0005](docs/adr/0005-tweak-bench-multi-turn.md)

---

## Recipe Tweak

A single turn within a **Tweak Bench** session. The user types one refinement instruction (e.g. "use chicken instead of tofu") and the AI returns a **Tweak Patch** — the changed fields plus a structured change list — buffered in a single response (not streamed). The client applies the patch to the working draft. A Recipe Tweak cannot generate a wholly unrelated dish — the model refuses in plain text and leaves the working draft unchanged.

The AI call goes through a dedicated route (`POST /api/recipe/[id]/tweak`), separate from the chat pipeline.

Related: [ADR-0005](docs/adr/0005-tweak-bench-multi-turn.md), [ADR-0010](docs/adr/0010-recipe-tweak-returns-a-patch.md)

---

## Tweak Patch

The response a **Recipe Tweak** returns: only the recipe fields that changed (arrays — `ingredients`, `steps`, `prep`, `tags` — replaced **wholesale** if any element changed; scalar fields sent only if changed), plus the structured change list. Presence is the signal: a key present means "replace this field on the working draft," a key absent means "keep it." Clearing an array is sent as `[]` (present-but-empty), distinct from omitting the key.

Supersedes the old contract, where the model echoed the **entire** recipe back each turn — which made generation time scale with recipe size (~15s for a one-word tweak) regardless of how little changed. Replacing whole arrays (rather than patching individual rows) keeps the model the single author of each list, so the recipe and the diff cannot disagree.

Related: [ADR-0010](docs/adr/0010-recipe-tweak-returns-a-patch.md)

---

## Cook With What You Have

The Pantry-rooted interaction where a user enters selection mode, marks a **Featured Selection** of pantry items (and optionally preferred kitchenware), and submits to spawn a new **Conversation**. The assistant streams a **Close Recipe** and a **Stretch Recipe** in that conversation. The selection is a transient front-door payload — it lives only long enough to compose the first message, then clears.

Entry points: a CTA at the top of the Pantry, and a suggestion chip in the Chat **Staging State** that navigates to Pantry and enters selection mode.

Related: [ADR-0006](docs/adr/0006-cook-with-what-you-have-is-a-conversation.md), [ADR-0007](docs/adr/0007-pantry-selection-is-feature-emphasis.md)

---

## Featured Selection

The set of pantry items the user has marked to *star* in a Cook With What You Have submission. Items can be ingredients or kitchenware. The selection is **emphasis, not constraint** — non-selected pantry items remain fair game for the model to use silently; selected items must appear or be addressed.

Related: [ADR-0007](docs/adr/0007-pantry-selection-is-feature-emphasis.md)

---

## Close Recipe

The first recipe slot in a Cook With What You Have response. Uses 0–2 **Additions** beyond the user's pantry; the model is told to prefer fewer. Omitted entirely (with a one-line explanation) when the Featured Selection is too sparse to support any recipe at 0–2 additions.

UI label: **"Right now."** The internal term is `Close`.

---

## Stretch Recipe

The second recipe slot in a Cook With What You Have response. Uses 3–4 Additions beyond pantry, with a hard cap of 4. Always present in the response, even when the Close Recipe is omitted.

UI label: **"Worth a small trip."** The internal term is `Stretch`.

---

## Addition

An ingredient a generated recipe calls for that is not present in the user's pantry. The Addition count distinguishes Close from Stretch. Salt, pepper, water, and cooking oil are **free staples** — never counted as Additions even if absent from the pantry. Everything else in the pantry is also free; only items genuinely missing are Additions.

---

## Recipe Notes

Whole-dish asides attached to a recipe (`notes` on the recipe block): make-ahead, storage, serving suggestions, and pantry-*independent* technique fallbacks ("no cumin? use garam masala — it's pre-toasted, add it later"). Optional, 0–4 entries, omitted for simple dishes. Rendered as a "Notes" section at the foot of the recipe.

**Flagged ambiguity — `notes` vs `note`:** distinct concepts at different altitudes. The ingredient-level **`note`** (singular) tweaks *one ingredient* ("boneless, bite-size"; "not in pantry — use dry sherry"). **Recipe Notes** (`notes`, plural) speak to the *whole dish*. Recipe Notes deliberately do **not** carry pantry substitutions — those already live in the ingredient `note` and the "Ask Ah Mah for substitutions" affordance, and duplicating them here is out of lane.

---

## Copy recipe

The action that copies the **whole recipe** as clean plain text (CAPS section headers, `•`/numbered lists — no markdown, so it survives pasting into WhatsApp/Notes), at the **currently displayed servings**. Shared formatter, surfaced on both the chat recipe card and the recipe page. Excludes user-specific pantry state.

**Flagged ambiguity — vs Copy shopping list:** two distinct copy intents, never collapse into a bare "Copy." **Copy shopping list** copies *only the missing ingredients* for a shop trip. **Copy recipe** copies *the entire dish* to cook from or share. Both can coexist on the same card; the labels name the intent.
