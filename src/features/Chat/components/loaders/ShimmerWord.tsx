'use client';

import { cn } from '@/lib/utils';
import { useReducedMotion } from './useReducedMotion';

interface ShimmerWordProps {
  width?: number;
  height?: number;
  delay?: number;
  /** Use narrower monospace sizing for amount chips */
  mono?: boolean;
}

export function ShimmerWord({ width = 60, height = 13, delay = 0 }: ShimmerWordProps) {
  const reduced = useReducedMotion();
  return (
    <span
      className={cn(
        'inline-block rounded-sm align-[-2px]',
        reduced
          ? 'bg-border'
          : 'bg-[linear-gradient(90deg,var(--muted)_0%,var(--card)_50%,var(--muted)_100%)] bg-[length:200%_100%] animate-[ahmah-shimmer_1.8s_ease-in-out_infinite]',
      )}
      style={{ width, height, animationDelay: reduced ? undefined : `${delay}s` }}
    />
  );
}
