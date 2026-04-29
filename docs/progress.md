# Progress

## Context

The moat is **persistent kitchen state**: what the user has, what they cooked, what they save. ChatGPT/Claude forget after a session — this app remembers. Every feature should compound that data advantage.

---

## V1 — Shipped (April 2026)

### Structured recipes
- `Recipe` schema gains `baseServings: Int` + `ingredients: Json` (`[{ name, amount?, unit? }]`).
- `RecipeDisplay` renders a +/- servings stepper that scales amounts client-side.
- Strict-unit-match shortfall badges against inventory (recipe unit string == inventory unit string AND both numeric AND inventory quantity present).
- Multi-recipe-per-message: when Ah Mah emits two recipes in one message, each gets its own labelled Save button.
- `processRecipe` extracts metadata (tags, baseServings, ingredients) on save; recipe text passes through unchanged.

### Freeform inventory entry
- `POST /api/inventory/parse` — freeform text → structured items via `generateObject`.
- Drawer's old four-field form replaced with a single textarea routed to that endpoint.
- New `shelfLife: 'short' | 'medium' | 'long'` field, AI-inferred on add.
- Optional `quantity`/`unit` — unspecified means "have it, amount unlimited."
- Amber dot on `InventoryItemBadge` when `shelfLife === 'short'`.

### System prompt rewrite
- 155 lines / 7 KB → 52 lines / 3 KB.
- One source of truth per rule; no conflicting recipe templates.
- Light Singlish (`lah`/`ah`/`aiyah` natural, not performative).
- Kenji López-Alt / Samin Nosrat / ATK lens: explain *why* a technique works.
- Targeted `getInventory` (only for recipes / "what can I cook"), not for general cooking knowledge.

### Ops / cleanup
- Schema columns added: `shelfLife`, `baseServings`, `ingredients`.
- Dropped 🛒 "missing ingredient" marker (structured shortfall badge replaces it).
- Dropped `cleanedInstructions` task from `processRecipe` (was the dominant `generateObject` failure mode; vestigial after prompt rewrite).
- Recipe save degrades gracefully if metadata extraction throws.
- `.cursor/rules/*` migrated to `docs/`; Cursor-specific config dropped.

---

## V2 — In Progress

### Decrement-on-cook
The inventory-accuracy lever we KIV'd from V1. Without it, users have to manually remove items, the inventory drifts into fiction within a week, and recipe suggestions degrade.

- **"Cooked This" button** on `RecipeDisplay` (saved recipes).
- **Confirmed chat inference**: when user says "I made the chicken stir fry", AI proposes ("Looks like you cooked X — update inventory? [yes / no / edit]") and waits for a tap. Never silent.
- **Math when quantity is set**: recipe needed 200g, inventory had 500g → inventory now 300g. When quantity is unset (the "unlimited" case), the prompt is "did this finish it? [yes / no]" — `yes` removes the item.
- For freeform off-recipe meals ("I just threw together fried rice"): do nothing. Don't try to be clever.

### Shopping list from shortfalls
Natural extension of V1's shortfall feature. Currently the badge says "short 100g" — V2 turns that into action.

- **One-click "Add missing to shopping list"** from `RecipeDisplay`.
- **`ShoppingList` model** (Prisma): `id`, `userId`, `name`, `quantity?`, `unit?`, `addedAt`, `recipeId?`.
- **UI surface**: new tab in the drawer next to Inventory + Recipe.
- **Loop back to inventory**: items get marked done in the shopping list, which can route them straight into `addInventoryItem` so the user doesn't re-enter on next shop.

---

## V3+ — Ideas (KIV)

- **Aging / "going bad soon" alerts** — `shelfLife` + `dateAdded` driven. KIV'd in V1 because users log perishables late, so date-based alerts misfire. Revisit if `shelfLife` alone proves insufficient signal.
- **Streaming recipe scaling** (Option Y from earlier grilling) — servings stepper on in-chat unsaved recipes. Requires structured streaming output via tool calls.
- **Unit conversion for shortfall** — smarter cross-unit matching (`lb` ↔ `g`, `cup` ↔ `tbsp`).
- **Migrate from `prisma db push` to `prisma migrate dev`** — proper migration history once collaborators or prod safety becomes important.
- **Voice input** — speech-to-text for hands-free cooking.
- **Recipe markdown export** — download saved recipes.
- **Recipe sharing / community** — eventually.

---

## Decisions log

### Why optional quantity (unspecified = unlimited)
Casual home cook UX. Users won't enter "237g chicken breast" — they enter "1 chicken breast" or just "chicken." Forcing precision makes the inventory feel like paperwork. Unspecified quantity means "they have it, amount unlimited."

### Why no aging alerts in V1
Users log perishables late ("oh, I bought this 3 days ago"), so a clock-based alert fires off the wrong baseline. Static shelf-life *indicator* (the amber dot) ships in V1; active alerting waits.

### Why structured-on-save not on streaming (V1)
Smaller blast radius for V1. Saving-before-scaling is a one-tap friction, and it nudges users toward saving recipes — which compounds the moat (cooking history). Reconsider for V2/V3 once structured streaming is worth the refactor.

### Why drop `cleanedInstructions` from `processRecipe`
Was the dominant `generateObject` failure mode — long re-emission output truncated or produced malformed JSON, killing tag/ingredient extraction with it. Original purpose (stripping `✅` / `🛒` markers from old prompts) became vestigial after the prompt rewrite. Recipe text now passes through unchanged.

### Why drop the 🛒 "missing ingredient" marker
The structured shortfall badge in `RecipeDisplay` replaces it — computed from real inventory units, not the model's guess. One signal beats two competing ones.

### Why no staple/perishable split
Tempting to model staples ("salt, oil") differently from perishables ("chicken, bok choy"), but the signal we actually need is shelf-life — which is continuous, not binary. A `shelfLife` enum on every item is simpler than a category split + special-cases.

### Why strict-unit shortfall (not cross-unit conversion)
Shipping the 80% case (matching units in same recipe + inventory) is far cheaper than a cross-unit conversion library + clove-to-head ontology. The system prompt nudges Ah Mah to prefer the units the user has, which closes most of the gap. Cross-unit conversion is V3+.
