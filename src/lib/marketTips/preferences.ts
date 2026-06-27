/**
 * `localStorage` keys for each tip surface's on/off preference. One key per
 * surface so the toggles are independent. Defaults live with the consumer:
 * Market Tips default ON (preserve prior behaviour); Storage Tips default OFF
 * (opt-in). See ADR-0017.
 */
export const MARKET_TIPS_PREF_KEY = "ah-mah-market-tips";
export const STORAGE_TIPS_PREF_KEY = "ah-mah-storage-tips";
