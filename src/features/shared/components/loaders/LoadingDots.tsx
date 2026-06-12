'use client';

import { cn } from '@/lib/utils';
import { useReducedMotion } from './useReducedMotion';

interface LoadingDotsProps {
  className?: string;
}

/**
 * Three bouncing dots — the quiet "phase 1" loading affordance shared by the
 * chat typing bubble and the Tweak Bench. Container chrome is the caller's job.
 */
export function LoadingDots({ className }: LoadingDotsProps) {
  const reduced = useReducedMotion();
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className={cn(
            'inline-block size-[7px] rounded-full bg-primary',
            !reduced && 'animate-[ahmah-dot_1.4s_ease-in-out_infinite]',
          )}
          style={{ animationDelay: reduced ? undefined : `${i * 0.16}s` }}
        />
      ))}
    </span>
  );
}
