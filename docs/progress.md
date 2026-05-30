# Progress Checklist

## Context
- [x] Persistent kitchen state remains the core moat (inventory + cooked + saved).

## V1 — Shipped (April 2026)

The persistent-kitchen MVP. Highlights:
- Structured recipes (`baseServings` + `ingredients` JSON, +/- servings stepper, strict-unit shortfall badges, multi-recipe save).
- Freeform inventory entry via `POST /api/inventory/parse`; optional `quantity`/`unit`; `shelfLife` enum with amber-dot UI for short-life items.
- Unified system prompt (light Singlish, technique-why focus, targeted `getInventory` use).
- Default inventory seed on first session (`POST /api/inventory/seed`).
- Kopitiam Modern surface redesign (tokenized colors, paper texture, chat/cookbook tabs, responsive pantry).

## V2 — Shipped (May 2026)

Multi-conversation, organised pantry, auth, and a leaner recipe surface. Highlights:
- **Multi-conversation backend**: `Conversation` model; `Message` scoped to `conversationId`; auto-titling after first exchange; `GET|POST /api/conversation` + `PATCH|DELETE /api/conversation/[id]`.
- **Three-rail layout**: `ConversationsRail` (260px desktop sidebar) + `ConversationsMobileSheet` (hamburger); `PantryDrawer` right-edge overlay (no chat reflow); trash-with-confirm (`AlertDialog`) replaces archive.
- **Pantry as first-class mobile tab**: `Chat | Pantry | Cookbook` at `<lg`; viewport-clamp snaps back to `chat` on crossing `lg+`. At desktop, `PantryDrawer` handles access.
- **Mobile cookbook**: search matches `name || tag`; horizontal-scroll chip rail replaces proposed facet-sheet design (too heavy, hid options).
- **Cookbook = storage, not meal planning**: `RecipeDisplay` strips inventory/HAVE-NEED; single `RecipeBody` handles legacy markdown + structured steps.
- **Recipe card enrichment**: `description` + `totalTimeMinutes` extracted on save; total-time badge and "last added" subtitle in cookbook.
- **`proposeRecipe` tool**: replaces `gate` fenced-block convention; model must call `proposeRecipe` or emit ` ```recipe ` — never ask "do you have X?" in prose.
- **Organised Pantry**: `category` enum (`Protein | Carbs | Vegetable | Condiments | Misc | Spice`) on `InventoryItem` and `RecipeIngredient`; pantry grouped under category headings; token-overlap `ingredientMatches` fixes false-NEED bugs (doubanjiang class).
- **NEED pill → clickable add**: clicking a NEED pill POSTs to `/api/inventory`, revalidates SWR, shows toast.
- **Better Auth**: Google OAuth + email magic link (Resend); `useSession` bridges auth session with localStorage guest fallback; guests unchanged.

## V2 — Polish (May 2026)

- **Rail-owned rename/delete**: rename and delete actions moved from the chat-panel header into each rail row. A hover-revealed 3-dot button opens a popover with Rename/Delete; Rename triggers an inline text input inside the row. The chat-panel top header is removed on desktop; mobile gets a slim bar with a hamburger (rail sheet) and an active-conversation 3-dot for the same actions. `AlertDialog` delete confirmation now names the conversation being deleted.
- **Cookbook → recipe is a modal**, not a route: `RecipeList` opens `RecipeDisplay` inside a Radix `Dialog`. `/recipe/[id]` route kept for direct links.
- **Recipe layout**: centred max-w-3xl card on the app background (no full-bleed); Copy button removed; Back navigates to `?tab=cookbook` (read by `app/page.tsx` via `useSearchParams`).
- **Pantry fills horizontally**: `max-w-[1200px]` dropped; CSS columns (masonry) replace the rigid grid so short categories don't leave dark gaps.
- **CookingMode lifted to consumer**: cooking state lives in `RecipeList` (and chat) rather than inside `RecipeDisplay`. Cookbook closes the dialog before mounting `CookingMode` at the top level — Radix Dialog's `pointer-events: none` on siblings was killing the Next-step button when CookingMode rendered inside / portalled from the dialog.

- **Paste-to-cookbook**: `+ Add recipe` button in cookbook header opens a two-step modal — paste raw recipe text, LLM extracts it into full `RecipeBlock` (structured steps, scalable amounts, prep, tags), preview via `RecipeDisplay`, then save. Failure guard rejects non-recipe text. Empty-state gets a secondary "or paste one you've found" CTA. Extraction via new `POST /api/recipe/extract` (no-persist preview endpoint); save uses existing structured `POST /api/recipe` path.

- **Gemini-style sidebar**: replaced mobile tab bar with a persistent left sidebar on desktop (`AppSidebar`). Primary nav (Chat / Pantry / Cookbook) at top; `Conversations` list always visible below.

- **Sidebar UX polish + deferred conversation creation** (May 2026):
  - Nav selection (mode) and Thread selection (conversation row) are now distinct — see ADR-0003.
  - Active nav text is `text-foreground`; only the icon gets the terracotta `text-primary` tint.
  - "New Chat" nav item is only highlighted in Staging State (`activeConversationId === null`). Once a conversation is active, the nav item unhighlights and the conversation row highlights instead.
  - `Conversation` rows are only created on first message, not on "New Chat" click — see ADR-0002. Clicking "New Chat" enters Staging State (client-only); the DB row is created in `useChatSession` when the first message is sent.
  - Chat panel uses `xl:container mx-auto` for side gutters at xl+ screens; message content is capped at `max-w-5xl mx-auto`.

- **Visual polish pass** (May 2026): Four changes from cookbook mockup review: (1) Logo wordmark switched from Nunito to Fraunces italic with a two-tone split — "Ask " in faint taupe (`--ink-faint`), "Ah Mah" in terracotta (`--primary`). (2) Reusable `variant="cta"` added to shadcn `Button` (terracotta gradient + color-matched shadow + lift-on-hover); Add recipe is its first consumer. (3) Cookbook filter sidebar: per-category "+N more" / "Show less" collapse (VISIBLE_LIMIT = 5) so long tag lists don't overwhelm. (4) App-wide linen grain texture: replaced dot-grain SVG `.paper` class with a directional `repeating-linear-gradient` stripe, also applied globally to `body`.

- **Send guard** (May 2026): Fixed double-submission bug — a synchronous `sendingRef` lock and `isSending` state now cover the async pre-send gap (conversation create + message save) before the AI SDK `status` transitions from `"ready"`. Loader shows immediately on submit; input stays disabled until the request is fully in-flight.

## V2 — In Progress

### Cook With What You Have — In Review (May 2026)
- **Selection mode** on the Pantry surface: "Cook with what you have" toggle enters a checkbox mode on ingredient and kitchenware rows. Kitchenware selection = preferred equipment (preference, not constraint — ADR-0007).
- **CTA adapts** to selection shape: "Suggest recipe (N selected)" for ingredients, "Surprise me with [Air fryer]" for equipment-only.
- **Short-shelf shortcut**: "Select use-soon items" button pre-selects all amber-dot ingredients in one tap — cashes in the `shelfLife` tracking from V1.
- **Submit flow**: composes a synthetic Mode 3 message ("Suggest recipes using: …"), enters Staging State via `ConversationContext`, navigates to Chat. Chat auto-sends the queued message once `status === "ready"`.
- **Mode 3 prompt**: new section in `CHAT_SYSTEM_PROMPT`. Close Recipe (0–2 Additions, `closeness: "close"`) + Stretch Recipe (3–4 Additions, `closeness: "stretch"`). Additions = items not in pantry; free staples: salt/pepper/oil/water.
- **Recipe cards**: render "Right now" / "Worth a small trip" caption chip when `closeness` is set.
- **More ideas button**: shown below Cook-With response pairs; sends "More ideas — different from these" in same Conversation.
- **Chat staging chip**: "🥬 Cook with what I have →" routes to Pantry and auto-enters selection mode via `?selectionMode=1` URL param.
- Key decisions: ADR-0006 (reuses `/api/chat`, not a dedicated route), ADR-0007 (selection = emphasis not constraint).

### Recipe Tweak UI (Direction C) — Shipped May 2026
- **5-state interactive flow** inside `RecipeDisplay`: resting → open → streaming → preview → saved.
- **State 1 (Resting)**: inline dashed-border "Want Ah Mah to tweak this?" button below the Ah Mah note section.
- **State 2 (Open)**: fixed bottom bar with granny avatar, Ah Mah voice prompt, 4 quick-tweak chips, text input + send button, ✕ dismiss.
- **State 3 (Streaming)**: calls `POST /api/recipe/[id]/tweak`, accumulates streaming JSON, progressively updates recipe; bottom bar shows "You said + dot animation".
- **State 4 (Preview)**: stream done; bottom bar shows Ah Mah message + Save / Try a different tweak / Discard actions. Changed ingredients and steps get `bg-amber-50` highlight.
- **State 5 (Saved)**: calls `PATCH /api/recipe/[id]` to persist; sonner success toast; "Tweak again" button replaces resting-state button; "tweaked just now" badge in Ah Mah note.
- Tweak state fully contained in `RecipeDisplay` (no page-level changes needed). `userId` sourced from `useSessionContext` internally.

### Shopping list from shortfalls
- [ ] Add one-click `Add missing to shopping list` from `RecipeDisplay`.
- [ ] Add `ShoppingList` Prisma model (`id`, `userId`, `name`, `quantity?`, `unit?`, `addedAt`, `recipeId?`).
- [ ] Add shopping-list UI surface.
- [ ] Add "mark done → route into inventory" flow.

## V3+ — Ideas (KIV)
- [ ] Aging / "going bad soon" alerts (`shelfLife` + `dateAdded`).
- [ ] Streaming recipe scaling for unsaved in-chat recipes.
- [ ] Cross-unit shortfall conversion.
- [ ] Move fully from `prisma db push` workflow to migration-first flow.
- [ ] Voice input.
- [ ] Recipe markdown export.
- [ ] Recipe sharing/community.

## Known Issues

- **HITL pending**: `TRUNCATE recipes RESTART IDENTITY CASCADE;` — run before deploying to clear legacy recipe rows without `category`.
- `ConversationContext.activeConversation` (`ConversationContext.tsx:66`) is bound to the initial one-shot SWR fetch. When `activeConversationId` is already set (e.g. restored from localStorage), the fetch is skipped and `activeConversation` stays `null` — features that read `activeConversation` fields (e.g. `createdAt`) won't populate until the context re-fetches.
- Rail SWR key (`/api/conversation?userId=...`) is not invalidated after messages are saved (`Chat.tsx:149` only mutates the message list). Message counts on `ConversationItem` stay stale until focus/refetch. Fix: call `mutate('/api/conversation?userId=...')` after `saveMessage`, or add `refreshInterval`.
- `autoTitleConversation` fires server-side after the first assistant reply — no client-side mutate trigger exists, so the rail title only updates on the next SWR revalidation (focus/refetch), not immediately.

## Decisions

- **Optional quantity = "unlimited"**: unset `quantity` means the item has no limit. Avoids forcing a count on pantry staples where "do I have enough?" is never the question.
- **Structured-on-save over streaming extraction**: metadata (`baseServings`, `ingredients`, `description`, `totalTimeMinutes`) is extracted when the user saves a recipe, not streamed inline. Simpler streaming path; extraction failures degrade gracefully without breaking the chat.
- **Strict-unit shortfall first; cross-unit conversion deferred**: `unit` must match exactly for shortfall calculation. Cross-unit conversion (e.g. `g` vs `kg`) is a V3+ problem — the complexity isn't justified until users actually hit it.
- **No staple/perishable split; `shelfLife` enum instead**: `'short' | 'medium' | 'long'` is inferred on add. Avoids a binary that doesn't fit many items (e.g. opened sauces); the amber dot surfaces urgency without forcing a category.
- **Description generated post-hoc, not inline in assistant response**: `processRecipe` extracts description on save. Keeping the assistant response format simple reduces prompt complexity and lets the extraction be richer than what would fit in a streamed recipe block.
- **Aging alerts deferred from V1**: `shelfLife` + `dateAdded` are stored, but alert UI is V3+. V1 scope was inventory + recipes; alerts add a notification surface that needs its own design pass.
- **`userId` retained on `Message` rows** even though `conversationId` is now the primary scope. Simplifies raw queries and avoids joins for user-scoped cleanup jobs.
- **`prisma migrate deploy` over `db push`** for the conversations migration: `db push` blocks on the `NOT NULL` backfill step in `20260504000000_add_conversations`.
- **PantryDrawer absolute overlay over reflow**: pantry opens as a right-edge overlay so chat width stays stable. Tab stays mounted so the right edge doesn't jump on open/close.
- **Horizontal-scroll chip rail over facet sheets (cookbook)**: surfaces all tags at a glance; facet sheets added taps and hid options.
- **Cookbook strips pantry awareness**: `RecipeDisplay` is storage, not meal planning. HAVE/NEED badges belong in the chat-inline `RecipeLetter` only.
- **Decrement-on-cook dropped**: tracking what was cooked, confirming with the user, and decrementing inventory adds a confirmation surface and an "active cooking" state model that's hard to get right. The pantry is whatever the user says it is; nudges live in chat ("I used the last of the eggs"). Removed from the V2 backlog entirely.
