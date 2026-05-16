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

## V2 — In Progress

### Multi-conversation backend (Slice 1) (May 2026)
- [x] `Conversation` Prisma model added (`id`, `userId`, `title?`, `createdAt`, `updatedAt`).
- [x] `Message` model updated: `conversationId` FK added (cascades on delete); old `userId`-only scoping replaced.
- [x] Migration `20260504000000_add_conversations` includes backfill for existing messages.
- [x] `src/lib/conversations/conversations.ts`: `listConversations`, `getOrCreateActiveConversation`, `getOrCreateEmptyConversation`, `createConversation`, `renameConversation`, `deleteConversation`, `autoTitleConversation`.
- [x] `getMessages` / `createMessage` now scoped to `conversationId` (userId still stored for convenience).
- [x] `POST /api/chat` accepts `conversationId`; fires `autoTitleConversation` non-blocking after first exchange.
- [x] `GET|POST /api/conversation` for listing/creating conversations, with POST reusing the canonical empty thread instead of creating duplicate empty rows.
- [x] `PATCH|DELETE /api/conversation/[id]` for rename/hard-delete; archived rows are purged and the archive column/index are removed in migration `20260507000000_replace_archive_with_delete`.
- [x] `GET|POST /api/message` updated to `conversationId`-scoped params.

### Three-rail layout / Conversations UI (Slice 2 + 3) (May 2026)
- [x] `ConversationContext` provides `activeConversationId`, `setActiveConversation`, `startNewConversation`, `renameActiveConversation`, `deleteActiveConversation`.
- [x] `ConversationTitle.tsx` — inline-editable title in chat header; `getTitleFallback` exported.
- [x] `src/features/Conversations/` — new feature folder: `ConversationItem`, `Conversations`, `ConversationsRail`, `ConversationsMobileSheet`, `constants`, `utils` (formatTime/formatWhen).
- [x] `ConversationsRail` — 260px left sidebar, `hidden lg:flex`, shows grouped (today/yesterday/earlier) list with search.
- [x] `ConversationsMobileSheet` — left Sheet for mobile; hamburger button in chat header triggers it (`lg:hidden`).
- [x] `PantryDrawer` — 36px collapsed tab on right edge; clicks open 320px absolute overlay (no chat reflow); state persisted in `localStorage`.
- [x] `page.tsx` — three-rail composition: ConversationsRail | ChatWrapper | PantryDrawer; old inventory aside removed.
- [x] Migration `20260504000000_add_conversations` — must be applied via `npx prisma migrate deploy` (not `db push`) due to backfill step.
- [x] Chat header archive button replaced with a calm trash affordance; clicking the trash icon opens a shadcn AlertDialog confirmation, confirming fires the DELETE immediately, and saved recipes remain untouched. The earlier deferred-undo toast pattern was dropped because it blocked back-to-back deletes during the undo window.
- [x] Bug fixed (May 2026): `Conversations.tsx` was reading `data?.grouped` but API returns `{ conversations: GroupedConversations }` — fixed to `data?.conversations`.
- [x] Bug fixed (May 2026): `src/app/api/message/route.ts` used default import for prisma — fixed to named `{ prisma }`.

### RecipeLetter (chat-inline): cart-icon add button + mobile padding (May 2026)
- [x] Outer padding: `px-4 sm:px-[26px]` (was fixed `26px` — gives 16px horizontal on mobile).
- [x] HAVE badge removed from ingredient rows; missing items now show a small cart-icon button (click-to-add) instead of the ambiguous "NEED" text label.
- [x] Servings stepper already inline with "What to gather" heading — no change needed.
- [x] Shortfall card unchanged.
- [x] RecipeLetter test updated: HAVE assertion flipped to confirm badge is absent; all 13 tests pass.

### RecipeDisplay (cookbook): strip pantry awareness + mobile padding (May 2026)
- [x] `RecipeDisplay` no longer fetches inventory or shows HAVE/NEED badges — cookbook is recipe storage, not meal planning.
- [x] `LegacyRecipeBody` and the `RecipeLetter`-based structured path collapsed into a single `RecipeBody`: legacy recipes use `Streamdown` markdown fallback; structured recipes (with `steps`) render numbered step cards.
- [x] Mobile padding: `px-4 sm:px-9` throughout (was `px-6 sm:px-9`).
- [x] Servings stepper moved inline with "What to gather" ingredients heading — saves vertical space on mobile.
- [x] All 16 `RecipeDisplay` tests pass; SWR/session mocks removed; structured-steps and no-pantry assertions added.

### Recipe card enrichment — description + total time (May 2026)
- [x] `description` and `totalTimeMinutes` exist in schema/types.
- [x] `processRecipe` extracts description + total time on save.
- [x] System prompt requires `**Total time:**` in recipe output.
- [x] `RecipeCard` uses description with fallback blurb and shows total time badge.
- [x] Cookbook subtitle includes `last added <weekday>` from `createdAt`.

### Chat surface style-system refactor (May 2026)
- [x] Migrated all inline styles in `src/features/Chat` to Tailwind CSS utility classes and project tokens.
- [x] Refactored all chat loaders: `StatusStream`, `Typing`, `WritingItOut`, `ShimmerLine`, and `SkeletonRecipeCard`.
- [x] Refactored all recipe rendering blocks: `IngredientGate`, `RecipeLetter`, `SuggestionsBlock`, and `ScaledNum`.
- [x] Established styling guardrails in `CLAUDE.md` to prefer tokens over inline styles.
- [x] Mapped arbitrary values to standard Tailwind tokens for improved maintainability.

