# Progress Checklist

## Context
- [x] Persistent kitchen state remains the core moat (inventory + cooked + saved).

## V1 — Shipped (April 2026)

### Structured recipes
- [x] `Recipe` schema has `baseServings: Int` + `ingredients: Json` (`[{ name, amount?, unit? }]`).
- [x] `RecipeDisplay` has +/- servings stepper that scales ingredient amounts client-side.
- [x] Strict-unit-match shortfall badges in recipe view (`unit` must match exactly, both numeric, inventory quantity required).
- [x] Multi-recipe-per-message save support (separate save buttons per recipe block).
- [x] `processRecipe` extracts tags/baseServings/ingredients on save; recipe text is stored unchanged.

### Freeform inventory entry
- [x] `POST /api/inventory/parse` converts freeform text to structured items via `generateObject`.
- [x] Inventory add flow uses freeform textarea (replacing old 4-field form).
- [x] `shelfLife: 'short' | 'medium' | 'long'` is inferred on add.
- [x] `quantity`/`unit` are optional (unset = unlimited).
- [x] Amber dot shown on `InventoryItemBadge` when `shelfLife === 'short'`.

### System prompt rewrite
- [x] Prompt condensed and unified (single source of truth, no conflicting templates).
- [x] Light Singlish tone maintained.
- [x] Technique explanations emphasize the "why".
- [x] `getInventory` usage is targeted (recipe/inventory-relevant scenarios).

### Ops / cleanup
- [x] Schema columns added: `shelfLife`, `baseServings`, `ingredients`.
- [x] Legacy 🛒 marker removed (shortfall badge is the source of truth).
- [x] `cleanedInstructions` removed from `processRecipe`.
- [x] Recipe save degrades gracefully when metadata extraction fails.
- [x] Cursor-specific rules moved to docs and config cleaned up.

