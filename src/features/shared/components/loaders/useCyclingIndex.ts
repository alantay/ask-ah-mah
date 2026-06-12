'use client';

import { useEffect, useState } from 'react';

interface CyclingOptions {
  intervalMs?: number;
}

/**
 * Advances an index 0..count-1 on a timer, then holds on the last one — the
 * shared heartbeat behind the voice-line + fill-and-hold segment indicator.
 * Never loops: the held last step is what gives the "almost there, never quite
 * finishes" anticipation.
 */
export function useCyclingIndex(
  count: number,
  { intervalMs = 1600 }: CyclingOptions = {},
): number {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
    const id = setInterval(() => {
      setIdx(i => Math.min(i + 1, count - 1));
    }, intervalMs);
    return () => clearInterval(id);
  }, [count, intervalMs]);

  return idx;
}
