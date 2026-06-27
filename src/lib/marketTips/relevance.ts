/**
 * Kitchen-domain relevance gate, shared by every tip generator (Market Tips,
 * Storage Tips). A tip is only worth giving for things used in cooking or
 * eating — food, drink, fresh groceries, and cooking equipment. Anything else
 * (sports gear, vehicles, clothing, toiletries, …) gets no tip.
 *
 * This is enforced in the generation prompt because the category pre-filter
 * can't tell an uncategorised "dragon fruit" from an uncategorised "climbing
 * harness". An empty tip from the model is negative-cached, so out-of-domain
 * items are never re-asked.
 *
 * See ADR-0017 and the Market Tip / Storage Tip entries in CONTEXT.md.
 */
export const KITCHEN_DOMAIN_RULE =
  'If the item is NOT used for cooking or eating — i.e. not food, drink, a fresh grocery, or cooking equipment (e.g. sports gear, clothing, vehicles, toiletries, tools) — return tip as an empty string "".';
