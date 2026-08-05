# Context — Ask Ah Mah

Glossary of canonical terms for this codebase.

---

## Conversation

A thread that contains at least one **Message**. A `Conversation` row exists in the database only when a message has been sent. An "empty conversation" is not a Conversation — it is the **Staging State** of the chat.

**Why this matters:** clicking "New Chat" does not create a DB row. The row is created server-side when the first message is sent.

Related: [ADR-0002](docs/adr/0002-conversation-requires-at-least-one-message.md)

---

## Conversation Title

The short name a **Conversation** carries in the sidebar. Its job is **identification for later recall** — the user must recognise a chat in a list weeks after having it — so it names the **dish**, or failing that the ingredients discussed. Where a conversation produced a recipe, the recipe's own name serves.

A Conversation Title is written once, automatically, from the first exchange, and is the user's to overwrite by renaming. It is never rewritten afterwards: a title the user has grown used to is more useful than a better-worded one.

**A Conversation Title does not speak in Ah Mah's voice.** Warmth was tried here and failed — asked for a *warm* title in a handful of words, the model spent the budget on warmth and returned chats named for a mood rather than a dish, which no one can search for. Warmth belongs in her prose, where it has room; a label does a job. This is the same finding as [ADR-0023](docs/adr/0023-tips-speak-in-a-plain-register-not-ah-mahs-voice.md), reached independently on a second surface. Titles carry no emoji ([ADR-0026](docs/adr/0026-emoji-are-voice-not-system.md)).

Related: [ADR-0023](docs/adr/0023-tips-speak-in-a-plain-register-not-ah-mahs-voice.md), [ADR-0026](docs/adr/0026-emoji-are-voice-not-system.md)

---

## Section

One of the four primary destinations — **Chat**, **Pantry**, **Shopping List**, **Cookbook**. Selected from the `AppSidebar` on desktop and from the nav drawer on mobile. The `SectionSwitcher` that shows the active Section's panel (and keeps the others mounted-but-hidden underneath) is an implementation detail, not a user-facing surface — there is no visible tab strip. It deliberately does **not** use a tabs primitive: with no tab strip, tab semantics (`role="tablist"`/`"tab"`/`"tabpanel"`) would misrepresent the sidebar-driven nav. The `?tab=` query key is a kept URL contract (see [ADR-0019](docs/adr/0019-keep-querystring-tabs-bundle-lever-is-the-renderer.md)), not evidence of a tab UI.

The **Pantry** (current stock) and the **Shopping List** (what to buy) are conceptual inverses, kept **adjacent in the nav** rather than nested under one surface. They were briefly co-located as a Have/Need tab strip inside the Pantry; that strip was the app's only visible tabs and read as foreign to the "destinations come from the nav" rule, so the Shopping List was promoted to its own Section. See [ADR-0015](docs/adr/0015-shopping-list-is-its-own-section.md) (amends [ADR-0014](docs/adr/0014-shopping-list-is-standing-and-quantityless.md)).

---

## Staging State

The UI state where the user is on the Chat section but has not yet sent a message and has no pending conversation. Indicated by `activeConversationId === null && pendingConversationId === null`. The greeting and suggestions are shown; no `Conversation` row exists yet.

When the user sends the first message, the staging path in `useChatSession` creates the `Conversation` row via `POST /api/conversation`, then transitions to **Pending State**.

---

## Pending State

The transient state between the first message being sent and the assistant stream completing. The conversation row exists in the DB, but is tracked via `pendingConversationId` in `ConversationContext` rather than `activeConversationId`. The sidebar entry appears optimistically during this window.

When the stream finishes (`onFinish`), `commitConversation(id)` flips `pendingConversationId → activeConversationId`.

Committing continues the **same on-screen session** the user just watched stream — it is not a visible reload of the now-saved conversation. The reply stays put while history may revalidate in the background, with no loading placeholder at the moment of commit.

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

