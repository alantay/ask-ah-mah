# Context — Ask Ah Mah

Glossary of canonical terms for this codebase.

---

## Conversation

A thread that contains at least one **Message**. A `Conversation` row exists in the database only when a message has been sent. An "empty conversation" is not a Conversation — it is the **Staging State** of the chat.

**Why this matters:** clicking "New Chat" does not create a DB row. The row is created server-side when the first message is sent.

Related: [ADR-0002](docs/adr/0002-conversation-requires-at-least-one-message.md)

---

## Section

One of the four primary destinations — **Chat**, **Pantry**, **Shopping List**, **Cookbook**. Selected from the `AppSidebar` on desktop and from the nav drawer on mobile. The Radix `Tabs` container that switches the content panels underneath is an implementation detail, not a user-facing surface — there is no visible tab strip.

The **Pantry** (current stock) and the **Shopping List** (what to buy) are conceptual inverses, kept **adjacent in the nav** rather than nested under one surface. They were briefly co-located as a Have/Need tab strip inside the Pantry; that strip was the app's only visible tabs and read as foreign to the "destinations come from the nav" rule, so the Shopping List was promoted to its own Section. See [ADR-0015](docs/adr/0015-shopping-list-is-its-own-section.md) (amends [ADR-0014](docs/adr/0014-shopping-list-is-standing-and-quantityless.md)).

---

## Staging State

The UI state where the user is on the Chat section but has not yet sent a message and has no pending conversation. Indicated by `activeConversationId === null && pendingConversationId === null`. The greeting and suggestions are shown; no `Conversation` row exists yet.

When the user sends the first message, the staging path in `useChatSession` creates the `Conversation` row via `POST /api/conversation`, then transitions to **Pending State**.

---

## Pending State

The transient state between the first message being sent and the assistant stream completing. The conversation row exists in the DB, but is tracked via `pendingConversationId` in `ConversationContext` rather than `activeConversationId`. The sidebar entry appears optimistically during this window.

When the stream finishes (`onFinish`), `commitConversation(id)` flips `pendingConversationId → activeConversationId`.

---

## Nav Selection

"You are in this **Section**." Shown on the primary navigation items in `AppSidebar` and the mobile nav drawer (Chat / Pantry / Shopping List / Cookbook). Visual treatment: `bg-card` background, `text-foreground` label, terracotta (`text-primary`) icon outline (stroke color only — no fill swap).

The Chat nav item is highlighted only in **Staging State** (`activeConversationId === null && pendingConversationId === null`). Once a conversation becomes pending or committed, the Chat nav unhighlights and **Thread Selection** takes over.

Related: [ADR-0003](docs/adr/0003-nav-and-thread-selection-are-distinct.md)

---

## Thread Selection

"You are reading this conversation." Shown on conversation rows in the `Conversations` sidebar list. Visual treatment: **butter** (`oklch(0.86 0.10 88)`) background.

Applies when `conv.id === activeConversationId || conv.id === pendingConversationId`.

Related: [ADR-0001](docs/adr/0001-butter-is-where-you-are.md), [ADR-0003](docs/adr/0003-nav-and-thread-selection-are-distinct.md)

---

## Butter

The visual token reserved for "you, here, now" — the thing the user is currently reading or acting on. Applied to the active conversation row and the user's own message bubbles. Never applied to navigation items (those use `bg-card`).

See [ADR-0001](docs/adr/0001-butter-is-where-you-are.md) for the full rationale.

---

## Tweak Bench

The interactive right-side panel that hosts a multi-turn recipe refinement session. A user opens the Tweak Bench from a recipe page and sends one or more instructions; each instruction is a **Recipe Tweak**. State is ephemeral — the turn log and working draft live only in memory while the bench is open. Saving commits the working draft to the cookbook; Discarding or closing collapses the bench and the draft evaporates.

The bench displays a "What changed" checklist (decorative, read-only) alongside an inline diff overlay on the recipe (NEW chips, "was X" strikethrough, highlighted rows). Both views are driven by the structured change list returned by the model — they cannot disagree.

Related: [ADR-0005](docs/adr/0005-tweak-bench-multi-turn.md)

---

## Recipe Tweak

