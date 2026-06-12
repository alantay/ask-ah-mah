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

## Next up

### Shopping list from shortfalls
- [ ] Add one-click `Add missing to shopping list` from `RecipeDisplay`.
- [ ] Add `ShoppingList` Prisma model (`id`, `userId`, `name`, `quantity?`, `unit?`, `addedAt`, `recipeId?`).
- [ ] Add shopping-list UI surface.
- [ ] Add "mark done → route into inventory" flow.

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