Point-of-purchase wisdom for choosing a fresh item well — e.g. *"firm, deep-red tomato, no bruises"* or *"a dark avocado that gives slightly is ripe enough to use today."* Surfaced on the **[Shopping List](#shopping-list)** Section, one tip per item, and folded into the copied shopping-list text so it travels to wherever the user actually shops. Market Tips deliberately do **not** appear on the recipe card — co-locating a pick-tip with an ingredient's substitution `note` clashed (see [ADR-0014](docs/adr/0014-shopping-list-is-standing-and-quantityless.md)).

A Market Tip speaks only to **selection quality at the moment of buying** — not to how long something keeps once home. Only *fresh / pickable* items (produce, fruit, seafood, meat) carry one; staples (salt, sauces, dry goods) have none and show no tip affordance. Tips are **universal, not user-specific**: the same advice serves every user, so they live in a single shared corpus keyed by canonical item name, never per account. Tips speak in a plain, factual register — not Ah Mah's voice (see [ADR-0023](docs/adr/0023-tips-speak-in-a-plain-register-not-ah-mahs-voice.md)).

Both tip kinds are gated by **kitchen-domain relevance**: only items used for cooking or eating — food, drink, fresh groceries, and cooking equipment — are eligible. Anything unrelated to the kitchen (sports gear, vehicles, clothing, toiletries) gets no tip and is negative-cached, never re-asked. A wok is in-domain; a climbing harness is not.

**Why this matters:** this is freshness-*adjacent* but deliberately distinct from the shelf-life idea rejected in [ADR-0008](docs/adr/0008-no-shelf-life-ui.md). Shelf-life asks "is *my* tomato still good?" — unknowable from app state. A Market Tip asks "how do I pick a good tomato?" — general knowledge the model already holds. The first is per-user and unreliable; the second is shared and sound.

Related: [ADR-0013](docs/adr/0013-market-tips-are-llm-generated-and-shared.md), [ADR-0014](docs/adr/0014-shopping-list-is-standing-and-quantityless.md), [ADR-0023](docs/adr/0023-tips-speak-in-a-plain-register-not-ah-mahs-voice.md)

---

## Storage Tip

Advice on **how to keep a kitchen item well at home** — covering both food longevity (*"potatoes in a cool, dark place, never the fridge"*, *"herbs stem-down in a glass of water"*) and equipment care (*"dry the wok on the heat, wipe a little oil so it won't rust"*). Surfaced per item in the **Pantry**, toggleable on/off.

Distinct from a **[Market Tip](#market-tip)**: a Market Tip is *pick it well at the shop* (point of purchase); a Storage Tip is *keep it well at home* (after purchase). Every kitchen-domain pantry item can carry one — food and cooking equipment alike — subject to the same kitchen-domain relevance gate.

Like Market Tips, Storage Tips are **universal, not user-specific** (the same advice serves everyone) and live in their own shared corpus keyed by canonical item name. They clear [ADR-0008](docs/adr/0008-no-shelf-life-ui.md) by the same logic as Market Tips: *"how do I store a potato?"* is general, time-independent knowledge, not *"is **my** potato still good?"* — which depends on unknowable app state. Like Market Tips, they speak in a plain, factual register — not Ah Mah's voice (see [ADR-0023](docs/adr/0023-tips-speak-in-a-plain-register-not-ah-mahs-voice.md)).

Related: [ADR-0017](docs/adr/0017-storage-tips-clear-adr-0008.md), [ADR-0008](docs/adr/0008-no-shelf-life-ui.md), [ADR-0013](docs/adr/0013-market-tips-are-llm-generated-and-shared.md), [ADR-0023](docs/adr/0023-tips-speak-in-a-plain-register-not-ah-mahs-voice.md)

---

## Shopping List

A standing, **per-user**, persisted list of items the user intends to buy — its own top-level **Section**, the conceptual inverse of the **Pantry** (current stock) and kept adjacent to it in the nav. Items are **identities, not quantities**: a row is `shallot`, never `4 shallots`, so the same item from different recipes and from direct entry collapse to one row (canonical name). Each item carries its **Market Tip**.

Items arrive two ways: the **cart button** on a recipe's ingredient row (adds the missing item), or **typed in directly** — a single plain word or two adds instantly, while a longer paste (e.g. a recipe's ingredient list copied off a webpage) is extracted into several items by the model, still reduced to bare identities per the quantity-less rule above. Lifecycle is todo-list-style — checking an item (**bought**) strikes it through for the trip; crossing it out (**✕**, changed mind) deletes it. Moving a bought item into the **Pantry** is a separate, opt-in step, never a side effect of checking it.

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

A single `cooked: Boolean` on a saved recipe, answering only "has this dish been cooked before?" — set **exclusively** by an explicit "I made this" tap on the shared `CookedCheckbox`, which lives in two places: the [Finish moment](#finish-moment) and a quiet end-cap at the *bottom* of the recipe view, below Notes — out of the reading path (owner-only; hidden on the public share view and for guests). Never inferred from reaching the last cooking step — and structurally so: the create API takes `cooked` beside the recipe block and ignores it inside, so a model-streamed block can never stamp a recipe. The tap is **reversible**: un-ticking sets it back to `false`. Deliberately **not** a count, timestamp, or streak — a recall marker, not a scoreboard. Surfaced as a small static jade stamp on the recipe's Cookbook card image strip; no motion, no achievement framing.

Related: [ADR-0020](docs/adr/0020-cooking-is-celebrated-not-tracked.md)

---

## Finish moment

The final step of `CookingMode` stays quiet — it keeps the ordinary step-nav footer, with `← Prev` and a jade "Done — all finished!" button (which just exits). The only addition is a single reversible "I made this" checkbox sitting above that footer, which toggles the [Cooked marker](#cooked-marker). No gradient panel, no Ah Mah line, no confetti — we tried a warm celebration bookend and pulled it back to just the marker. The checkbox is omitted when the consumer can't persist the flag.

Related: [ADR-0020](docs/adr/0020-cooking-is-celebrated-not-tracked.md)

---

## Step Uses

The per-step list of ingredients consumed *at that step*, each carrying the quantity used **in that step** — for a split-use ingredient (a slurry added partly at step 2, the rest at step 5), the partial amount at each step, never the master total. Rendered as a quiet chip row beside the step, never woven into the step prose. Quantities are numeric-and-scalable when possible; otherwise short free text ("remaining", "to taste") shown as-is, unscaled.

**Why this matters:** the master ingredient list answers *"what do I gather?"*; Step Uses answers *"how much goes in **now**?"* — mid-cook, without leaving the step. Soft invariant: a split ingredient's partial amounts should sum to its master amount; this is model-authored, not enforced.

---

## Clarify block

A fenced ` ```clarify ` block (`{ question, options: [{ id, label, hint? }] }`) that Ah Mah may emit — Mode 4 in `CHAT_SYSTEM_PROMPT` — to ask **one** clarifying question, rendered as a single-select card. Tapping an option sends its `label` back verbatim as the user's reply (`ClarifyBlock`, mirrors `SuggestionsBlock`). It reopens the app's long-standing **"never ask"** stance, but only through this tap-to-answer channel, and only for a narrow purpose.

**The governing line is dish vs. parameter:** a Clarify block picks a **parameter** — a constraint that reshapes *which* dishes fit (meal type, diet, spice, cuisine mood, effort, use-it-up vs. cook-fresh); the **Suggestions** block (Mode 1) picks a **dish**. If the missing thing is *which dish*, that's suggestions' job, not clarify's.

**Why this matters:** the ban existed because prose questions read as Ah Mah stalling instead of cooking. Clarify is bounded so it can't become that stall — three hard guards hold: (1) if she can already act at a sensible default she acts, never asks; (2) no permission questions ("want me to suggest?"); (3) freshness stays off-limits — she never asks whether an item is still good ([ADR-0008](docs/adr/0008-no-shelf-life-ui.md)). Clarify narrows the *request*, never audits the pantry.

Related: [ADR-0024](docs/adr/0024-clarify-reopens-never-ask.md), [ADR-0008](docs/adr/0008-no-shelf-life-ui.md), [Checklist block](#checklist-block)

---

## Checklist block

A fenced ` ```checklist ` block (`{ question, deal, rows: [{ id, label, hint?, category? }] }`) that Ah Mah may emit — Mode 5 in `CHAT_SYSTEM_PROMPT` — asking whether the user owns the things a **named dish stands on**, before she commits to the dish. Rendered as a **multi-select** card with staging and an explicit submit (`ChecklistBlock`), unlike the single-select **Clarify block**. It is a **gate**: emitted alone, then she waits, then cooks exactly one recipe.

**The governing line is dish vs. parameter vs. possession.** Suggestions (Mode 1) picks a **dish** — *which dish?*; Clarify (Mode 4) picks a **parameter** — *which constraint reshapes the answer?*; a Checklist block asks about a **possession** — *is this fixed dish achievable?* It presupposes the dish, so it can never be used to pick between dishes; and it asks about nothing but what the user owns, so it never narrows the request.

**A tick is a factual claim — "I own this."** Ticked rows are written straight to the pantry (`POST /api/inventory`, client-driven), which makes the card the fastest inventory backfill in the app. A row **shown and left unticked** on submit is **confirmed absent** — stronger than merely "not in the pantry record", because the user engaged and said no. It binds **the name, and only the name**: substitution and **Addition** notes continue exactly as before.

**The makeable fork.** When the missing load-bearing item is something a home cook can make in one session — a rempah, a curry paste, a stock, a sambal, pasta — *how* comes before *what*: a [clarify](#clarify-block) offers "make my own" vs. "store-bought", and the checklist that follows asks about **that route's** ingredients only. Picking from-scratch turns the card into the paste's **makings** (dried chilli, belacan, galangal, candlenut), which is what an incomplete pantry record actually misses — a jar is memorable, loose candlenuts at the back of a cupboard are not. Ticking them satisfies the name test by [building the thing rather than substituting it](#name-test), so the dish keeps its real name. Bounded: nothing long-ferment (soy sauce, miso, gochujang) forks, more than 4 makings does not fit a card, and a dish she can already cook never forks — that would be a permission question wearing a costume.

**It composes with Additions, it does not compete.** Additions *accept* the pantry record ("not in pantry — grab next shop"); the checklist *corrects* it ("you may already own this"). The checklist runs before the recipe exists; Additions run after, on whatever is genuinely absent.

**Scope:** at most one per dish, no limit per conversation, and **nothing carries between dishes** — a new dish standing on a previously-declined item asks again. "Per dish" means **per cooking**: a confirmed-absent row binds the dish she cooked, not the rest of the conversation, so asking for that same dish *again* re-opens the card — the user has had time to go to the shops, and the second ask is the signal. Nothing the user has **already told her they lack** earns a row either; that is an answer, not a question, and if it empties the list there is no card at all. Chat only; **Cook With What You Have** (Mode 3) is untouched. Presence is not freshness: she asks *do you have it*, never *is it still good* ([ADR-0008](docs/adr/0008-no-shelf-life-ui.md)).

Related: [ADR-0026](docs/adr/0026-checklist-reopens-never-ask-for-possession.md), [ADR-0024](docs/adr/0024-clarify-reopens-never-ask.md), [Name test](#name-test), [Addition](#addition)

---

## Name test

The rule that decides whether an ingredient is **load-bearing** for a dish:

> An ingredient qualifies **iff** removing or substituting it means the dish can no longer honestly carry its name.

Laksa → laksa paste, coconut milk, thick rice noodles. Not garlic, shallots, oil, soy. It is a semantic judgement about the dish, authored by the model — never a set-membership check against a suggestion's `keyIngredients` (a deliberately broad coverage set that includes soy and garlic).

Two things it does **not** qualify: anything freely substitutable without touching the name (guanciale → pancetta leaves carbonara carbonara), and anything the pantry can already **build** — dried chilli, belacan, lemongrass, galangal and candlenut *are* laksa paste. Making the thing is not substituting the thing, so there is no gap to ask about and the name survives. Because the rename is driven off the same rows, a stand-in that never becomes a row can never cost a dish a name it earned.

One rule does double duty: it selects the rows of a **Checklist block** *and* decides whether the cooked result keeps the dish's name, so the two can never disagree. **The name is binary, the dish is a gradient**: with anything load-bearing still missing, the dish may not wear the name — however much else was ticked — but the recipe still uses every ticked item and lands as close as it honestly can. *"Not the real laksa without the paste, but with your coconut milk and those noodles — a proper coconut noodle soup lah."*

Related: [ADR-0026](docs/adr/0026-checklist-reopens-never-ask-for-possession.md), [Checklist block](#checklist-block)

---

## Shared Link

The public, unauthenticated URL (`/r/<token>`) a recipe owner mints to pass one recipe to someone else. Sharing is a **hand-off, not a publication**: the recipe stays the owner's, the recipient gets a *view* and never a copy — no save-to-my-cookbook, no fork. Owner-scoped fields are never exposed, and the page is `noindex` (link-only, protected solely by an unguessable token).

A Shared Link is therefore **mortal, and mortal in exactly one way**. Minting is one-way and idempotent — the same token forever, and there is no unshare — so the only thing that kills a link is the owner throwing the recipe away. The recipe is hard-deleted with no tombstone, so a dead token is indistinguishable from a bogus one: both resolve to nothing.

The person at a Shared Link is a **Recipient** — a stranger with no pantry, no cookbook, and no idea what this app is. Every surface on this route is written for them rather than for the owner, including the closing invitation under a live recipe and the [Retired Link](#retired-link) page under a dead one.

**Why this matters:** it explains why the app has an acquisition surface at all. A Recipient is the only person who meets Ah Mah without choosing to, so `/r/` is the one route that has to introduce her.

Related: [ADR-0022](docs/adr/0022-share-prompt-is-quiet-and-photo-first-og-fallback.md), [Copy recipe](#copy-recipe)

---

## Retired Link

A **[Shared Link](#shared-link)** whose recipe no longer exists. It gets its own page rather than the app's generic 404, because the two are not the same event: a stray URL means *you typed something wrong*, a Retired Link means *something real was here and the cook put it away*.

The page **presumes the recipe was thrown away** and says so, even though the code cannot actually distinguish that from a garbage token. This is deliberate: tokens are unguessable, so a human only ever arrives here by clicking a link that once worked — the presumption is right essentially every time for the people who read it, and only ever wrong for crawlers. Writing agnostic copy to stay technically correct for bots would cost the page the one thing it has.

Retiring is described to the Recipient as **put away**, never *thrown away* — the app's own word for deletion. "Thrown away" is the **owner's** word for their **own** act (the delete toast says *"Okay, thrown away."*); repeating it to a stranger makes the person who shared the link look careless. Same event, different audience, different register.

**Why this matters:** the alternative was a tombstone — retaining the name of a deleted recipe so the page could confirm the loss and even name the dish. Rejected: the owner tapped throw-away and was told it was thrown away. Quietly keeping it so strangers can still read it breaks that promise.
