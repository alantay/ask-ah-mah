'use client';

import { useEffect, useState } from 'react';

interface CyclingOptions {
  intervalMs?: number;
  /** Stop on the last index (fake-progress) instead of looping back to 0. */
  holdOnLast?: boolean;
}

/**
 * Advances an index 0..count-1 on a timer. The shared heartbeat behind every
 * cycling voice-line + filling segment indicator.
 */
export function useCyclingIndex(
  count: number,
  { intervalMs = 1600, holdOnLast = false }: CyclingOptions = {},
): number {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
    const id = setInterval(() => {
      setIdx(i => (holdOnLast ? Math.min(i + 1, count - 1) : (i + 1) % count));
    }, intervalMs);
    return () => clearInterval(id);
  }, [count, intervalMs, holdOnLast]);

  return idx;
}
