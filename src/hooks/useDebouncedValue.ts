"use client";

import { useEffect, useState } from "react";

/**
 * Lags changes to `value` by `delayMs`, so a burst of rapid changes settles
 * into one update instead of one per change. The initial value is returned
 * immediately — only subsequent changes wait.
 *
 * Comparison is by reference. Callers passing an object or array must memoize
 * it; a fresh literal each render restarts the timer every render and the
 * value never settles.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
