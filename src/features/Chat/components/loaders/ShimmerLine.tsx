'use client';

import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/features/shared/components/loaders';

interface ShimmerLineProps {
  width?: string | number;
  height?: number;
  delay?: number;
  className?: string;
}

export function ShimmerLine({ width = '100%', height = 12, delay = 0, className }: ShimmerLineProps) {
  const reduced = useReducedMotion();
  return (
    <div
      className={cn(
        'rounded',
        reduced
          ? 'bg-border'
          : 'bg-[linear-gradient(90deg,var(--muted)_0%,var(--card)_50%,var(--muted)_100%)] bg-[length:200%_100%] animate-[ahmah-shimmer_1.8s_ease-in-out_infinite]',
        className
      )}
      style={{
        width,
        height,
        animationDelay: reduced ? undefined : `${delay}s`,
      }}
    />
  );
}
