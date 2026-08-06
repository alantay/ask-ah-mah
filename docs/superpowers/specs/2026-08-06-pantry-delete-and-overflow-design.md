# Pantry: fast deletes, wrapping names — design spec

**Issue:** [#486](https://github.com/alantay/ask-ah-mah/issues/486)
**Related:** [#487](https://github.com/alantay/ask-ah-mah/issues/487) — capture quality (out of scope here)
**Status:** Approved, ready for implementation plan

## Context

Two complaints, one surface. Deleting several pantry items in a row stalls on every click, and
long item names escape their category card into the neighbouring masonry column.

Multi-select was considered and rejected. A selection mode whose only verb is delete doesn't earn
its UI, and folding delete into the *existing* selection mode (built for "Cook with what you
have") would overload one mode with two unrelated verbs — one of which is destructive, next to a
default that starts with everything selected.

The delete latency is not one problem but two, and the second is the larger one.

## A. Optimistic delete

### Why it's slow today

`Inventory.tsx:207` `removeItem` awaits the DELETE round-trip, then calls
`mutate(inventoryKey(userId))`, which fires a *second* round-trip — a full inventory GET, sent
`no-store` per `route.ts:30` — before the row disappears. Two sequential requests per click.

`mutateResource` already has an optimistic path (`key` + `optimisticData`); this call site never
used it.

### Behavior

- Clicking × removes the row immediately. The DELETE fires in the background.
- **Success is silent.** Once the delete is optimistic, the row vanishing *is* the confirmation;
  the existing `Okay, took out the ${itemName}.` toast becomes the new pile-up (ten deletes, ten
  stacked toasts) and is removed.
- **Failure** re-fetches truth via `mutate(key)` — the row slides back — and keeps the existing
  `Aiyah, ${itemName} won't budge. Try again?` toast.
- **No revalidation on success.** The optimistic write is authoritative for a delete, and SWR's
  default `revalidateOnFocus` self-heals any drift from chat-side adds. Re-fetching on success
  would preserve exactly the cost this change exists to remove.

### The stale-snapshot trap

`data` is a render-time snapshot. Three clicks inside one frame all close over the *same* `data`,
so each computes "that snapshot minus my one item" and the last write resurrects the first two.

`optimisticData` must therefore be the **functional** form, `(current) => next`, which SWR 2.4
supports. That means widening `mutateResource`'s `optimisticData` type from `T` to
`T | ((current?: T) => T)`. One line; the runtime call already forwards the value to `mutate`
untouched, and SWR treats a function in that position as an updater.

The updater filters the removed name out of **both** `ingredientInventory` and
`kitchenwareInventory`. This matches the server exactly: `removeInventoryItem`
(`lib/inventory/Inventory.ts:70`) does `deleteMany({ name: { in: names }, userId })` with no
`type` filter.

### Deletion is keyed by name, not id

Unchanged, deliberately. The API takes `itemNames: string[]` and the same endpoint backs the LLM's
`removeInventoryItem` tool. Changing the identity semantics would alter the agentic path, which is
outside this task. The optimistic filter mirrors the server's behaviour, so the two stay consistent.

## B. Tip refetch storm

`useTips.ts:57` builds its SWR key from the sorted canonical names of the **entire** item set. Any
deletion changes the key, producing a new cache entry and a fresh `POST /api/storage-tip` — an LLM
call covering all remaining items. With Tips toggled on, deleting ten items fires ten
regenerations over near-identical sets.

Making delete optimistic makes this *worse*: faster clicking means more key churn.

**Fix:** debounce the item list passed to `useStorageTips` (`Inventory.tsx:164`) by ~800ms, so a
burst of deletes collapses into one tip request once the burst settles.

Contained to `Inventory.tsx`. `useTips` is shared with the Market tips surface and is not touched.

`keepPreviousData: true` already keeps existing tips on screen across a key change, so debouncing
adds no new blank-row window.

Note this only bites when Tips is on, and the preference defaults to off
(`useTipsPreference(STORAGE_TIPS_PREF_KEY, false)`).

## C. Long names wrap

`InventoryItemRow.tsx:88-89`: the outer `<span>` is inline, and the inner
`<span className="truncate">` is inline too. `truncate` expands to `white-space: nowrap` +
`overflow: hidden` + `text-overflow: ellipsis`. On an **inline** box, `nowrap` applies but
`overflow` and `text-overflow` do not — so the name refuses to wrap and nothing clips it, and it
spills out of the card.

The selection-mode branch (line 74) is immune only because its outer span is `flex`, which
blockifies the inner span.

**Fix:** in the non-selection branch, drop the inner `truncate` wrapper and put `break-words` on
the outer span. Names wrap to as many lines as they need.

Wrapping over clamping because the pantry is a reference list — hiding the qualifier in
"Fresh firm fish (mackerel, snapper, barramundi)" defeats its purpose, and a hover `title` isn't
reachable on touch. Uneven row heights are already established here: the cards sit in a masonry
column layout and storage tips already render as a second line.

The selection-mode branch is left exactly as-is.

## Out of scope

Both tracked in [#487](https://github.com/alantay/ask-ah-mah/issues/487):

- **Near-duplicate items.** `normalizeName` only fixes case and whitespace, so "Shallot"/"Shallots"
  and "Seaweed"/"Nori" coexist. Exact duplicates within a type are already impossible —
  `@@unique([userId, name, type])` plus an upsert. Semantic folding is an extractor problem.
- **Over-long captured names.** "Fresh firm fish (mackerel, snapper, barramundi)" is a recipe
  ingredient line swallowed whole. The wrapping fix in C is correct regardless of whether that
  string should have existed.

Also out of scope: `type` is part of the unique key, so the same name can legally exist as both
ingredient and kitchenware, and a name-keyed delete removes both. Rare, and changing it would
affect the LLM tool path.

## Testing

- `removeItem` drops the item from the SWR cache before the DELETE resolves.
- Three `removeItem` calls against one stale snapshot leave all three removed — the regression the
  functional updater exists to prevent.
- A failed DELETE restores the row and toasts; a successful one toasts nothing.
- `InventoryItemRow` renders a long name without `white-space: nowrap`, in the non-selection branch
  only — selection mode keeps its single-line truncation.
