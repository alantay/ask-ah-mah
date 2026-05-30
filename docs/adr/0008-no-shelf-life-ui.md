# ADR-0008 — No shelf-life urgency UI

**Status:** Accepted

## Context

`InventoryItem` previously stored a `shelfLife` field ("short" / "medium" / "long" / "frozen") alongside `dateAdded`. The intent was to surface a "use soon" indicator for short-shelf items and to steer Mode 3 recipe generation toward ingredients that needed to be used up.

The schema also contained a "Select use-soon" shortcut in the Cook With What You Have selection panel, and an amber dot on short-shelf items in the pantry list.

## Decision

Remove `shelfLife` entirely — from the schema, Zod types, AI prompts, tool definitions, and UI. No urgency indicator is surfaced to the user.

## Why

**Freshness cannot be reliably known.** Users manage shelf life through their own methods: freezing, growing herbs, restocking regularly. The `dateAdded` timestamp records when an item was added to the app, not when it was acquired or when it will expire. These diverge whenever a user documents existing stock in bulk, freezes an item, or buys a replacement without removing the old entry.

**Recipe quality over pantry urgency.** Steering the model toward "use this because it's expiring" produces recipes skewed by app state rather than by what makes a good dish. The recipe should be generated because the dish needs those ingredients — not because the app guesses they're nearing expiry.

**The pantry is a kitchen profile, not a depleting inventory.** Users tend to keep staples indefinitely and restock without updating the app. A "use soon" feature assumes an accuracy of pantry state that the design does not enforce.

## Alternatives considered

**Derived urgency from `shelfLife + dateAdded`.** Technically feasible — short-shelf items added more than N days ago could be flagged. Rejected because the signal is unreliable: `dateAdded` does not equal acquisition date, and the user may have extended or replaced the item without the app knowing.

**User-supplied expiry dates.** Would make the signal accurate but adds friction to item entry. The core interaction (add via chat, cook) is already low-friction; inserting a date-picker breaks that.

## Consequences

- `shelfLife` column dropped from `inventory_items` table via `prisma db push`.
- Amber dot indicator removed from `InventoryItemRow`.
- "Select use-soon" button removed from Cook With What You Have selection panel.
- Mode 3 prompt no longer instructs the model to prioritize short-shelf items.
- `dateAdded` is retained for potential future use (e.g., displaying "added X days ago").
