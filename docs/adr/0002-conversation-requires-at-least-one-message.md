# ADR-0002 — A Conversation requires at least one Message

**Status:** Accepted

---

## Context

Previously, clicking "New Chat" immediately created an empty `Conversation` row via `POST /api/conversation`. This empty row appeared in the sidebar list under "Conversations" before the user had typed anything, polluting the list with placeholder entries and conflating "navigation intent" with "data creation."

---

## Decision

A `Conversation` row is only created when the first message is sent. Clicking "New Chat" enters **Staging State** (`activeConversationId === null`) — a purely client-side condition, no DB write. The `POST /api/conversation` call happens inside `useChatSession.handleSendMessage` on the staging path, immediately before `sendMessage` is called.

---

## Consequences

**Benefits:**
- The conversations list only contains threads with real content.
- Clicking "New Chat" repeatedly never accumulates empty rows.
- The UI concept of "staging" maps cleanly to "no DB row yet."

**Trade-offs:**
- The first message path is slightly more complex: create conversation → optimistic list insert → save user message → start stream.
- The `ChatWrapper` can no longer gate rendering on `activeConversationId !== null`; it must render the chat input in staging state.
- `DELETE` of the last conversation must go to staging state rather than auto-creating a new empty row.

**Alternatives considered:**
- Deferred creation on stream start (not first message): rejected because we need the `conversationId` to exist before saving the user message.
- Keeping eager creation but filtering the list: rejected because ghost rows in the DB create confusion for debugging and data audits.
