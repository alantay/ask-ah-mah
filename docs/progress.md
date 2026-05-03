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
