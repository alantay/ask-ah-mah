# ADR-0003 — Nav Selection and Thread Selection are distinct concepts

**Status:** Accepted

---

## Context

The app has two "you are here" surfaces:

1. The primary nav (Chat / Pantry / Cookbook) — indicates which app *mode* the user is in.
2. The conversation list — indicates which *thread* the user is reading.

Initially both used the same visual treatment (highlight + foreground text). This caused the Chat nav item to stay highlighted while a conversation was active, creating the appearance of two simultaneous selections.

---

## Decision

Nav selection and Thread selection are **mutually exclusive**:

- **Nav selection** uses `bg-card + text-foreground + filled icon (text-primary)`. Applied to a nav item only when no thread is selected.
  - The Chat nav item is highlighted only in Staging State (`activeConversationId === null && pendingConversationId === null`).
  - Pantry and Cookbook are highlighted whenever their tab is active (they have no "thread" concept).

- **Thread selection** uses **butter** (`oklch(0.86 0.10 88)`). Applied to a conversation row when it is the active or pending conversation.

While a conversation is active, the Chat nav item is *not* highlighted — the conversation row carries the "you are here" signal.

---

## Consequences

**Benefits:**
- A user looking at the sidebar understands their location from a single highlighted element, not two.
- The visual grammar is consistent: butter = "what you're reading," bg-card = "what mode you're in."
- New contributors cannot accidentally apply the butter pattern to nav items (ADR-0001 covers butter; this ADR covers nav).

**Trade-offs:**
- The Chat nav item being un-highlighted while a conversation is open may feel counterintuitive — the user is still "in Chat." Accepted: the conversation row is sufficient context.
- Requires tracking `pendingConversationId` to correctly unhighlight Chat during the stream (before `commitConversation` fires).

**Alternatives considered:**
- Single unified selection surface: rejected because nav and thread live at different levels of hierarchy.
- Highlight both simultaneously: rejected — tested in practice and caused visual confusion.