### proposeRecipe tool — eliminate prose clarifying questions (May 2026)
- [x] Replaced `\`\`\`gate` fenced-block convention with a `proposeRecipe` tool call (no `execute`) registered in `/api/chat/route.ts`.
- [x] Gate card (`IngredientGate`) now renders from `tool-proposeRecipe` message part instead of parsed fenced text.
- [x] Removed `gate` branch from `extractRecipeBlocks` and `stripFences`; parser extracted to `src/lib/recipes/parseBlocks.ts`.
- [x] System prompt routing updated: named dish + ≥80% pantry coverage → `\`\`\`recipe` directly; otherwise → `proposeRecipe` tool.
- [x] Prompt rule: model must call `proposeRecipe` or emit `\`\`\`recipe` — never ask "do you have X?" in prose.
- [x] Unit tests added for `parseBlocks.ts` (14 cases including regression guard for removed gate path).
- [x] `MessageList.test.tsx` extended with 4 cases covering tool-part rendering and absence of legacy gate path.

### Organised Pantry — Phase 1: Category schema (May 2026)
- [x] `category String?` column added to `InventoryItem` (`prisma/schema.prisma`); DB synced via `prisma db push`.
- [x] `CategorySchema` (Protein | Carbs | Vegetable | Condiments | Misc) added to `src/lib/inventory/schemas.ts`; flows through `AddInventoryItemSchema` automatically.
- [x] `addInventoryItem` upsert (`Inventory.ts`) persists `category` on both create and update paths.
- [x] `/api/inventory/parse` prompt updated with category rules — model assigns category to every ingredient it parses.
- [x] `CHAT_SYSTEM_PROMPT` updated with matching category rules for the `addInventoryItem` tool call path.
- [x] Schema tests extended: all five valid values accepted; invalid string rejected; category optional (kitchenware/null stays valid). (34 tests pass.)
- Unblocks #81 (pantry drawer grouped headings UI).

### Recipe ingredient category + NEED pill improvements (May 2026)
- [x] `category` required on `RecipeIngredientSchema` and `RecipeIngredientModelSchema`; reuses `CategorySchema` from inventory module.
- [x] System prompt instructs model to emit `category` per ingredient (one of six values).
- [x] Spice category added to `CategorySchema` (#94).
- [x] Token-overlap `ingredientMatches` replaces bidirectional substring match in both `RecipeLetter` and `pantryUtils.computePantry` — fixes "doubanjiang" class of false-NEED bugs.
- [x] NEED pill is a clickable `<button>`; clicking POSTs to `/api/inventory`, revalidates SWR, shows success/error toast.
- [x] `RecipeLetter.test.tsx` covers click-to-add POST body, toast feedback, SWR revalidation, in-flight disabled state.
- **HITL pending:** `TRUNCATE recipes RESTART IDENTITY CASCADE;` — run before deploying to clear legacy rows without `category`.

### Organised Pantry — Phase 2: Category headings UI (May 2026)
- [x] Ingredients section in `Inventory.tsx` now renders category sub-groups (Protein / Carbs / Vegetable / Condiments / Misc) instead of a flat badge list.
- [x] Each sub-group: label + dotted-line spacer + count, then the badges. Empty categories hidden.
- [x] Items with null category (pre-existing rows) fall under Misc.

### Mobile fixes — Round 1: chat header (May 2026)
- [x] Chat header now renders at all widths (was `hidden sm:flex` — true mobile had no header at all).
- [x] Single row at all widths: `[≡] • Title… [⋯]`. Hamburger (`lg:hidden`) opens `ConversationsMobileSheet`; title is plain text that truncates with ellipsis.
- [x] All conversation actions consolidated into `⋯` overflow menu: New conversation (disabled when no messages), Rename, Delete.
- [x] `ConversationTitle` refactored: pure visual display with optional `titleClassName` override; `ConversationActionsMenu` is a separate named export holding the dropdown + AlertDialog delete confirm.
- [x] `dropdown-menu` shadcn primitive added.
- [x] `ConversationsMobileSheet` suppresses the shadcn auto-close X (`showCloseButton={false}`) to prevent overlap with the Conversations component's `+` button.

### Better Auth — Setup & Login UI (May 2026)
- [x] `better-auth` installed with Prisma adapter (`postgresql` provider).
- [x] Google OAuth and Email (Magic Link via Resend) providers configured in `src/lib/auth.ts`.
- [x] `src/lib/auth-client.ts` — client singleton (`better-auth/react`) with `magicLinkClient` plugin.
- [x] `GET|POST /api/auth/[...all]` — Better Auth Next.js handler via `toNextJsHandler`.
- [x] `useSession` bridges Better Auth session with localStorage guest fallback; authenticated `userId` = `session.user.id`; exposes `isAuthenticated` and `user`.
- [x] `SessionContext` gains `isAuthenticated: boolean` and `user` fields.
- [x] `SignInDialog` — modal with Google OAuth button + email magic link input; resets state on close; `try/finally` on Google redirect.
- [x] `AuthButton` — shows "Sign in" for guests (opens `SignInDialog`); shows avatar initial + "Sign out" dropdown when authenticated.
- [x] `AuthButton` placed beside `AboutPopOver` in the global nav (both in a flex container).
- [x] Auth is purely additive — guests continue to work unchanged. Authenticated users start with a fresh kitchen (guest data migration is #83).

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

## Known Issues

- `ConversationContext.activeConversation` (`ConversationContext.tsx:66`) is bound to the initial one-shot SWR fetch. When `activeConversationId` is already set (e.g. restored from localStorage), the fetch is skipped and `activeConversation` stays `null` — the chat header shows the fallback title correctly but features that read `activeConversation` fields (e.g. `createdAt`) won't populate until the context re-fetches.
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
