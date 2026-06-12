'use client';

import { useEffect, useState } from 'react';

/**
 * Returns whether `thresholdMs` has elapsed since `startedAt`.
 *
 * Drives the "dots first, then progress indicator" pattern: render the quiet
 * phase while this is `false`, the richer phase once it flips `true`. Resets
 * whenever `startedAt` changes (a new wait) or is `null` (no wait in flight).
 */
export function usePhaseAfter(
  startedAt: number | null,
  thresholdMs: number,
): boolean {
  const [reached, setReached] = useState(
    () => startedAt != null && Date.now() - startedAt >= thresholdMs,
  );

  useEffect(() => {
    if (startedAt == null) {
      setReached(false);
      return;
    }
    const tick = () => setReached(Date.now() - startedAt >= thresholdMs);
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [startedAt, thresholdMs]);

  return reached;
}