A single turn within a **Tweak Bench** session. The user types one refinement instruction (e.g. "use chicken instead of tofu") and the AI returns a **Tweak Patch** — the changed fields plus a structured change list — buffered in a single response (not streamed). The client applies the patch to the working draft. A Recipe Tweak cannot generate a wholly unrelated dish — the model refuses in plain text and leaves the working draft unchanged.

The AI call goes through a dedicated route (`POST /api/recipe/[id]/tweak`), separate from the chat pipeline.

Related: [ADR-0005](docs/adr/0005-tweak-bench-multi-turn.md), [ADR-0010](docs/adr/0010-recipe-tweak-returns-a-patch.md)

---

## Tweak Patch

The response a **Recipe Tweak** returns: only the recipe fields that changed (arrays — `ingredients`, `steps`, `prep`, `tags` — replaced **wholesale** if any element changed; scalar fields sent only if changed), plus the structured change list. Presence is the signal: a key present means "replace this field on the working draft," a key absent means "keep it." Clearing an array is sent as `[]` (present-but-empty), distinct from omitting the key.

Supersedes the old contract, where the model echoed the **entire** recipe back each turn — which made generation time scale with recipe size (~15s for a one-word tweak) regardless of how little changed. Replacing whole arrays (rather than patching individual rows) keeps the model the single author of each list, so the recipe and the diff cannot disagree.

Related: [ADR-0010](docs/adr/0010-recipe-tweak-returns-a-patch.md)

---

## Cook With What You Have

The Pantry-rooted interaction where a user enters selection mode, marks a **Featured Selection** of pantry items (and optionally preferred kitchenware), and submits to spawn a new **Conversation**. The assistant streams a **Close Recipe** and a **Stretch Recipe** in that conversation. The selection is a transient front-door payload — it lives only long enough to compose the first message, then clears.

Entry points: a CTA at the top of the Pantry, and a suggestion chip in the Chat **Staging State** that navigates to Pantry and enters selection mode.

Related: [ADR-0006](docs/adr/0006-cook-with-what-you-have-is-a-conversation.md), [ADR-0007](docs/adr/0007-pantry-selection-is-feature-emphasis.md)

---

## Featured Selection

The set of pantry items the user has marked to *star* in a Cook With What You Have submission. Items can be ingredients or kitchenware. The selection is **emphasis, not constraint** — non-selected pantry items remain fair game for the model to use silently; selected items must appear or be addressed.

A genuine Featured Selection is a **proper subset** of the pantry. Selecting the *entire* pantry is equivalent to selecting *nothing*: both send the relaxed whole-pantry request (*"no featured ingredients"*), never a kitchen-sink list of every item. The selection UI defaults to **all items checked** — the user *deselects* what they don't feel like cooking with — so "all checked" must collapse to the relaxed request, otherwise the common case would over-constrain the model.

Related: [ADR-0007](docs/adr/0007-pantry-selection-is-feature-emphasis.md)

---

## Close Recipe

The first recipe slot in a Cook With What You Have response. Uses 0–2 **Additions** beyond the user's pantry; the model is told to prefer fewer. Omitted entirely (with a one-line explanation) when the Featured Selection is too sparse to support any recipe at 0–2 additions.

UI label: **"Right now."** The internal term is `Close`.

---

## Stretch Recipe

The second recipe slot in a Cook With What You Have response. Uses 3–4 Additions beyond pantry, with a hard cap of 4. Always present in the response, even when the Close Recipe is omitted.

UI label: **"Worth a small trip."** The internal term is `Stretch`.

---

## Addition

An ingredient a generated recipe calls for that is not present in the user's pantry. The Addition count distinguishes Close from Stretch. Salt, pepper, water, and cooking oil are **free staples** — never counted as Additions even if absent from the pantry. Everything else in the pantry is also free; only items genuinely missing are Additions.

---

## Shortfall card

