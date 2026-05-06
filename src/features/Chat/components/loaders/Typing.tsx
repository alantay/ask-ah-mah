'use client';

import { MessageAvatar } from '@/components/ai-elements/message';
import { cn } from '@/lib/utils';
import { useReducedMotion } from './useReducedMotion';

interface TypingProps {
  phrase: string;
}

export function Typing({ phrase }: TypingProps) {
  const reduced = useReducedMotion();

  return (
    <div className="flex gap-3 items-start max-w-xl">
      <MessageAvatar src="/granny-avatar.png" name="👵" className="size-9 mt-0.5 shrink-0" />
      <div className="flex-1">
        {/* Eyebrow */}
        <div className="flex items-center gap-2 font-sans text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-1.5">
          <span>Ah Mah</span>
          <span
            className={cn(
              'font-normal text-ink-faint tracking-normal normal-case italic',
              !reduced && 'animate-[ahmah-pulse-soft_1.6s_ease-in-out_infinite]'
            )}
          >
            · {phrase}
          </span>
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
