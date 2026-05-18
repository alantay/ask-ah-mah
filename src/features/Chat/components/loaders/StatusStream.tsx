'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { STATUS_LINES } from '../../constants';
import { useReducedMotion } from './useReducedMotion';

export function StatusStream() {
  const reduced = useReducedMotion();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % STATUS_LINES.length), 1600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="max-w-xl">
      <div>
        <div className="flex items-center gap-3 py-3 px-4 bg-card border border-border rounded-2xl rounded-bl-sm shadow-[0_1px_0_var(--border-soft)] min-w-[260px]">
          {/* Spinner ring */}
          <div className="relative size-[22px] shrink-0">
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              className={cn(
                !reduced && 'animate-[ahmah-pulse-soft_1.6s_ease-in-out_infinite]'
              )}
            >
              <circle cx="11" cy="11" r="8" fill="none" stroke="var(--border-soft)" strokeWidth="2" />
              <circle
                cx="11"
                cy="11"
                r="8"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2"
                strokeDasharray="14 36"
                strokeLinecap="round"
                className={cn(
                  'origin-[11px_11px]',
                  !reduced && 'animate-[ahmah-spin_1.2s_linear_infinite]'
                )}
              />
            </svg>
          </div>

          {/* Cycling status text */}
          <div className="flex-1 relative min-h-6">
            {STATUS_LINES.map((line, i) => (
              <div
                key={i}
                className={cn(
                  'absolute inset-0 flex items-center font-display italic text-base text-foreground transition-[opacity,transform]',
                  reduced ? 'duration-200' : 'duration-400',
                  i === idx ? 'opacity-100' : 'opacity-0',
                  !reduced && (i === idx ? 'translate-y-0' : 'translate-y-1')
                )}
              >
                {line}
              </div>
            ))}
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 mt-2.5 ml-1">
          {STATUS_LINES.map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-[22px] h-[3px] rounded-sm transition-colors duration-400',
                i <= idx ? 'bg-primary' : 'bg-[var(--border-soft)]'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