### Default inventory seeding
- [x] 6 starter items seeded idempotently (salt, oil, soy sauce, wok, pot, chef's knife).
- [x] `POST /api/inventory/seed` exists and `useSession` triggers on first session.

### UI overhaul / polish (Kopitiam Modern)
- [x] Tokenized color system + paper texture applied.
- [x] Chat/Cookbook tab structure + responsive pantry behavior.
- [x] Pantry and cookbook tray zoning + flattened sidebar treatment.
- [x] Assistant typography and chat input refinements shipped.

## V2 — In Progress

### Multi-conversation backend (Slice 1) (May 2026)
- [x] `Conversation` Prisma model added (`id`, `userId`, `title?`, `archived`, `createdAt`, `updatedAt`).
- [x] `Message` model updated: `conversationId` FK added (cascades on delete); old `userId`-only scoping replaced.
- [x] Migration `20260504000000_add_conversations` includes backfill for existing messages.
- [x] `src/lib/conversations/conversations.ts`: `listConversations`, `getOrCreateActiveConversation`, `createConversation`, `renameConversation`, `archiveConversation`, `autoTitleConversation`.
- [x] `getMessages` / `createMessage` now scoped to `conversationId` (userId still stored for convenience).
- [x] `POST /api/chat` accepts `conversationId`; fires `autoTitleConversation` non-blocking after first exchange.
- [x] `GET|POST /api/conversation` for listing/creating conversations.
- [x] `PATCH /api/conversation/[id]` for rename/archive.
- [x] `GET|POST /api/message` updated to `conversationId`-scoped params.

### Three-rail layout / Conversations UI (Slice 2 + 3) (May 2026)
- [x] `ConversationContext` provides `activeConversationId`, `setActiveConversation`, `startNewConversation`, `renameActiveConversation`, `archiveActiveConversation`.
- [x] `ConversationTitle.tsx` — inline-editable title in chat header; `getTitleFallback` exported.
- [x] `src/features/Conversations/` — new feature folder: `ConversationItem`, `Conversations`, `ConversationsRail`, `ConversationsMobileSheet`, `constants`, `utils` (formatTime/formatWhen).
- [x] `ConversationsRail` — 260px left sidebar, `hidden lg:flex`, shows grouped (today/yesterday/earlier) list with search.
- [x] `ConversationsMobileSheet` — left Sheet for mobile; hamburger button in chat header triggers it (`lg:hidden`).
- [x] `PantryDrawer` — 36px collapsed tab on right edge; clicks open 320px absolute overlay (no chat reflow); state persisted in `localStorage`.
- [x] `page.tsx` — three-rail composition: ConversationsRail | ChatWrapper | PantryDrawer; old inventory aside removed.
- [x] Migration `20260504000000_add_conversations` — must be applied via `npx prisma migrate deploy` (not `db push`) due to backfill step.
- [x] Bug fixed (May 2026): `Conversations.tsx` was reading `data?.grouped` but API returns `{ conversations: GroupedConversations }` — fixed to `data?.conversations`.
- [x] Bug fixed (May 2026): `src/app/api/message/route.ts` used default import for prisma — fixed to named `{ prisma }`.

### Known remaining issues (as of May 2026)
- [ ] `ConversationContext.activeConversation` is only populated when the context fetches it from the API on first load (no stored localStorage id). After that it's `null` — the chat header shows fallback title correctly but `_count.messages` in the rail may lag until SWR revalidates.
- [ ] Rail SWR key is not invalidated after each new message is saved — message count on ConversationItem stays at 0 until hard refresh. Fix: call `mutate('/api/conversation?userId=...')` after `saveMessage` in Chat.tsx, or add `refreshInterval`.
- [ ] `autoTitleConversation` fires after first assistant reply — the rail title updates only on next SWR revalidation (focus/refetch), not immediately.
### Recipe card enrichment — description + total time (May 2026)
- [x] `description` and `totalTimeMinutes` exist in schema/types.
- [x] `processRecipe` extracts description + total time on save.
- [x] System prompt requires `**Total time:**` in recipe output.
- [x] `RecipeCard` uses description with fallback blurb and shows total time badge.
- [x] Cookbook subtitle includes `last added <weekday>` from `createdAt`.

### Decrement-on-cook
- [ ] Add `Cooked This` button in `RecipeDisplay` for saved recipes.
- [ ] Add explicit confirmation flow for inferred "I cooked X" messages (`yes / no / edit`).
- [ ] Implement quantity decrement math when inventory quantity is set.
- [ ] Implement unlimited-quantity confirm/remove flow (`did this finish it?`).
- [ ] Keep freeform off-recipe meal messages as no-op.

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

## Decision Log (recorded)
- [x] Optional quantity design: unset quantity means "unlimited".
- [x] Aging alerts intentionally deferred in V1.
- [x] Structured-on-save chosen over streaming extraction for V1.
- [x] `cleanedInstructions` removed due to reliability issues.
- [x] Description generated post-hoc (not inline in assistant response).
- [x] Legacy missing-ingredient marker removed.
- [x] No staple/perishable split; shelf-life enum used instead.
- [x] Strict-unit shortfall shipped first; conversion deferred.
- [x] Multi-conversation: `userId` kept on `Message` rows even though `conversationId` is now the primary scope — simplifies raw queries and avoids joins for user-scoped cleanup jobs.
- [x] Three-rail layout: worktree `feat/three-rail-layout` built in isolation (`.worktrees/feat/three-rail-layout/`). Merge to `main` via normal PR — run `git push origin feat/three-rail-layout` then open PR on GitHub. No special worktree merge steps needed.
- [x] PantryDrawer: absolute overlay (right side) chosen over reflow — chat width stays stable when pantry opens. Tab stays mounted so right edge doesn't jump.
- [x] `prisma migrate deploy` required (not `db push`) for the conversations migration — `db push` blocks on the NOT NULL backfill step.
