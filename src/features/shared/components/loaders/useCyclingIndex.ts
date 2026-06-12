'use client';

import { useEffect, useState } from 'react';

interface CyclingOptions {
  intervalMs?: number;
  /**
   * When true, the index wraps back to 0 after the last item and keeps cycling.
   * When false (default), it advances once through and holds on the last item.
   */
  loop?: boolean;
}

/**
 * Advances an index 0..count-1 on a timer — the shared heartbeat behind the
 * cycling voice-lines. With `loop` it wraps and keeps the lines changing for the
 * whole wait (the wait length is unknowable, so there's no "last" to rest on);
 * without it, it advances once and holds on the last item.
 */
export function useCyclingIndex(
  count: number,
  { intervalMs = 1600, loop = false }: CyclingOptions = {},
): number {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
    const id = setInterval(() => {
      setIdx(i => (loop ? (i + 1) % count : Math.min(i + 1, count - 1)));
    }, intervalMs);
    return () => clearInterval(id);
  }, [count, intervalMs, loop]);

  return idx;
}
