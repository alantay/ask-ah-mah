"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * A boolean on/off preference persisted in `localStorage`, used to gate the
 * display (and fetch) of Ah Mah's tips on a given surface. Each surface passes
 * its own `storageKey`, so the Pantry's Storage-tip toggle and the Shopping
 * List's Market-tip toggle are independent.
 *
 * SSR-safe: renders with `defaultOn` on the server and the first client paint,
 * then reconciles with the stored value after mount.
 */
export function useTipsPreference(
  storageKey: string,
  defaultOn: boolean,
): [boolean, (next: boolean) => void] {
  const [enabled, setEnabled] = useState(defaultOn);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored !== null) setEnabled(stored === "1");
    } catch {
      // localStorage unavailable (private mode, etc.) — keep the default.
    }
  }, [storageKey]);

  const set = useCallback(
    (next: boolean) => {
      setEnabled(next);
      try {
        window.localStorage.setItem(storageKey, next ? "1" : "0");
      } catch {
        // Non-fatal: the preference just won't persist this session.
      }
    },
    [storageKey],
  );

  return [enabled, set];
}
