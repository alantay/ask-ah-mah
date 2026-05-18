'use client';

import { cn } from '@/lib/utils';
import { useReducedMotion } from './useReducedMotion';

interface TypingProps {
  phrase: string;
}

export function Typing({ phrase }: TypingProps) {
  const reduced = useReducedMotion();

  return (
    <div className="max-w-xl">
      <div>
        {/* Eyebrow */}
        <div
          className={cn(
            'font-display italic text-xs text-ink-faint mb-1.5',
            !reduced && 'animate-[ahmah-pulse-soft_1.6s_ease-in-out_infinite]'
          )}
        >
          {phrase}
        </div>

        {/* Dots bubble */}
        <div className="inline-flex items-center gap-1.5 py-3 px-4 bg-card border border-border rounded-2xl rounded-bl-sm shadow-[0_1px_0_var(--border-soft)]">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className={cn(
                'inline-block size-[7px] rounded-full bg-primary',
                !reduced && 'animate-[ahmah-dot_1.4s_ease-in-out_infinite]'
              )}
              style={{
                animationDelay: reduced ? undefined : `${i * 0.16}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
