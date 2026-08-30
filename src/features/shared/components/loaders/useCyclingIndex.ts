'use client';

import { useEffect, useState } from 'react';

interface CyclingOptions {
  intervalMs?: number;
  /**
   * When true, the index wraps back to 0 after the last item and keeps cycling.
   * When false (default), it advances once through and holds on the last item.
   */
  loop?: boolean;
  /**
   * Visit every index once in a shuffled order. Each loop gets a fresh order,
   * without repeating the line that just finished.
   */
  randomize?: boolean;
}

interface CycleState {
  order: number[];
  position: number;
}

function makeOrder(
  count: number,
  randomize: boolean,
  previousIndex?: number,
  previousOrder?: readonly number[],
): number[] {
  const order = Array.from({ length: count }, (_, i) => i);

  if (!randomize) return order;

  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  if (order.length > 1 && order[0] === previousIndex) {
    const swapIndex = 1 + Math.floor(Math.random() * (order.length - 1));
    [order[0], order[swapIndex]] = [order[swapIndex], order[0]];
  }

  // A shuffle can legally reproduce the previous order. Avoid that for lists
  // long enough to offer another order so a long wait never settles into a
  // visibly repeating sequence.
  if (
    order.length > 2 &&
    previousOrder?.every((value, index) => value === order[index])
  ) {
    [order[1], order[2]] = [order[2], order[1]];
  }

  return order;
}

function makeCycleState(count: number, randomize: boolean): CycleState {
  return { order: makeOrder(count, randomize), position: 0 };
}

/**
 * Advances an index 0..count-1 on a timer — the shared heartbeat behind the
 * cycling voice-lines. With `loop` it wraps and keeps the lines changing for the
 * whole wait (the wait length is unknowable, so there's no "last" to rest on);
 * without it, it advances once and holds on the last item.
 */
export function useCyclingIndex(
  count: number,
  {
    intervalMs = 1600,
    loop = false,
    randomize = false,
  }: CyclingOptions = {},
): number {
  const [cycle, setCycle] = useState(() =>
    makeCycleState(count, randomize),
  );
  const [config, setConfig] = useState({ count, intervalMs, loop, randomize });

  if (
    config.count !== count ||
    config.intervalMs !== intervalMs ||
    config.loop !== loop ||
    config.randomize !== randomize
  ) {
    setConfig({ count, intervalMs, loop, randomize });
    setCycle(makeCycleState(count, randomize));
  }

  useEffect(() => {
    // Nothing to cycle through 0 or 1 lines — bail before the interval so the
    // updater never does `% 0` (NaN) or Math.min(..., -1), which would break the
    // hook's 0..count-1 contract.
    if (count <= 1) return;
    const id = setInterval(() => {
      setCycle((current) => {
        if (current.position < count - 1) {
          return { ...current, position: current.position + 1 };
        }

        if (!loop) return current;

        const previousIndex = current.order[current.position];
        return {
          order: makeOrder(count, randomize, previousIndex, current.order),
          position: 0,
        };
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [count, intervalMs, loop, randomize]);

  return cycle.order[cycle.position] ?? 0;
}
