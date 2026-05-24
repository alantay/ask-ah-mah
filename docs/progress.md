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

## V2 — In Progress

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
