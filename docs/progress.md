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

### Default inventory seeding
- 6 starter items seeded idempotently for new users: salt, cooking oil, soy sauce (ingredients) + wok, pot, chef's knife (kitchenware).
- `POST /api/inventory/seed` endpoint; `useSession` hook fires it once on first session creation.

### Claude Design reference
Visual direction for the Kopitiam Modern redesign was generated via Claude Design:
https://api.anthropic.com/v1/design/h/bOL_xzI0rpgfpw7XTY5gsQ?open_file=Ask+Ah+Mah+-+Surface+Redesign.html

Follow this for color tokens, typography, surface hierarchy, paper texture, and border radius scale when making future visual changes.

### Kopitiam Modern UI overhaul (May 2026)
Full surface redesign based on Claude Design output. Key changes:

- **Color system**: OKLCH token overhaul — `--background` (aged newsprint), `--chat` (lightest, conversation surface), `--muted` (kraft tray for inventory + cookbook), `--card` (lighter than bg — inverted contrast so cards float up). Dark mode counterparts.
- **Paper texture**: SVG `feTurbulence` noise tiled at 200×200px with `background-blend-mode: multiply` on chat and inventory surfaces.
- **Layout**: Chat/Cookbook top-level tabs (folder-tab pattern — `z-10` TabsList covers content frame's `border-t`; active tab bottom matches surface color). Desktop: chat 7/10 + pantry sidebar 3/10. Mobile: Pantry button → bottom Drawer.
- **Tabs**: `rounded-t-xl` triggers, `rounded-lg` content frame. Standard Tailwind values throughout.
- **Chat header**: Replaced "Chatting with Ah Mah" strip with contextual session header — Fraunces italic day name + message count subtitle.
- **Inventory/Pantry**: Large italic Fraunces "Pantry" heading. Ingredients and Equipment sections as card boxes on kraft tray. Inline "+ Add" button.
- **Cookbook**: Full redesign — kraft tray background, "YOURS, KEPT" eyebrow + 40px Fraunces heading, search pill, tag filter chips with counts. Recipe cards: diagonal-stripe image strip, serif title + italic ingredient blurb, dashed-border footer with metadata + tag pills, dog-ear fold on first card. Empty state: instructional card (spans 2 rows) + 4 ghost placeholder cards.

### Stitch-inspired polish (sidebar zoning + tag cleanup)
- **Monochrome tags**: dropped categorical colors; all tags neutral outlined pills; active filter chip gets terracotta fill only.
- **Scrollbar**: track → transparent, thumb → `--border` (warm tan). No more jade/terracotta stripe.
- **Background zoning**: inventory aside → `bg-muted/50 rounded-2xl` tray; cookbook recipe list → `bg-muted/40 rounded-2xl` tray. Chat stays on plain cream.
- **Inventory sidebar flattened**: dropped Card chrome; small-caps `SectionLabel` dividers replace CardTitle. Add Item → `variant="outline" size="sm"`.
- **Chat header strip**: avatar + "Chatting with Ah Mah" + italic serif tagline above messages (desktop only).
- **Italic serif for assistant**: Ah Mah's messages render in `font-display italic` (Fraunces). User bubbles stay Inter.
- **Input refinement**: muted rounded container; send button is terracotta icon.

### UI/UX overhaul — Kopitiam Modern
- **Layout**: replaced kitchen drawer with Chat / Cookbook top-level tabs. Recipe detail is now a slide-over Sheet (not full-screen takeover). Mobile gets a Pantry button near the chat input opening a bottom Sheet.
- **Cookbook tab**: full-width `max-w-2xl` layout with "My Cookbook" heading, recipe count subtitle, larger recipe entries showing servings + ingredient count, and categorical tag filter chips.
- **Palette ("Kopitiam Modern")**: OKLCH-based — terracotta primary (`oklch(0.56 0.135 35)`), deep jade accent (`oklch(0.50 0.095 168)`), butter secondary (`oklch(0.86 0.10 88)`), warm cream background. Dark mode inverts to espresso + cream (no slate-blue). Replaces monotone olive/desaturated original.
- **Typography**: Fraunces display serif for headings (CardTitle, recipe names, "My Cookbook"). JetBrains Mono dropped (vestigial).
- **Categorical tag colors**: `tagClasses()` helper maps cuisine→jade, protein→terracotta, method→butter, difficulty→muted. Single source of truth shared by `RecipeList`, `RecipeDisplay`, and `recipeProcessor` prompt builder.
- **Component polish**: warm OKLCH card shadow; jade underline on active tab; user chat bubble → terracotta (`bg-primary`); shortfall badge → chili red theme (`text-destructive`); shelf-life dot → turmeric (`bg-tertiary`).

---

## V2 — In Progress

### Recipe card enrichment — description + total time (May 2026)
`RecipeCard` now shows a short evocative description and total-cook-time badge instead of a raw ingredient list.

- **`description`** and **`totalTimeMinutes`** added to `Recipe` schema (Prisma + TypeScript types).
- `processRecipe` extracts both on save via `generateObject` — description is post-hoc (not demanded from Ah Mah inline) to keep chat output natural.
- System prompt rule added: `**Total time:** ~X min` in every recipe so `processRecipe` has a reliable anchor.
- `RecipeCard` prefers `recipe.description`; falls back to ingredient-name blurb for older saves. Footer: clock icon + formatted duration + tag pills; `servings · ingredients` line dropped.
- Cookbook subtitle gains `· last added <weekday>` from new `createdAt` field.

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

### Why description is generated post-hoc, not by Ah Mah inline
Asking Ah Mah to produce a card blurb inside the recipe block would add a new required field to her output format — another thing to get wrong and another parser edge-case. `processRecipe` already runs on save against the full recipe text; it's a better context window for a concise creative sentence than an inline instruction buried in a 52-line system prompt.

### Why drop the 🛒 "missing ingredient" marker
The structured shortfall badge in `RecipeDisplay` replaces it — computed from real inventory units, not the model's guess. One signal beats two competing ones.

### Why no staple/perishable split
Tempting to model staples ("salt, oil") differently from perishables ("chicken, bok choy"), but the signal we actually need is shelf-life — which is continuous, not binary. A `shelfLife` enum on every item is simpler than a category split + special-cases.

### Why strict-unit shortfall (not cross-unit conversion)
Shipping the 80% case (matching units in same recipe + inventory) is far cheaper than a cross-unit conversion library + clove-to-head ontology. The system prompt nudges Ah Mah to prefer the units the user has, which closes most of the gap. Cross-unit conversion is V3+.
