# Context — Ask Ah Mah

Glossary of canonical terms for this codebase.

---

## Conversation

A thread that contains at least one **Message**. A `Conversation` row exists in the database only when a message has been sent. An "empty conversation" is not a Conversation — it is the **Staging State** of the chat.

**Why this matters:** clicking "New Chat" does not create a DB row. The row is created server-side when the first message is sent.

Related: [ADR-0002](docs/adr/0002-conversation-requires-at-least-one-message.md)

---

## Staging State

The UI state where the user is on the Chat tab but has not yet sent a message. Indicated by `activeConversationId === null`. The greeting and suggestions are shown; no `Conversation` row exists yet.

When the user sends the first message, the staging path in `useChatSession` creates the `Conversation` row via `POST /api/conversation`, then transitions to **Pending State**.

---

## Pending State

The transient state between the first message being sent and the assistant stream completing. The conversation row exists in the DB, but is tracked via `pendingConversationId` in `ConversationContext` rather than `activeConversationId`. The sidebar entry appears optimistically during this window.

When the stream finishes (`onFinish`), `commitConversation(id)` flips `pendingConversationId → activeConversationId`.

---

## Nav Selection

"You are in this tab." Shown on the primary navigation items in `AppSidebar` (Chat / Pantry / Cookbook). Visual treatment: `bg-card` background, `text-foreground` label, terracotta (`text-primary`) icon outline (stroke color only — no fill swap).

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

A single turn within a **Tweak Bench** session. The user types one refinement instruction (e.g. "use chicken instead of tofu") and the AI streams an updated recipe block plus a structured change list. A Recipe Tweak cannot generate a wholly unrelated dish — the model refuses in plain text and leaves the working draft unchanged.

The AI call goes through a dedicated route (`POST /api/recipe/[id]/tweak`), separate from the chat pipeline.

Related: [ADR-0005](docs/adr/0005-tweak-bench-multi-turn.md)