**Retired — superseded by the [Shopping List](#shopping-list). See [ADR-0014](docs/adr/0014-shopping-list-is-standing-and-quantityless.md).**

Formerly: the in-chat block that listed a recipe's missing items (the **Additions**) with **Market Tips** inline. It duplicated **What to gather** and stapled a pick-tip beside the ingredient's substitution `note`, so two advice voices clashed on one item. The in-chat recipe now keeps a single ingredient list in a single voice; shopping and tips moved to the standing **Shopping List**.

---

## Market Tip

Ah Mah's point-of-purchase wisdom for choosing a fresh item well — e.g. *"firm, deep-red tomato, no bruises"* or *"a dark avocado that gives slightly is ripe enough to use today."* Surfaced on the **[Shopping List](#shopping-list)** Section, one tip per item, and folded into the copied shopping-list text so it travels to wherever the user actually shops. Market Tips deliberately do **not** appear on the recipe card — co-locating a pick-tip with an ingredient's substitution `note` clashed (see [ADR-0014](docs/adr/0014-shopping-list-is-standing-and-quantityless.md)).

A Market Tip speaks only to **selection quality at the moment of buying** — not to how long something keeps once home. Only *fresh / pickable* items (produce, fruit, seafood, meat) carry one; staples (salt, sauces, dry goods) have none and show no tip affordance. Tips are **universal, not user-specific**: the same advice serves every user, so they live in a single shared corpus keyed by canonical item name, never per account.

Both tip kinds are gated by **kitchen-domain relevance**: only items used for cooking or eating — food, drink, fresh groceries, and cooking equipment — are eligible. Anything unrelated to the kitchen (sports gear, vehicles, clothing, toiletries) gets no tip and is negative-cached, never re-asked. A wok is in-domain; a climbing harness is not.

**Why this matters:** this is freshness-*adjacent* but deliberately distinct from the shelf-life idea rejected in [ADR-0008](docs/adr/0008-no-shelf-life-ui.md). Shelf-life asks "is *my* tomato still good?" — unknowable from app state. A Market Tip asks "how do I pick a good tomato?" — general knowledge the model already holds. The first is per-user and unreliable; the second is shared and sound.

Related: [ADR-0013](docs/adr/0013-market-tips-are-llm-generated-and-shared.md), [ADR-0014](docs/adr/0014-shopping-list-is-standing-and-quantityless.md)

---

## Storage Tip

Ah Mah's advice on **how to keep a kitchen item well at home** — covering both food longevity (*"potatoes in a cool, dark place, never the fridge"*, *"herbs stem-down in a glass of water"*) and equipment care (*"dry the wok on the heat, wipe a little oil so it won't rust"*). Surfaced per item in the **Pantry**, toggleable on/off.

Distinct from a **[Market Tip](#market-tip)**: a Market Tip is *pick it well at the shop* (point of purchase); a Storage Tip is *keep it well at home* (after purchase). Every kitchen-domain pantry item can carry one — food and cooking equipment alike — subject to the same kitchen-domain relevance gate.

Like Market Tips, Storage Tips are **universal, not user-specific** (the same advice serves everyone) and live in their own shared corpus keyed by canonical item name. They clear [ADR-0008](docs/adr/0008-no-shelf-life-ui.md) by the same logic as Market Tips: *"how do I store a potato?"* is general, time-independent knowledge, not *"is **my** potato still good?"* — which depends on unknowable app state.

Related: [ADR-0017](docs/adr/0017-storage-tips-clear-adr-0008.md), [ADR-0008](docs/adr/0008-no-shelf-life-ui.md), [ADR-0013](docs/adr/0013-market-tips-are-llm-generated-and-shared.md)

---

## Shopping List

A standing, **per-user**, persisted list of items the user intends to buy — its own top-level **Section**, the conceptual inverse of the **Pantry** (current stock) and kept adjacent to it in the nav. Items are **identities, not quantities**: a row is `shallot`, never `4 shallots`, so the same item from different recipes and from direct entry collapse to one row (canonical name). Each item carries its **Market Tip**.

Items arrive two ways: the **cart button** on a recipe's ingredient row (adds the missing item), or **typed in directly** (e.g. "apples", unrelated to any recipe). Lifecycle is todo-list-style — checking an item (**bought**) strikes it through for the trip; crossing it out (**✕**, changed mind) deletes it. Moving a bought item into the **Pantry** is a separate, opt-in step, never a side effect of checking it.

Items are grouped by **[Aisle](#aisle)** so the list reads as a market walk rather than a flat pile.

**Why this matters:** the Shopping List is where **Market Tips** live — the point-of-purchase surface — deliberately separated from the recipe card so a pick-tip ("choose pale pink pork") never sits beside a recipe's substitution `note` ("use the chicken you have"). The two voices answer different questions and clashed when co-located. It also serves wants no recipe-bound list could: buying things unrelated to any recipe.

Related: [ADR-0014](docs/adr/0014-shopping-list-is-standing-and-quantityless.md), [ADR-0013](docs/adr/0013-market-tips-are-llm-generated-and-shared.md), [ADR-0016](docs/adr/0016-shopping-list-groups-by-aisle.md)

---

## Aisle

The **store-location** bucket a **[Shopping List](#shopping-list)** item is grouped under, so the list reads as a single trip through a market rather than a flat pile. A fixed, small vocabulary — **Produce · Meat & Seafood · Rice & Noodles · Sauces & Seasoning · Other** — ordered as a sensible walk, with **Other** always last and **empty aisles hidden**.

An Aisle is deliberately **not** the Pantry's storage category enum (`Protein / Carbs / Vegetable / Condiments / Spice / Misc`). That enum is a *storage* taxonomy ("where does this live at home"); an Aisle is a *shopping* taxonomy ("where do I find this at the shop"). The two are kept distinct but **bridged by a deterministic map** (Vegetable→Produce, Protein→Meat & Seafood, Carbs→Rice & Noodles, Condiments/Spice→Sauces & Seasoning, Misc→Other), so a recipe item that already knows its Category needs no extra work to find its Aisle.

A typed-in item has no Category, so its Aisle is **assigned by the model** (the same LLM-and-shared spirit as a [Market Tip](#market-tip)). Until that returns, the item rests in **Other**, then shifts to its real Aisle — the list never blocks on the classification. See [ADR-0016](docs/adr/0016-shopping-list-groups-by-aisle.md).

---

## Recipe Notes

Whole-dish asides attached to a recipe (`notes` on the recipe block): make-ahead, storage, serving suggestions, and pantry-*independent* technique fallbacks ("no cumin? use garam masala — it's pre-toasted, add it later"). Optional, 0–4 entries, omitted for simple dishes. Rendered as a "Notes" section at the foot of the recipe.

**Flagged ambiguity — `notes` vs `note`:** distinct concepts at different altitudes. The ingredient-level **`note`** (singular) tweaks *one ingredient* ("boneless, bite-size"; "not in pantry — use dry sherry"). **Recipe Notes** (`notes`, plural) speak to the *whole dish*. Recipe Notes deliberately do **not** carry pantry substitutions — those already live in the ingredient `note` and the "Ask Ah Mah for substitutions" affordance, and duplicating them here is out of lane.

---

## Copy recipe

The action that copies the **whole recipe** as clean plain text (CAPS section headers, `•`/numbered lists — no markdown, so it survives pasting into WhatsApp/Notes), at the **currently displayed servings**. Shared formatter, surfaced on both the chat recipe card and the recipe page. Excludes user-specific pantry state.

**Flagged ambiguity — vs Copy shopping list:** two distinct copy intents, never collapse into a bare "Copy." **Copy shopping list** copies *only the missing ingredients* for a shop trip. **Copy recipe** copies *the entire dish* to cook from or share. Both can coexist on the same card; the labels name the intent.

---

## Cooked marker

A single `cooked: Boolean` on a saved recipe, answering only "has this dish been cooked before?" — set **exclusively** by an explicit "I made this" tap on the shared `CookedCheckbox`, which lives in two places: the [Finish moment](#finish-moment) and the recipe view itself (owner-only; hidden on the public share view and for guests). Never inferred from reaching the last cooking step — and structurally so: the create API takes `cooked` beside the recipe block and ignores it inside, so a model-streamed block can never stamp a recipe. The tap is **reversible**: un-ticking sets it back to `false`. Deliberately **not** a count, timestamp, or streak — a recall marker, not a scoreboard. Surfaced as a small static jade stamp on the recipe's Cookbook card image strip; no motion, no achievement framing.

Related: [ADR-0020](docs/adr/0020-cooking-is-celebrated-not-tracked.md)

---

## Finish moment

The final step of `CookingMode` stays quiet — it keeps the ordinary step-nav footer, with `← Prev` and a jade "Done — all finished!" button (which just exits). The only addition is a single reversible "I made this" checkbox sitting above that footer, which toggles the [Cooked marker](#cooked-marker). No gradient panel, no Ah Mah line, no confetti — we tried a warm celebration bookend and pulled it back to just the marker. The checkbox is omitted when the consumer can't persist the flag.

Related: [ADR-0020](docs/adr/0020-cooking-is-celebrated-not-tracked.md)
