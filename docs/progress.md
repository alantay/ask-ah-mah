# Progress Checklist

## Context
- [x] Persistent kitchen state remains the core moat (inventory + cooked + saved).

## V1 — Shipped (April 2026)

The persistent-kitchen MVP. Highlights:
- Structured recipes (`baseServings` + `ingredients` JSON, +/- servings stepper, strict-unit shortfall badges, multi-recipe save).
- Freeform inventory entry via `POST /api/inventory/parse`; optional `quantity`/`unit`.
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
- **Better Auth**: Google OAuth + anonymous sessions (`anonymous()` plugin); `useSession` always resolves `userId` from the session — guests get an anonymous session, no localStorage id. See "Anonymous-session identity foundation" (#340).

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

- **Visual polish pass** (May 2026): Three changes from cookbook mockup review: (1) Logo wordmark switched from Nunito to Fraunces italic with a two-tone split — "Ask " in faint taupe (`--ink-faint`), "Ah Mah" in terracotta (`--primary`). (2) Cookbook filter sidebar: per-category "+N more" / "Show less" collapse (VISIBLE_LIMIT = 5) so long tag lists don't overwhelm. (3) Tray-surface paper texture: two-layer SVG grain (fine fractal noise α0.08 + soft directional fiber α0.10), `multiply`-blended on app shell, sidebar, pantry, cookbook, and mobile sheet. Chat panel intentionally left clean for readability. Add recipe button kept as the flat terracotta pill.

- **Send guard** (May 2026): Fixed double-submission bug — a synchronous `sendingRef` lock and `isSending` state now cover the async pre-send gap (conversation create + message save) before the AI SDK `status` transitions from `"ready"`. Loader shows immediately on submit; input stays disabled until the request is fully in-flight.

## V2 — Shipped (May–Jun 2026)

### Cook With What You Have — Shipped (May 2026, #236)
- **Selection mode** on the Pantry surface: "Cook with what you have" toggle enters a checkbox mode on ingredient and kitchenware rows. Kitchenware selection = preferred equipment (preference, not constraint — ADR-0007).
- **CTA adapts** to selection shape: "Suggest recipe (N selected)" for ingredients, "Surprise me with [Air fryer]" for equipment-only.
- **Submit flow**: composes a synthetic Mode 3 message ("Suggest recipes using: …"), enters Staging State via `ConversationContext`, navigates to Chat. Chat auto-sends the queued message once `status === "ready"`.
- **Mode 3 prompt**: new section in `CHAT_SYSTEM_PROMPT`. Close Recipe (0–2 Additions, `closeness: "close"`) + Stretch Recipe (3–4 Additions, `closeness: "stretch"`). Additions = items not in pantry; free staples: salt/pepper/oil/water.
- **Recipe cards**: render "Right now" / "Worth a small trip" caption chip when `closeness` is set.
- **More ideas button**: shown below Cook-With response pairs; sends "More ideas — different from these" in same Conversation.
- **Chat staging chip**: "🥬 Cook with what I have →" routes to Pantry and auto-enters selection mode via `?selectionMode=1` URL param.
- Key decisions: ADR-0006 (reuses `/api/chat`, not a dedicated route), ADR-0007 (selection = emphasis not constraint).
- **Selection defaults to all-checked** (Jun 2026): "Cook with what you have" now enters selection mode with the **whole pantry pre-checked**; the user *deselects* what they'd rather skip. A `Clear all` / `Select all` toggle sits in the selection banner (desktop) and mobile header. Submitting with everything still checked collapses to the relaxed whole-pantry request (`buildCookWithMessage([], [])`, "no featured ingredients") — a Featured Selection only forms for a proper subset, preserving ADR-0007. CTA reads "Cook with everything" when all are checked. Replaces the abandoned split-pill / tap-to-feature affordance exploration. CONTEXT.md "Featured Selection" sharpened with the all==none equivalence.

### Recipe Tweak UI (Direction C) — Shipped May 2026
- **5-state interactive flow** inside `RecipeDisplay`: resting → open → streaming → preview → saved.
- **State 1 (Resting)**: inline dashed-border "Want Ah Mah to tweak this?" button below the Ah Mah note section.
- **State 2 (Open)**: fixed bottom bar with granny avatar, Ah Mah voice prompt, 4 quick-tweak chips, text input + send button, ✕ dismiss.
- **State 3 (Working)**: calls `POST /api/recipe/[id]/tweak`, which returns a **Tweak Patch** (only the changed fields, not the whole recipe — ADR-0010); client merges via `applyTweakPatch`. The wait (~10–15s, a single buffered call) shows a **perceived-wait** affordance (`TweakProgress`): quiet loading dots for the first ~2s, then shuffled, cycling Ah-Mah voice-lines ("Reading your recipe again…", "Having a little taste as she goes…", …) beside the granny icon. The result landing is the real completion signal. Sub-2s tweaks show only dots, so the lines never flash. There's no token-level signal to stream, so there's no progress bar — see the loader note below.
- **State 4 (Preview)**: response done; bottom bar shows Ah Mah message + Save / Try a different tweak / Discard actions. Changed ingredients and steps get an amber highlight (`bg-amber-200/70` + amber ring), and the first changed row scrolls into view with a one-shot pulse (`tweak-pulse`) to lead the eye left.
- **State 5 (Saved)**: calls `PATCH /api/recipe/[id]` to persist; sonner success toast; "Tweak again" button replaces resting-state button; "tweaked just now" badge in Ah Mah note.
- Tweak state fully contained in `RecipeDisplay` (no page-level changes needed). `userId` sourced from `useSessionContext` internally.

### Progressive reveal of streaming recipe/suggestions blocks — Shipped Jun 2026
- **Problem**: structured replies are fenced JSON (` ```recipe ` / ` ```suggestions `). A preloader made the wait feel long; raw streaming leaked unformatted JSON.
- **Partial-parse render path**: `parsePartialBlock` (AI SDK `parsePartialJson`) repairs the in-flight JSON each frame; `getOpenFence` locates the last unclosed fence (handles Mode 3's close+stretch pair). Centralized in one `useEffect` in `MessageList` so loader and block share state without flicker.
- **Reveal grain**: completed array elements pop in whole (the trailing in-progress element is trimmed); scalar strings typewriter. On `failed-parse` the last good render is held.
- **One render path**: `RecipeLetter` and `SuggestionsBlock` take an `isStreaming` prop — interactivity (Save, Cook, servings stepper, pantry pills, suggestion CTA) is gated off while streaming; the same component serves the live and final view. Streaming uses a `-streaming` React key, so the final block remounts with correct `baseServings`.
- **Loader bridges the gap**: `shouldShowLoader` keeps `ChatLoader` visible until prose, a completed block, or the first parseable streaming field exists — no raw-JSON flash.
- **Shared dots→voice-lines loader** (Jun 2026): the chat (`ChatLoader`) and Tweak Bench (`TweakProgress`) share one loader vocabulary in `src/features/shared/components/loaders/` — `usePhaseAfter` (timed phase flip), `useCyclingIndex` + `CyclingVoiceLines`/`VoiceLine` (cross-fading Ah-Mah voice-lines), `shuffle`, and `LoadingDots`. Both show dots first, then — after **~2s** — an honest **indeterminate** indicator (chat's spinner ring / the Tweak Bench granny icon) beside shuffled, looping Ah-Mah voice-lines. **No progress bar**: there's no real signal to track — the tweak is a single buffered call (ADR-0010) and the chat loader only exists in the pre-render gap before the progressive recipe reveal (ADR-0009) takes over, so any bar would be a fake linear fill. Earlier iterations (segmented fill-and-hold, continuous easing bar) were dropped for this reason; the voice-lines shuffle per wait and cycle so a long wait stays lively instead of freezing.
- **Retired** `SkeletonRecipeCard`, `WritingItOut`, and `ShimmerWord` (dead after skeleton removal). See ADR-0009.

- **Mobile nav unified onto one collapsible drawer** (Jun 2026): mobile (`<lg`) previously had two competing nav surfaces — a top section tab strip (`page.tsx`'s `TabsList`) plus a chat-only conversations drawer. Both are gone. The desktop `AppSidebar`'s inner content is now a shared `SidebarContent` (brand + section nav + `Conversations` + footer) rendered by both the desktop `<aside>` and a mobile `Sheet`. A new section-aware `MobileTopBar` (mounted in `layout.tsx`) owns the drawer: ☰ on the left opens the full sidebar mirror; the center shows the active conversation title on Chat (with inline rename + the rename/delete `ConversationItemMenu`) and the section name ("Pantry"/"Cookbook") elsewhere. Auth + About now live only in the drawer footer. The `<Tabs>` container stays (it still switches the content panels); only the visible strip was dropped. `ConversationsMobileSheet` deleted. Glossary: "tab" sharpened to **Section** in `CONTEXT.md` (there is no visible tab strip anymore; the Radix Tabs are an implementation detail). Desktop unchanged.

### Market Tips — Shipped (Jun 2026)
- **Ah Mah's picking wisdom**: practical hints for selecting quality produce at market (e.g., "soft, fragrant, heavy for its size") shown on the recipe shortfall card. Tips are LLM-generated via `gpt-5-mini` and cached in a shared, user-agnostic `MarketTip` table keyed by canonical item name (see CONTEXT.md "Market Tip" glossary and [ADR-0013](./adr/0013-market-tips-are-llm-generated-and-shared.md)).
- **Smart caching**: tips are fetched server-side via new route `POST /api/market-tip`; non-pickable staples (Carbs, Condiments, Spice categories) and pre-cached misses are negative-cached (empty tip) so they never re-hit the model. Batched generation reduces per-request LLM calls.
- **Client hook**: `useMarketTips(items)` returns a `Record<canonicalKey, string>` of tips; client merges tips into the Shortfall card UI and folds them into the "Copy shopping list" output for offline reference.
- **Shortfall card decoupled from the ≥50% gate** (Jun 2026): the card was doing two jobs — encouragement ("You're almost there") and utility (shopping list + tips) — and the inherited ≥50%-in-pantry gate hid the *tool* on sparse pantries (e.g. a 3/15 recipe showed nothing, so its tips were invisible). The card now renders whenever the user owns **≥1** ingredient and is missing **≥1**; the ≥50% ratio only switches the *heading copy* ("You're almost there" near completion vs a neutral "Shopping list" when farther off). Owning *none* still suppresses it (it would just restate the recipe). This realises ADR-0013's flagged "gate is narrow" consequence; see the new "Shortfall card" glossary term in CONTEXT.md.
- **Tips shown inline, not click-to-reveal** (Jun 2026): the original design hid each tip behind a dotted-underline click and revealed a single floating "Ah Mah says: …" line below the comma list — undiscoverable, one-at-a-time, and ambiguous about which item it described. The shortfall list is now a one-item-per-line "margin notes" layout: each pickable item shows Ah Mah's tip directly beneath it (indented, em-dashed, italic), always visible. Removed the `revealedKey` toggle state.

### Vigilant pantry capture (gated pre-extraction) — Shipped Jun 2026
- **Problem**: `gpt-4.1-mini` unreliably ignored the prompt rule to `addInventoryItem` before suggesting. "I have chicken broth, what can I cook?" often returned a recipe without ever adding the broth.
- **Gated pre-extraction**: `captureMentionedInventory` (`src/lib/chat/captureInventory.ts`) runs server-side in `/api/chat` *before* `streamText`, so a subsequent `getInventory` already reflects mentioned items. A cheap regex gate (`mentionsPossession`) skips the extraction LLM call for pure questions; on a hit, a `temperature: 0` `generateObject` extracts only genuinely-possessed items (no negated/wished-for/dish-name items, no bare "with X" requests) and upserts them via `addInventoryItem` (idempotent on `userId_name_type`).
- **Fallback preserved**: the chat model's `addInventoryItem` tool still runs for phrasings the gate misses. Extraction failures are swallowed (non-fatal) — the tool remains the safety net.
- **Suggest from a sparse pantry**: `CHAT_SYSTEM_PROMPT` now only asks "what else do you have?" on a *completely empty* pantry. With even one item ("I have tomato puree, what can I cook?"), it emits a `suggestions` block built around it instead of stalling for more.
- **"Use up / finish / leftover" = suggestion ask**: those phrasings are an implicit recipe request. The gate (`POSSESSION_PATTERNS`) and extractor treat them as possession (the user has the item), and a routing row + a "promise ⇒ must emit the block" rule make the model emit a `suggestions` block rather than just acknowledging and asking what else they have.
- **Helper**: `latestUserText`/`messageText` (`src/lib/chat/messageText.ts`) pull the latest user message's text parts out of `UIMessage[]`.
- **Surfacing captured items to the UI**: captured items fire no `tool-addInventoryItem` part, so the client's tool-call handler would miss them (no toast, stale pantry). The route wraps the model stream in `createUIMessageStream` and writes a `data-capturedInventory` part listing the names; `useChatSession.onFinish` toasts + `mutate`s `/api/inventory` on it, mirroring the tool path.

### Recipe is a document — Shipped Jun 2026 (#267–#269)
- **Framing**: the recipe is a reference artifact you read, scale, and paste — exempt from chat brevity. Depth lives in the recipe, not the conversation. See [ADR-0011](./adr/0011-recipe-is-a-document.md).
- **Recipe Notes (#267)**: new `notes?: string[]` whole-dish asides (make-ahead, storage, serving, pantry-*independent* fallbacks) end-to-end — `RecipeBlockSchema` + `Recipe` type + converters + `TweakPatchSchema` + Prisma column, rendered as a Notes section on both `RecipeLetter` and `RecipeDisplay`. Notes ride through a tweak untouched but are **not tweakable** in v1 (decision: #270 — a `notes_updated` change-kind is deferred until there's demand).
- **Earned step depth (#268)**: prompt-only — `steps[].body` carries the *why*, sensory doneness cues, and failure-mode cautions only on pivotal steps, under a soft length cap; trivial steps stay short. Step bodies reference ingredients by name only — no absolute quantities (they'd fight the servings stepper).
- **Copy recipe (#269)**: one shared `formatRecipeAsText(recipe, servings)` (`src/features/Recipe`) → plain text, CAPS headers, `•`/numbered lists, no markdown (survives WhatsApp/Notes). Amounts scale to the displayed servings via `scaleAmount`; amountless rows read "to taste"; sections render only when present; a "— from Ah Mah" footer. Surfaced as a **Copy recipe** button on `RecipeDisplay` (header — servings lifted out of `RecipeBody` so the header reads the current count) and in the `RecipeLetter` action bar. Excludes pantry state ("10/12 in your pantry"). **Copy shopping list stays separate** — two distinct copy intents, never collapsed into a bare "Copy".

### Shopping List groups by Aisle — Shipped Jun 2026

- **The list now reads as a market walk, not a flat pile.** Items are bucketed under fixed aisle subheadings — **Produce · Meat & Seafood · Rice & Noodles · Sauces & Seasoning · Other** — in walk order, empty aisles hidden, bought items struck in place. See [ADR-0016](./adr/0016-shopping-list-groups-by-aisle.md), [`CONTEXT.md` → Aisle](../CONTEXT.md#aisle).
- **Aisle is a *shopping* taxonomy, deliberately distinct from the Pantry's *storage* category enum** (which has no Fruit). A recipe item already carries a Pantry-enum category → mapped deterministically by `toAisle` (`Vegetable→Produce`, `Protein→Meat & Seafood`, …) with **no model call**. A typed-in item arrives with `category: null`, rests in **Other**, and is classified asynchronously.
- **Classification is client-orchestrated, mirroring the Market Tip fetch** — the add never blocks. After the list loads, `ShoppingList` POSTs `/api/shopping-list/classify` for the user's pending rows; the route's `classifyPendingAisles` service runs one `gpt-5-mini` call (`classifyAisles`) and persists the aisle onto the existing `category` column, then the list revalidates and rows **shift** out of Other. No schema change.
- **Changes**: new `src/lib/shoppingList/aisle.ts` (`AISLE_ORDER`, `toAisle`, `groupByAisle`) + `classify.ts`; `classifyPendingAisles` service; `/api/shopping-list/classify` route; `ShoppingList.tsx` grouped rendering + one-shot classify effect.

### Shopping List promoted to its own Section — Shipped Jun 2026

- **The Have/Need tab strip is gone.** The standing Shopping List, briefly the Pantry's **Need** tab, is now its own top-level **Section** in the nav: **Chat · Pantry · Shopping List · Cookbook** (basket icon, sat next to Pantry so the inverse-pair stays adjacent). Pantry reverts to meaning **stock only**. See [ADR-0015](./adr/0015-shopping-list-is-its-own-section.md) (amends ADR-0014 §2/§6).
- **Why**: the Have/Need strip was the app's *only* visible tab strip, contradicting the "destinations come from the nav, never from tabs" rule (`CONTEXT.md` → Section), and its folder-tab styling (`bg-chat`) never matched the Pantry surface (`bg-muted`) — so it read as orphaned. The fix was conceptual, not cosmetic: promote, don't restyle.
- **Changes**: 4th `NAV_ITEMS` entry + `ShoppingListIcon` in `SidebarContent`; `SECTION_LABELS.shopping` in `MobileTopBar`; `"shopping"` added to `useActiveTab`; 4th `TabsContent` (`?tab=shopping`) renders `<ShoppingList />` in `page.tsx`; `InventoryWrapper` strips its `Tabs` and renders `<Inventory />` directly. **Zero data change** — exactly as ADR-0014 §6 predicted. `Have`/`Need` retired as user-facing terms.

### Shopping List spine — the Pantry "Need" tab — Shipped Jun 2026 (#314)

- **Standing, quantity-less Shopping List** introduced as the Pantry **Need** tab (Have/Need faces), per [ADR-0014](./adr/0014-shopping-list-is-standing-and-quantityless.md) and [PRD #313](https://github.com/alantay/ask-ah-mah/issues/313). This slice is the spine — type-in, persist, view; lifecycle (✓/✕/clear), Need-tab Market Tips, and the recipe-card on-ramp + Shortfall-card retirement are the follow-up slices (#315–#318).
- **Schema**: new `ShoppingListItem` (`id`, `userId`, `key`, `name`, `category?`, `bought`, `createdAt`), unique on `(userId, key)`, no recipe FK (recipe-independent). Migration `20260624000000_add_shopping_list_items`.
- **Identity is a canonical shopping key** (`src/lib/shoppingList/canonicalKey.ts`): strips leading quantities/units, drops prep adjectives, lowercases, and singularizes, so a recipe's "2 apples, sliced" and a typed-in "apple"/"Apples" all collapse onto one row. Richer than `canonicalTipKey` (which only lowercases/trims) — required by ADR-0014 §3's merge example.
- **Deep module** `src/lib/shoppingList/` (`add` with dedupe/merge + no-op-on-existing, `get` oldest-first) behind a thin `/api/shopping-list` route (GET `?userId=` / POST items; 400 on malformed payload, 500 on failure). Mirrors the inventory service + route.
- **UI**: self-contained `src/features/ShoppingList/` Need-tab component (SWR add-box + name list + empty-state guidance), mounted inside `InventoryWrapper` via a Have/Need `Tabs` switch so it can be promoted to its own Section later with no data change.

### Shopping List lifecycle — ✓ / ✕ / clear bought — Shipped Jun 2026 (#315)

- **Three lifecycle actions** on each Need-tab row, per ADR-0014: **✓ bought** (toggle — strike-through-and-keep, never removed), **✕ changed-mind** (hard delete), and a bulk **Clear bought** button that appears only while at least one row is bought.
- **Service** (`src/lib/shoppingList/`): `setBought` / `removeShoppingListItem` / `clearBoughtItems`, all `userId`-scoped via `updateMany`/`deleteMany` so a row can only be touched by its owner. **Route** grows `PATCH` (`{id, bought}` → setBought) and `DELETE` (`{id}` → remove, or `{clearBought:true}` → clear), both 400 on a missing `userId` or an absent target.
- **Bought is not add-to-pantry** — checking a row only flips its `bought` flag; moving an item into the pantry stays a separate, explicit opt-in (no inventory write on the bought path).

### Shopping List Market Tips — picking wisdom on the Need tab — Shipped Jun 2026 (#316)

- **Each Need-tab row carries Ah Mah's picking tip** at the moment of buying, rendered as an italic em-dash sub-line under the item name (hidden once the row is bought). Same presentation as the shortfall card's tips.
- **Pure reuse, no engine change** — the existing `useMarketTips` hook + `src/lib/marketTips/` (`pickable.ts`, `canonicalKey.ts`) and `/api/market-tip` are reused as-is. Items map to `{ name, category? }`; because category is optional the model decides pickability, so typed-in items (apples, tomatoes) get tips and staples (salt, sugar, flour) get none.
- **`useMarketTips` promoted to `src/hooks/`** (from `src/features/Chat/components/recipe/`): it's a pure data hook with no Chat-specific logic and is now shared by both the shortfall card and the Need tab, so it lives alongside `useSession`/`useActiveTab` — killing the cross-feature import.

### Shopping List tips toggle + kitchen-domain relevance gate — Shipped Jun 2026 (#330)

- **Picking tips are now toggleable.** The Shopping List shows a small on/off switch (`TipsToggle`, in `src/features/shared/components/`); default **ON** so existing behaviour is preserved. The preference persists in `localStorage` (`ah-mah-market-tips`) via the new `useTipsPreference(key, default)` hook. Toggling off doesn't just hide the tips — `useMarketTips(items, enabled)` nulls its SWR key, so **no `/api/market-tip` request is made** when off.
- **Relevance gate closes a live bug.** Non-kitchen items (e.g. a "climbing harness") were getting picking tips, because the category pre-filter passes uncategorised items to the model and the prompt had no exclusion. The shared `KITCHEN_DOMAIN_RULE` (`src/lib/marketTips/relevance.ts`) now instructs the model to return `""` for anything not used in cooking or eating (food, drink, fresh groceries, cooking equipment in; sports gear, vehicles, clothing, toiletries out). Empty results are negative-cached as before, so out-of-domain items are never re-asked. The rule is shared so the upcoming pantry Storage Tips generator (#329) reuses the same gate. See [ADR-0017](./adr/0017-storage-tips-clear-adr-0008.md).

### Pantry Storage Tips — "keep it well at home" (#329)

- **Each pantry item can show a Storage Tip** — Ah Mah's advice on keeping it well at home: food longevity ("cool, dark place — never the fridge") and equipment care ("dry the wok on the heat, wipe a little oil"). Rendered as the same italic em-dash sub-line under the item name used by Market Tips. Distinct concept from a Market Tip (*pick it at the shop* vs *keep it at home*) — see [ADR-0017](./adr/0017-storage-tips-clear-adr-0008.md) and the **Storage Tip** glossary term.
- **Own shared corpus.** A new `StorageTip` table mirrors `MarketTip` (canonical-name `@id`, no `userId`, empty = negative-cache marker) — a separate table because the same item carries distinct pick/keep tips that one single-column key can't hold. Served via `POST /api/storage-tip` (`gpt-5-mini`) + the `useStorageTips(items, enabled)` hook. Unlike Market Tips there's no pickable pre-filter — a staple (flour) still has a keep tip and equipment has a care tip — so relevance is enforced purely by the shared `KITCHEN_DOMAIN_RULE` at the model, with empties negative-cached.
- **Opt-in toggle, reused from #330.** A `TipsToggle` in the Pantry (default **OFF**, persisted in `localStorage` as `ah-mah-storage-tips`) independent of the Shopping List's Market Tips toggle. Off (and selection mode) nulls the SWR key, so no `/api/storage-tip` call is made. Tips are hidden during Cook-With selection to keep the checkbox UI clean.

### Recipe on-ramp + Shortfall card retired — Shipped Jun 2026 (#317)

- **Recipe cart now feeds the Shopping List, not the pantry.** The ingredient row's cart button (`addToPantry` → `addToShoppingList`) POSTs the missing item to `/api/shopping-list` and confirms ("X — on the list."); the upsert makes re-adding an already-listed item a no-op. It revalidates the Need-tab SWR key so the list updates live.
- **Shortfall card deleted.** The in-chat block that re-listed missing items with inline Market Tips + copy-shopping-list is gone, per [ADR-0014](./adr/0014-shopping-list-is-standing-and-quantityless.md) / CONTEXT's "Shortfall card (Formerly)". The recipe now shows one clean ingredient list in one voice — the substitution `note` — and Market Tips no longer appear in chat (they live only on the Need tab).
- **Substitutions on-ramp relocated to the action bar.** "Ask Ah Mah for substitutions →" survives the card's removal: it now sits in the recipe action bar, shown when the user is tracking a pantry and is short an ingredient.
- **Dead code removed:** `src/lib/marketTips/formatShoppingList.ts` (+ test) — it formatted amounts/units for the shortfall's clipboard copy, obsolete under the quantity-less standing list and orphaned once the card was deleted.

### Recipe magic links — public share-by-link — Shipped Jun 2026 (#325)

- **Share a recipe with anyone, no account.** A new Share button in the `RecipeDisplay` action bar (owner-only) mints a public link and copies it (`https://<host>/r/<token>`). Minting is **on-demand and idempotent**: `POST /api/recipe/[id]/share` (owner-scoped) generates a short token the first time and returns the same one thereafter, so a link already shared keeps working.
- **Token model**: `Recipe.shareToken String? @unique` (nullable, additive migration `20260627120000_add_recipe_share_token`). Token is 72 bits of `randomBytes(9).base64url` — short and unguessable. A recipe with no token has never been shared.
- **Public route `/r/[token]`** is a server component outside the app shell, resolving the recipe by **token alone — never `userId`** (`getRecipeByShareToken`), so it's readable by anyone yet only ever exposes that one recipe. Unknown token → `notFound()`. `generateMetadata` emits OG/Twitter tags (name, description, image) for rich link unfurls.
- **Read-only reuse**: `RecipeDisplay` gained a `readOnly` prop that hides every owner action (Share, Tweak, the Tweak bench, Start cooking, Back) but keeps **Copy recipe** — useful for whoever opens the link. The public page wraps it (`PublicRecipeView`) with a slim "Ask Ah Mah" brand bar linking home.
- **App-shell extraction**: the sidebar + mobile top bar moved from the root layout into a new `(app)` route group (`src/app/(app)/layout.tsx`); the root layout is now just fonts + providers + `Toaster`. Existing routes (`/`, `/recipe/[id]`) moved into the group — URLs unchanged. This is what lets `/r/[token]` render clean, without the app's nav leaking into a public link.

### Anonymous-session identity foundation — In progress (#340)

- **Every visitor now has a real session.** The client-generated `localStorage["ask-ah-mah-session"]` id is gone. The better-auth `anonymous()` plugin mints an unforgeable anonymous session on first load (`useSession` calls `signIn.anonymous()` when there's no session); signed-in users still use their Google session. `userId` is always `session.user.id`, and `isAuthenticated` now means non-anonymous (`!user.isAnonymous`).
- **Server is the source of truth for identity.** New helper `getSessionUserId(req)` (`src/lib/session.ts`) resolves the caller from the verified session cookie via `auth.api.getSession`, returning the id or `null` (routes map that to a 401 via `unauthorized()`). This is the primitive the route-lockdown slices (#341–#345) build on — routes stop trusting a `userId` from the request.
- **Schema**: `User.isAnonymous Boolean?` (additive migration `20260629000000_add_user_is_anonymous`). New anonymous users get their starter pantry seeded.
- **Not yet wired**: conversation routes still read `userId` from the request (#344), share-token mint trust is #345, and guest→Google data migration on link is #346.

### Recipe routes locked down — Shipped (#341)

- **Recipe routes derive identity from the session, never the request.** `GET/POST/DELETE /api/recipe`, `PATCH /api/recipe/[id]`, and `POST /api/recipe/[id]/tweak` now call `getSessionUserId(req)` and return `unauthorized()` (401) when there's no valid session. A `userId` in the query string or body is ignored entirely — an attacker can no longer read or mutate another user's cookbook by supplying a foreign id.
- **Clients stopped sending `userId` in request bodies** (RecipeList delete, AddRecipeModal save, MessageList save, RecipeDisplay save, TweakBench tweak). SWR GET keys keep `?userId=` purely as a client-side cache key / fetch gate; the server disregards it. The now-unused `userId` prop was dropped from `TweakBench`.
- **Tests** cover cross-user access being denied (query/body-supplied foreign id resolves to the session user) and 401s for unauthenticated callers, mocking `getSessionUserId`.
- **Out of scope here**: `POST /api/recipe/[id]/share` still trusts a body `userId` — hardened separately in #345.

### Pantry (inventory) routes locked down — Shipped (#342)

- **Inventory routes derive identity from the session.** `GET/POST/DELETE /api/inventory`, `POST /api/inventory/parse`, and `POST /api/inventory/seed` call `getSessionUserId(req)` and return `unauthorized()` (401) when there's no valid session. A `userId` in the query/body is ignored, so a caller can't read or mutate another user's pantry by supplying a foreign id.
- **Clients stopped sending `userId` in request bodies** (Inventory add/parse + remove). SWR GET keys keep `?userId=` only as a client-side cache key. The new-anonymous-user pantry seed (`useSession`) now posts to `/api/inventory/seed` with no body — the session cookie set by `signIn.anonymous()` is the identity.
- **Tests** cover cross-user access denial (query/body foreign id resolves to the session user) and 401s for unauthenticated callers, mocking `getSessionUserId`.

### Shopping-list routes locked down — Shipped (#343)

- **Shopping-list routes derive identity from the session.** `GET/POST/PATCH/DELETE /api/shopping-list` and `POST /api/shopping-list/classify` call `getSessionUserId(req)` and return `unauthorized()` (401) when there's no valid session. A `userId` in the query/body is ignored (the POST passes the full payload through `AddShoppingListItemsSchema.safeParse`, and `z.object` strips unknown keys), so a caller can't read or mutate another user's list by supplying a foreign id.
- **Clients stopped sending `userId` in request bodies** (`ShoppingList` add/toggle/remove/clear + classify; `RecipeLetter` cart add). SWR GET/mutate keys keep `?userId=` only as a client-side cache key. The classify fetch now sends no body — the session cookie is the identity.
- **Tests** cover cross-user access denial (body foreign id resolves to the session user) and 401s for unauthenticated callers, mocking `getSessionUserId`.

## Design system

The two recipe surfaces — `RecipeLetter` (chat) and `RecipeDisplay` (cookbook) — were drifting because each hand-rolled the same primitives. A design system is now the north star: shared atoms stop drift, and every surface gets tweaked incrementally so it "looks like it belongs". See the spec at `docs/superpowers/specs/2026-06-20-recipe-design-system-design.md` and the issue tracker (#277–#285).

- **Shared recipe atoms (#277)**: six drift-prone primitives extracted to `src/features/shared/components/recipe/` (barrel-exported) and consumed by both surfaces:
  - `Eyebrow` — uppercase mono-spaced section label (canonical `tracking-[0.16em]`).
  - `SectionHeading` — serif `<h2>` ("What to gather", "Method", "Notes"); margins via `className`.
  - `DottedList` — prep / notes bullet list, canonical aligned `·` gutter.
  - `StepTip` — Ah Mah's per-step ochre left-bar aside, prefixed with an em-dash.
  - `StepItem` — one numbered step in two registers: `"stamp"` (chat ink-stamp badge) or `"quiet"` (cookbook mono `1.`). Wrapper is configurable via `as` and forwards extra props/`className`, so the cookbook renders diff-aware `<li>` rows (`data-tweak-row`, highlight classes) through the same atom.
  - `StepList` — vertical run of `StepItem`s for the simple (chat) case.
  - New `--callout` token (`oklch(0.65 0.10 60)`, warm ochre) backs `StepTip`'s accent bar, replacing the inline `oklch(...)` literal both surfaces duplicated.

- **Design-system guide + audit (#278–#279)**: `docs/design-system.md` is the written north star — voice, named type scale, semantic color roles, rhythm, the two registers, and the six atoms — with a per-surface gap audit driving the alignment issues.
- **Per-surface alignment (#280–#284)**: each surface tweaked until it "belongs" — swap raw `text-[Npx]` for named scale tokens, raw `oklch(...)` for semantic tokens, and inline eyebrows for the `Eyebrow` atom.
  - `Conversations` (#280): header → `text-heading`, empty state → `font-display`.
  - `RecipeList` (#281): page header, cards, sidebar, and Add-recipe modal mapped to the scale; sidebar category labels now use the `Eyebrow` atom. New `--danger` / `--danger-border` / `--danger-tint` tokens (hue 27, light + dark) replace the modal's inline error-state `oklch(...)` literals.
  - `Inventory` (#282): page eyebrow → `Eyebrow` atom; title → `text-display`; bodies/empty states → `text-emphasis`; buttons + selection banner → `text-dense`; category counts + item quantities → `text-micro`; pantry item names → `text-emphasis`.
  - `Recipe` / `CookingMode` (#283): step counter → `text-micro`; step body → `text-xl`; tip bar → `border-callout`; servings stepper readout → `text-emphasis`. New `--jade-deep` token (light + dark) replaces the inline `oklch(0.35 0.10 168)` border + hard-shadow on the cooking-mode "Done" button.
  - `Auth` / `SignInDialog` (#284): trigger 1px hard-shadow → `var(--border-soft)` token (was an inline `oklch(...)` literal); dialog title + description switched to `font-display` (serif brand voice) from the shadcn default sans. `AuthButton` was already clean.
- **Catalog published to Claude Design (#285)**: the six atoms + their tokens, fonts, and guidelines are synced to a claude.ai/design project ("Ask Ah Mah Design System") via `/design-sync`, so the design agent builds on-brand with the repo's real components. Sync inputs live under `.design-sync/` (`config.json`, `ds-tailwind-input.css`, `previews/`, `NOTES.md`) and a gitignored root `ds-entry.ts` barrel; CSS is compiled from `globals.css` via Tailwind CLI at sync time. This closes the design-system epic (#277–#285).

- **Catalog expanded to a full design system (Jun 2026)**: grew the synced catalog from the 6 recipe atoms to **18 components across three groups** so the design agent (and people) have enough to compose whole new on-brand pages, not just recipe surfaces:
  - **Foundations (`design-system` group, 4)**: `ColorTokens`, `TypeScale`, `Typefaces`, `RadiusScale` — pure token-specimen showcase components in `src/features/shared/components/design-system/` (inline `var(--token)` styles). They exist because the converter has **no component-less card path**: a browsable card requires a real bundled component, so foundations ship as tiny showcase components.
  - **Primitives (`general` group, 8)**: the Core 8 shadcn primitives — Button, Badge, Input, Label, Card, Dialog, Select, Tabs — carded from `src/components/ui/`. Compound primitives (Card/Dialog/Select/Tabs) export **all** their subcomponents to the bundle but card **only the root** (one card per primitive). They land in group "general" because both `components/` and `ui/` are generic path segments and there's no config-only group override; renaming would need a `@category` JSDoc tag per file (deferred — not worth coupling app code to the sync tool).
  - **Guidance**: `docs/design-system.md` rewritten into a canonical structure (Principles → Foundations → Components → Patterns, including a "compose a new page" walkthrough) and ships as the catalog's guidelines.
  - All 18 components build, validate clean, and render correctly (18/18); every preview cell graded `good`. See `.design-sync/NOTES.md` for the full handoff (grouping, compound pattern, off-script componentSrcMap-vs-exports).
- **CTA contrast fix (Jun 2026, ADR-0012)**: the primary CTA ("Cook with what you have") rendered warm-cream text on terracotta `--primary` at a muddy ~4.5:1. `--primary` can't exceed ~4.95:1 even with pure white, so `cta`/`ctaDeep` now sit on `--primary-deep` with white text (~7.4:1); a new `--primary-deeper` token carries the stamp shadow, and `--primary-foreground` was crispened to a de-warmed near-white (lifts every other `bg-primary` text to ~4.81:1). Brand `--primary` is unchanged. Also fixed the latent cause: `tailwind-merge` didn't recognise our named font-size tokens (`text-dense`, `text-emphasis`, …), so it collided them with `text-*` colour classes and silently dropped the colour when a `cta` Button was given a size className (e.g. the pantry CTA's `text-dense`) — the button had been rendering dark `text-foreground` regardless of token. `cn()` now registers those tokens as font-sizes via `extendTailwindMerge`, so colour and size are independent everywhere.
- **First-run chat hero (Jun 2026)**: the empty chat used to top-align the greeting and pin the input to the bottom, leaving a ~573px dead void (≈64% of the chat height) on desktop — the first thing every user saw. The empty state is now a composed, vertically-centred hero (`src/features/Chat/components/ChatEmptyState.tsx`): a stamped Ah Mah mark, the greeting, three tappable opener cards (echoing the initial-message bullets; tapping sends the example straight to Ah Mah), and the quick-start chips. Once the first message is sent the normal thread takes over and the greeting reappears as Ah Mah's opening bubble, so nothing is lost. New shared atom `Stamp` (`src/features/shared/components/Stamp.tsx`) factors out the kopitiam ink-stamp "chop" motif (`rounded-[50%_50%_50%_8px] -rotate-3`, paper/primary tones, content counter-rotated upright) previously hand-rolled in `StepItem` and the brand mark. Not yet carded to Claude Design (would need a `componentSrcMap` entry + re-sync).

## Next up

### Shopping List — remaining slices (ADR-0014, PRD #313)
The spine (#314), lifecycle (#315), Market Tips (#316), and the recipe on-ramp + Shortfall retirement (#317) shipped above.
- [x] **#318 HITL design review**: Playwright screenshots of the list states + post-removal recipe card surfaced that the **Have/Need tab strip itself** was the wrong pattern (the app's only visible tab strip). Resolved by promoting the Shopping List to its own Section — [ADR-0015](./adr/0015-shopping-list-is-its-own-section.md), shipped above.

## V3+ — Ideas (KIV)
- [ ] Aging / "going bad soon" alerts (deferred — app cannot reliably know freshness; see ADR-0008).
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
- **Foreign-ingredient `type` misclassification**: romanized ingredient names the model doesn't recognize as food (e.g. "gao li cai" = cabbage) can be stored with `type: "kitchenware"`, forcing a later self-correction that wastes a turn. Separate from chat routing; needs its own fix + eval cases. Deferred.

## Decisions

- **`shelfLife` removed** (May 2026) — no freshness/urgency UI; the app can't reliably know what's gone bad. Full rationale → [ADR-0008](./adr/0008-no-shelf-life-ui.md).
- **Optional quantity = "unlimited"**: unset `quantity` means the item has no limit. Avoids forcing a count on pantry staples where "do I have enough?" is never the question.
- **Structured-on-save over streaming extraction**: metadata (`baseServings`, `ingredients`, `description`, `totalTimeMinutes`) is extracted when the user saves a recipe, not streamed inline. Simpler streaming path; extraction failures degrade gracefully without breaking the chat.
- **Strict-unit shortfall first; cross-unit conversion deferred**: `unit` must match exactly for shortfall calculation. Cross-unit conversion (e.g. `g` vs `kg`) is a V3+ problem — the complexity isn't justified until users actually hit it.
- ~~**No staple/perishable split; `shelfLife` enum instead**~~ *(superseded by ADR-0008 — `shelfLife` removed; see "shelfLife removed" entry above)*
- **Description generated post-hoc, not inline in assistant response**: `processRecipe` extracts description on save. Keeping the assistant response format simple reduces prompt complexity and lets the extraction be richer than what would fit in a streamed recipe block.
- ~~**Aging alerts deferred from V1**: `shelfLife` + `dateAdded` are stored, but alert UI is V3+~~ *(superseded by ADR-0008 — `shelfLife` removed; `dateAdded` retained)*
- **`userId` retained on `Message` rows** even though `conversationId` is now the primary scope. Simplifies raw queries and avoids joins for user-scoped cleanup jobs.
- **`prisma migrate deploy` over `db push`** for the conversations migration: `db push` blocks on the `NOT NULL` backfill step in `20260504000000_add_conversations`.
- **PantryDrawer absolute overlay over reflow**: pantry opens as a right-edge overlay so chat width stays stable. Tab stays mounted so the right edge doesn't jump on open/close.
- **Horizontal-scroll chip rail over facet sheets (cookbook)**: surfaces all tags at a glance; facet sheets added taps and hid options.
- **Cookbook strips pantry awareness**: `RecipeDisplay` is storage, not meal planning. HAVE/NEED badges belong in the chat-inline `RecipeLetter` only.
- **Tweak change `ref` is a non-fatal presentational hint** (Jun 2026): A tweak's `changes[].ref` only drives row highlighting for ingredient/step changes (prep/recipe-level changes aren't highlighted). The model sometimes emits unmodeled locators like `ref.type: "prep"`, which previously failed `TweakResponseSchema` and discarded an otherwise-valid recipe ("that tweak came back muddled"). `ref` now parses with `.catch(undefined)` so a malformed locator degrades to no-highlight instead of rejecting the tweak; the prompt also tells the model to omit `ref` for `prep_updated`.
- **Tweak returns a patch, not the whole recipe** (Jun 2026) — only changed fields come back, cutting the full-recipe echo that made one-line edits wait ~15s. Full rationale → [ADR-0010](./adr/0010-recipe-tweak-returns-a-patch.md).
- **Decrement-on-cook dropped**: tracking what was cooked, confirming with the user, and decrementing inventory adds a confirmation surface and an "active cooking" state model that's hard to get right. The pantry is whatever the user says it is; nudges live in chat ("I used the last of the eggs"). Removed from the V2 backlog entirely.
- **Chat routing keys off a single "cooking intent?" signal** (Jun 2026): the recurring "ingredient added but no recipe — Ah Mah asks 'want me to suggest?'" bug came from two contradictory prompt rules firing at once. A message like "i want to make something with X, i bought some" hit both *"bought X → do NOT pivot to suggestions"* and *"asks for suggestions → suggest"*; the model split the difference by asking permission. Fix collapses both into one decision in `CHAT_SYSTEM_PROMPT`: **cooking intent present → always produce a `recipe`/`suggestions` block in the same turn, never ask permission**; intent absent (bare "bought salmon") → acknowledge only. A co-occurring "i bought some" no longer suppresses output. "make something with [ingredient]" sits on the Mode-1/Mode-2 line and the model may emit either — both are correct; the regression was the *absence* of a block.
- **Prompt routing guarded by an opt-in live eval, not CI** (Jun 2026): prior fixes to this bug didn't hold because `route.test.ts` mocks `streamText` and can't observe model behavior. `eval/chat-routing.eval.ts` (run via `pnpm test:eval`, `tsx`) hits the real `gpt-4.1-mini` and asserts on **output-mode block presence/absence** (not question marks — granny nudges are fine). Kept out of CI: it costs API calls and is mildly flaky. Carries a TODO for the separate deferred bug — foreign-ingredient `type` misclassification (romanized "gao li cai" stored as kitchenware).
