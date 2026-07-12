// Centralized SWR cache-key / fetch-URL builders. Every literal
// `/api/...?userId=` (or similar) string used to live duplicated at each
// useSWR/mutate call site with inconsistent encodeURIComponent usage — a
// mutation could revalidate a slightly different string than a reader
// subscribed to. These builders are the single source of truth for key
// shape; they do no fetching themselves.
//
// String keys double as the fetch URL passed to `fetcher`/`fetch`, so they
// stay strings. The conversation list key stays a tuple (see its docstring).

export const recipeKey = (userId: string) =>
  `/api/recipe?userId=${encodeURIComponent(userId)}`;

export const inventoryKey = (userId: string) =>
  `/api/inventory?userId=${encodeURIComponent(userId)}`;

export const shoppingListKey = (userId: string) =>
  `/api/shopping-list?userId=${encodeURIComponent(userId)}`;

export const messageKey = (conversationId: string) =>
  `/api/message?conversationId=${encodeURIComponent(conversationId)}`;

// Tuple key: userId partitions the cache per user but is never sent to the
// server (the session cookie is the identity), so it isn't part of the
// fetch URL. See ConversationContext for the fetcher that unwraps it.
export const conversationListKey = (userId: string) =>
  ["/api/conversation", encodeURIComponent(userId)] as const;

// Tips keys are pure cache keys (never fetch URLs) — sorted, pipe-joined
// canonical item names behind a resource prefix, so identical item sets
// dedupe regardless of order.
export const marketTipKey = (canonicalNames: string[]) =>
  `market-tip:${[...canonicalNames].sort().join("|")}`;

export const storageTipKey = (canonicalNames: string[]) =>
  `storage-tip:${[...canonicalNames].sort().join("|")}`;
