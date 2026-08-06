export const INVENTORY_LOADING_MESSAGES = [
  "Checking the pantry...",
  "Taking inventory of ingredients...",
  "Scanning the kitchen shelves...",
  "Counting what's in stock...",
  "Organizing the pantry...",
  "Checking what's available...",
  "Taking stock of ingredients...",
  "Reviewing the kitchen inventory...",
  "Checking what we have...",
  "Scanning the cupboards...",
];

/**
 * How long the storage-tip item list waits before settling. `useTips` keys its
 * cache on the whole item set, so each delete would otherwise mint a new key
 * and fire a fresh LLM tip request; this collapses a burst of deletes into one.
 */
export const TIP_ITEMS_DEBOUNCE_MS = 800;
