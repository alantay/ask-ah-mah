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
- **Substitutions nudge now prefills the composer instead of sending (Jul 2026).** Clicking "Ask Ah Mah for substitutions →" previously fired the message immediately, built from the pantry-derived missing list — but the pantry is often inaccurate (item never added, or ran out), so the auto-computed list was frequently wrong with no chance to correct it. The nudge now drops the seed prompt into the existing single-line composer (focused, cursor at end) so the user edits the list freely before sending. Wiring mirrors `onSend`: a new `onDraft` callback threads `Chat → MessageList → RecipeLetter`, and `MessageInput` gained a `seed={ text, nonce }` prop that replaces (never appends to) the composer text on each nonce change. The composer stays single-line; an inline checkbox/replace-with form was considered and parked.
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
- **Guest→Google data migration on link is wired** — see "Guest data follows the account on sign-in" (#346).

### Guest data follows the account on sign-in — Shipped (#346)

- **A cookbook built as a guest is preserved on first Google sign-in.** The `anonymous()` plugin's `onLinkAccount` now calls `migrateGuestData(anonymousUser.user.id, newUser.user.id)` (`src/lib/auth/migrateGuestData.ts`), reassigning the guest's recipes, inventory, shopping-list items, conversations, and messages to the account before better-auth deletes the anonymous user row. Domain models carry a plain `userId` (no FK to `User`), so reassignment is a column update and the user deletion can't cascade the data away.
- **Conflict-safe for the two unique-scoped tables.** `InventoryItem` (`userId,name,type`) and `ShoppingListItem` (`userId,key`) could collide when linking a guest to an already-populated account; a blind reassignment would violate the constraint and fail sign-in. We move only the non-colliding rows and drop the guest's duplicates, letting the destination account's existing row win. The whole migration runs in one `$transaction` — all-or-nothing.
- **Tests** cover reassignment across all five models, the empty-destination path (everything moves), and the collision path (skip + drop) for both unique-scoped tables, plus the same-user no-op.

### Auth origins trusted on Vercel — Shipped (hotfix)

- **Symptom**: in production every session-gated route (conversations, inventory, …) returned 500. Root cause was better-auth rejecting the request — `ERROR [Better Auth]: Invalid origin: https://<deploy>.vercel.app/ for .../sign-in/anonymous`. better-auth trusts only `baseURL`'s origin by default, but Vercel serves each deployment/preview from a *unique* `*.vercel.app` origin, so anonymous sign-in failed and no session was issued. (Not a DB/migration issue — local and prod share the same `db.prisma.io` database and the schema was in sync.)
- **Fix**: `resolveAuthOrigins(env)` (`src/lib/auth/origins.ts`) computes better-auth's `baseURL` + `trustedOrigins` from the environment. `baseURL` stays pinned to a stable origin (non-empty `BETTER_AUTH_URL` → `VERCEL_PROJECT_PRODUCTION_URL` → localhost) so the Google OAuth `redirect_uri` doesn't move between deployments; `trustedOrigins` additionally trusts the **concrete** origins this app serves itself from — the current deployment URL (`VERCEL_URL`, which is exactly the origin each deployment is reached on) and the production domain. No broad `*.vercel.app` wildcard: `trustedOrigins` is a CSRF boundary, and that would trust every Vercel project's origin. No Vercel env changes required — both `VERCEL_URL` and `VERCEL_PROJECT_PRODUCTION_URL` are injected automatically.
- **Tests** (`origins.test.ts`) lock baseURL pinning, deployment-origin trust, the explicit-`BETTER_AUTH_URL` override, the localhost fallback, and de-duplication.

### Auth boilerplate extraction into wrappers — Shipped (#364)

- Extracted repeated auth boilerplate into `withAuth` / `withAuthDynamic` wrappers (`src/lib/withAuth.ts`). All authenticated API routes now use the wrapper — one seam to audit, no per-route auth lines.

### Recipe routes locked down — Shipped (#341)

- **Recipe routes derive identity from the session, never the request.** `GET/POST/DELETE /api/recipe`, `PATCH /api/recipe/[id]`, and `POST /api/recipe/[id]/tweak` now call `getSessionUserId(req)` and return `unauthorized()` (401) when there's no valid session. A `userId` in the query string or body is ignored entirely — an attacker can no longer read or mutate another user's cookbook by supplying a foreign id.
- **Clients stopped sending `userId` in request bodies** (RecipeList delete, AddRecipeModal save, MessageList save, RecipeDisplay save, TweakBench tweak). SWR GET keys keep `?userId=` purely as a client-side cache key / fetch gate; the server disregards it. The now-unused `userId` prop was dropped from `TweakBench`.
- **Tests** cover cross-user access being denied (query/body-supplied foreign id resolves to the session user) and 401s for unauthenticated callers, mocking `getSessionUserId`.
- **Out of scope here**: `POST /api/recipe/[id]/share` was hardened separately in #345.

### Pantry (inventory) routes locked down — Shipped (#342)

- **Inventory routes derive identity from the session.** `GET/POST/DELETE /api/inventory`, `POST /api/inventory/parse`, and `POST /api/inventory/seed` call `getSessionUserId(req)` and return `unauthorized()` (401) when there's no valid session. A `userId` in the query/body is ignored, so a caller can't read or mutate another user's pantry by supplying a foreign id.
- **Clients stopped sending `userId` in request bodies** (Inventory add/parse + remove). SWR GET keys keep `?userId=` only as a client-side cache key. The new-anonymous-user pantry seed (`useSession`) now posts to `/api/inventory/seed` with no body — the session cookie set by `signIn.anonymous()` is the identity.
- **Tests** cover cross-user access denial (query/body foreign id resolves to the session user) and 401s for unauthenticated callers, mocking `getSessionUserId`.

### Shopping-list routes locked down — Shipped (#343)

- **Shopping-list routes derive identity from the session.** `GET/POST/PATCH/DELETE /api/shopping-list` and `POST /api/shopping-list/classify` call `getSessionUserId(req)` and return `unauthorized()` (401) when there's no valid session. A `userId` in the query/body is ignored (the POST passes the full payload through `AddShoppingListItemsSchema.safeParse`, and `z.object` strips unknown keys), so a caller can't read or mutate another user's list by supplying a foreign id.
- **Clients stopped sending `userId` in request bodies** (`ShoppingList` add/toggle/remove/clear + classify; `RecipeLetter` cart add). SWR GET/mutate keys keep `?userId=` only as a client-side cache key. The classify fetch now sends no body — the session cookie is the identity.
- **Tests** cover cross-user access denial (body foreign id resolves to the session user) and 401s for unauthenticated callers, mocking `getSessionUserId`.

### Conversation/message/chat routes locked down — Shipped (#344)

- **Conversation, message, and chat routes derive identity from the session.** `GET/POST /api/conversation`, `PATCH/DELETE /api/conversation/[id]`, `GET/POST /api/message`, and `POST /api/chat` call `getSessionUserId(req)` and return `unauthorized()` (401) when there's no valid session. A `userId` in the query/body is ignored, so a caller can't list, read, or mutate another user's conversations by supplying a foreign id.
- **Ownership is enforced in the service layer, not just at the route** (the new part vs #341–#343): a valid session for user A still can't touch user B's conversation.
  - `getMessages(conversationId, userId)` filters on the conversation relation's `userId`, so a foreign `conversationId` returns an empty history — chat-context loading (`loadConversationContext`) is scoped the same way.
  - `createMessage` rejects (throws `Conversation not found`) when the target conversation exists but is owned by someone else, closing the `connectOrCreate` cross-user write.
  - `renameConversation` / `autoTitleIfNull` scope their writes by `{ id, userId }` (`updateMany` / `findFirst`); a rename aimed at a foreign id matches zero rows and the route maps the thrown `Conversation not found` to a 404 (mirrors `deleteConversation`).
- **Clients stopped sending `userId` in request bodies / query** (`useChatSession` chat transport + message POST + conversation create; `ConversationContext` deletes). SWR keys keep `?userId=` only as a client-side cache key.
- **Tests** cover cross-user denial at both the route and service layers, plus 401s for unauthenticated callers, mocking `getSessionUserId`.

### Share-token mint locked down — Shipped (#345)

- **Minting a share link is owner-only, derived from the session.** `POST /api/recipe/[id]/share` calls `getSessionUserId(req)` and returns `unauthorized()` (401) when there's no session; a `userId` in the body is ignored. `mintShareToken(id, userId)` was already owner-scoped (`findFirst` + compare-and-set `updateMany` both filter on `{ id, userId }`), so a non-owner's mint resolves to "not found" → the route returns 404. The client (`RecipeDisplay` share button) stopped sending `userId` — the session cookie is the identity.
- **The public read path stays open by design.** `/r/<token>` and `getRecipeByShareToken(token)` match on the token alone (never `userId`), require no session, and project a public shape that omits owner-scoped fields (`userId`, `shareToken`). Anyone with the link can view that one recipe.
- **Tests** cover owner-can-mint, non-owner/unauthenticated cannot (401/404), idempotent re-mint, and the public read working token-only with owner fields never selected.
- This completes the route-lockdown series (#341–#345); the now-unused `missingUserId()` 400 helper was removed (every route uses `unauthorized()`).

### Low-severity hardening sweep — Shipped Jul 2026 (#396)

- Five Low findings from the July 2026 pre-launch security audit closed in one pass:
  - **`POST`/`DELETE /api/inventory` now validate with Zod** (`AddInventoryItemSchemaObj` / `RemoveInventoryItemSchemaObj` — same schemas the AI tool path already used); malformed JSON or a bad payload returns 400 before the service is touched, mirroring the shopping-list route's `readJson`/`badRequest` pattern.
  - **Dead unscoped `deleteRecipe(recipeId)` removed** from `src/lib/recipes/recipes.ts` — no callers; deleting it closes a latent IDOR if it were ever wired up (`deleteRecipeForUser` is the real path).
  - **`/api/inventory/seed` no longer echoes `error.message`** to the client — generic body + `console.error`, matching every other route.
  - **`sqlite3` removed from dependencies** — imported nowhere (Prisma Studio doesn't use it); it was a native module riding along in the production install.
  - **Stray `package-lock.json` removed** — pnpm is the package manager; dual lockfiles invited drift (and a Next.js workspace-root warning).

### Write-route input validation hardened — Shipped (#360)

- **`POST /api/message`**: replaced the loose truthiness check with a Zod schema (`conversationId: string.min(1)`, `content: string.min(1)`, `role: enum["user","assistant"]`). An arbitrary role value (`"system"`, junk) now returns 400 rather than reaching the DB.
- **`POST /api/chat`**: added Zod validation before the expensive LLM path — `conversationId: string.max(100)`, `messages: array.max(100)`. Prevents multi-MB payloads from ever reaching `captureMentionedInventory` / `loadConversationContext` / `streamText`.
- Tests updated: the old "system role succeeds" case flipped to 400; new tests assert oversized messages array, oversized conversationId, and missing conversationId all 400 before any model call.

### normalizeIngredient extracted — Shipped (#362)

- **Ingredient normalisation lives in one place.** `saveRecipeFromBlock` and `updateRecipeForUser` both had an identical inline map — same `category ?? "Misc"` default and the same `parseFloat` / `Number.isNaN` amount-coercion. Extracted to `src/lib/recipes/normalizeIngredient.ts` (mirrors `normalizeTags.ts`); both call sites become one-liner `.map(normalizeIngredient)` calls. A unit-test file covers the amount-parsing edge cases (valid numeric, non-numeric, undefined, decimal) and the category default.

### Stateless model endpoints gated — Shipped (#358)

- **The three model-calling routes that hold no user data are now session-gated too.** `POST /api/market-tip`, `POST /api/storage-tip`, and `POST /api/recipe/extract` call `getSessionUserId(req)` and return `unauthorized()` (401) before any `generateObject` / `parseRecipeText` call. The lockdown series (#341–#345) scoped the *data-owning* routes; these three were skipped because they read/write only the shared tip cache (or nothing), so there was no IDOR — but they were left **open to anonymous cost abuse** (loop them to burn OpenAI budget). This closes that gap: every model-calling route now requires a session, and anonymous visitors already carry one, so the app's own calls are unaffected.
- **Tests** assert a 401 (with no model call) for each route when unauthenticated; `recipe/extract` gained its first test file.

### Comprehensible-voice fragment — Shipped Jul 2026 (#365)

- **Ah Mah stays fully in character but no longer confuses non-Singaporean users.** New `PROMPT_FRAGMENTS.comprehensibleVoice` fragment (`src/lib/prompts/fragments.ts`) instructs the model to keep particles/warmth/cadence untouched, gloss genuinely region-specific terms inline on first mention only (e.g. "ikan bilis (dried anchovies)", "kangkong (water spinach)"), and never gloss globally-known terms (wok, bok choy, tofu). Wired into `CHAT_SYSTEM_PROMPT` for this slice; `storage-tip` and `market-tip` routes follow in #366 so all three persona surfaces share the one rule.
- **Decision: comprehension over localization.** Considered and rejected geo-detecting SG/MY users to toggle Singlish on/off — it strips the persona for exactly the non-local users drawn to it, and mislabels the SG/MY diaspora whose IP reads as elsewhere. Glossing fixes comprehension for everyone with no detection and no second voice to maintain.
- Verified live against `gpt-4.1-mini`: region-specific terms (ikan bilis, tapau, kangkong, belacan) glossed on first mention; wok/bok choy left alone; Singlish particles and warm asides unchanged.

### Comprehensible-voice fragment extended to tip surfaces — Shipped Jul 2026 (#366)

- **`storage-tip` and `market-tip` now share the same `PROMPT_FRAGMENTS.comprehensibleVoice` fragment as chat** (#365) — no rule text duplicated, all three persona surfaces stay consistent from one source of truth.
- Verified live against `gpt-5-mini` (the model these two routes use): "ikan bilis (dried anchovies)", "belacan (fermented shrimp paste)", and "kangkong (water spinach)" glossed on first mention in both a storage tip and a market tip; "wok", "bok choy", and "tofu" left alone. The gloss comfortably coexists with the existing 12-word tip cap.

### Diagnostic balance check for recipe generation — Shipped Jul 2026

- **Recipe generation now runs a Salt/Fat/Acid/Heat balance pass** (`PROMPT_FRAGMENTS.balanceCheck`) before emitting a full recipe, to fix dishes that came out flat/under-seasoned. It is a **diagnostic, not a mandate** — the model adds an axis only where the dish would be flat without it, and leaves deliberately-clean dishes (congee, steamed fish) alone. Axes are read for Asian home cooking (salt = savoury depth incl. soy/fish sauce; acid = brightness incl. black vinegar/calamansi/tamarind).
- Surfaced only through the existing `steps[].tip` when the balancing move is the non-obvious save — no new recipe field. Applied to Mode 2 (named dish) + Mode 3 (Cook With What You Have) only; **excluded** from Mode 1 suggestions (no method surface) and the Tweak route (minimal-change contract). See [ADR-0018](adr/0018-recipe-generation-runs-a-diagnostic-balance-check.md).

### Chat empty-state flash fixed on conversation switch and new-chat commit — Shipped Jul 2026 (#383, #384)

- **Root cause:** the chat view's empty-state gate had no way to distinguish "conversation genuinely has no messages" from "the active conversation id just changed and its data hasn't caught up yet." Two id-keyed async sources (the AI SDK's streaming message store and the SWR-fetched saved-message list) both reset to empty the instant `activeConversationId` changed, briefly satisfying the empty-state condition.
- **Fix has two parts:** (1) `useChatSession` now claims the real conversation id for `useChat` the moment a staging send creates it, instead of waiting for `commitConversation` to assign it to `activeConversationId` after the stream finishes — so `useChat`'s `id` never has to reset and drop the just-streamed reply from view (fixes #384, the finish-of-generation flash). (2) `Chat.tsx`'s empty-state gate now also checks `messagesLoading`, so switching between two existing conversations no longer shows the full-screen "New Chat" state while the newly-selected conversation's history is still being fetched (fixes #383).
- Both issues shared one root cause; #384 was closed as a duplicate trigger and tracked under #383's agent brief.

### Security headers on every response — Shipped Jul 2026 (#394)

- **`next.config.ts` now sets six security headers on `/(.*)`:** a Content-Security-Policy (default/connect/font/form-action `'self'`; `img-src` additionally allows `blob: data:` + the two photo CDNs already in `images.remotePatterns`; `frame-ancestors 'none'`; `object-src 'none'`; `base-uri 'self'`), HSTS (2 years, includeSubDomains), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a Permissions-Policy disabling camera/microphone/geolocation — **screen-wake-lock is deliberately left enabled** because CookingMode holds one.
- The CSP keeps `'unsafe-inline'` for script/style (Next's inline bootstrap and injected styles need it; a nonce-based CSP requires middleware and wasn't worth it yet). Dev mode adds `'unsafe-eval'` + `ws:` so Turbopack/HMR keep working. Verified against a production build: all headers served, app renders with zero CSP violations.

### PWA installability — Shipped Jul 2026 (#397)

- **The app can now be properly installed to a home screen** (first slice of #326, at ~1% of the React Native cost): `src/app/manifest.ts` serves a web manifest (`name` "Ask Ah Mah" / `short_name` "Ah Mah", `display: standalone`, Kopitiam Modern cream `#f7ebdc` as background/theme color) with 192/512 icons declared both `any` and `maskable` — the granny mark centered on cream with a safe-zone margin, so Android adaptive masks don't crop her.
- `layout.tsx` wires the rest: `icons` (SVG favicon + existing apple-touch-icon), `appleWebApp` (title "Ah Mah", default status bar) for iOS Add to Home Screen, and a `viewport` export with light/dark `themeColor` (`#f7ebdc` / `#25170f`) so browser chrome matches the app.
- **Out of scope for v1 (deliberate):** service worker / offline shell — separate follow-up if wanted. Real-device install check (iOS Safari + Android Chrome) still worth doing after deploy.

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

- **Boolean cooked marker, not tracking** (Jul 2026): #377 adds a single reversible "I made this" checkbox (shared `CookedCheckbox`) in two places — above CookingMode's last-step footer and as a quiet end-cap at the *bottom* of the recipe view, below Notes (owner-only) — setting a single `Recipe.cooked` boolean: never inferred, never a count/timestamp/streak, un-tickable back to `false`. The create API takes `cooked` beside the recipe block and ignores it inside, so a model-streamed block can never stamp a recipe. Surfaced as a quiet jade stamp on the Cookbook card, not a scoreboard chip. (A warm gradient/Ah-Mah celebration panel, and later a meta-row card beside Total time, were both built and pulled back — the marker stays out of the recipe's reading path.) Full rationale → [ADR-0020](./adr/0020-cooking-is-celebrated-not-tracked.md).
- **Tab querystring routing stays; the bundle lever is the renderer, not routes** (Jul 2026): investigated #338 (migrate the four `?tab=` panels to per-feature App Router routes for code splitting). Bundle-analyzer evidence (`ANALYZE=true`, `analyze` script) shows `/` First Load JS is 476 kB, dominated by the markdown/math stack — `streamdown` 342 kB + `katex` 253 kB + `marked` 38 kB, statically imported by both the chat response renderer and `RecipeDisplay`. The three non-chat panels' own source is only ~40 kB, and the heavy deps stay on the chat landing after any split — so route-splitting buys <10% of the landing bundle while forcing chat/session state out of `forceMount`. Decided **not** to migrate; the real win is lazy-loading `streamdown` (deferred to a follow-up issue). Full rationale + numbers → [ADR-0019](./adr/0019-keep-querystring-tabs-bundle-lever-is-the-renderer.md).
- **Ah Mah voice model sharpened + carried in the live prompt** (Jul 2026): a brand session produced an in-app chatbot voice spec that sharpens `brand-ahmah.md §2` into rules — cheek is *downstream of serenity* (prompt the worldview, never "be funny"); teasing targets the food/mess/drama, never the user or the fact they asked; cheek is a resting tone that drops to near-zero on real distress; help comes clean first, personality wraps after; live-danger gets urgency without a lecture; and the deadpan "Not X. Y." reframe. The full spec lives in `docs/brand-voice-spec.md` (source of truth, zero runtime cost); the live chatbot only carries a distilled `voiceStance` fragment (`src/lib/prompts/fragments.ts`) wired into `CHAT_SYSTEM_PROMPT` beside `comprehensibleVoice`. The already-shipped Singlish/overseas-comprehension behaviour stays owned by `comprehensibleVoice` — the spec documents its *why*, not a duplicate. Locale-adaptive Singlish intensity is noted as a future refinement (needs a user-locale signal we don't have).
- **Magic-link email sign-in added beside Google** (Jul 2026): chosen over Apple ($99/yr, only worth it for an eventual iOS app) and Facebook (declining, heavy Meta review) as the second sign-in path — free, covers everyone with an email, and low-friction. Wired via better-auth's first-party `magicLink` plugin in `src/lib/auth.ts` (`expiresIn: 600` — 10 min, up from the 5-min default) with `magicLinkClient()` on `src/lib/auth-client.ts`. Email delivery is a thin `src/lib/email/sendMagicLink.ts` (Resend; `RESEND_API_KEY`/`RESEND_FROM_EMAIL` already in `.env.example`, `resend` newly installed) sending a branded Ah-Mah-voice email; a Resend delivery error throws so the UI shows a real failure instead of a false "check your inbox". `SignInDialog` gained an email field + "Send me a link" below the Google button, with a two-state form (form → "check your inbox", with "use a different email" to go back) and inline send-error text. A failed/expired verification redirects to `/?error=`, surfaced once as a toast in `src/app/(app)/page.tsx` then stripped. First-time email auto-creates the account, and guest sign-in still flows through `anonymous()`'s `onLinkAccount` → `migrateGuestData`, so a guest cookbook follows over exactly as with Google. **Needs `RESEND_API_KEY` + a verified sender domain to work in production.**
- **Every listed ingredient must be used in prep/steps** (Jul 2026): a garnish ingredient (e.g. coriander/parsley) could be added to a recipe's `ingredients` list without the method ever calling for it — the recipe-generation prompt (`CHAT_SYSTEM_PROMPT`, Mode 2 rules) had a rule tying step mentions back to `prep`, but nothing requiring the reverse: that every ingredient actually gets used somewhere in `prep`/`steps`. Fixed by adding that rule, worded to allow natural generic references ("the herbs", "the aromatics") rather than demanding the literal ingredient name appear verbatim — a step can legitimately say "sprinkle with herbs" without naming the herb. Distinct from the tweak-time propagation fix below: this covers the *original* recipe, tweaks cover edits to an existing one.
- **Tweak ingredient swaps now propagate into step/prep text** (Jul 2026): the tweak system prompt (`src/app/api/recipe/[id]/tweak/route.ts`) told the model to return only arrays that structurally changed, with no instruction to check whether the ingredient being swapped was actually named in `steps`/`prep` text — a "swap parsley for coriander" tweak updated the ingredient list but left the method steps referencing the old ingredient. Prompt now explicitly tells the model to check `steps`/`prep` for mentions of the changed ingredient and include those arrays in the patch if their wording changed too. Prompt-only fix — no client-side text-replacement fallback, matching ADR-0010's trust in the model to keep the recipe and change-list coherent.
- **Tweak bench drops the Ah Mah face avatar**: the `/granny-icon.png` avatar next to assistant messages in the Tweak bench (`TweakBench.tsx`) was removed — it's local to this panel only, not shared with the main Chat feature's message list.
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
