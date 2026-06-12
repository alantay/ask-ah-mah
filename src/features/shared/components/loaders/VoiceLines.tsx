'use client';

import { cn } from '@/lib/utils';
import { useCyclingIndex } from './useCyclingIndex';
import { useReducedMotion } from './useReducedMotion';

/** Fisher–Yates — a fresh order each wait so the lines don't always open the same. */
export function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

interface CyclingVoiceLinesProps {
  /** Voice-lines shown one at a time. */
  lines: readonly string[];
  /** Time each line holds before advancing. */
  intervalMs?: number;
  /** Keep cycling (wrap) instead of holding on the last line. */
  loop?: boolean;
}

/**
 * Cycling Ah-Mah voice-lines — the shared "phase 2" wait affordance. No spinner
 * or container chrome: callers wrap it with their own leading visual (e.g. the
 * Tweak Bench granny icon). The chat lays its spinner and lines apart, so it
 * drives {@link useCyclingIndex} + {@link VoiceLine} directly instead of using
 * this. The wait length is unknowable, so there's no honest progress to show —
 * the lines just keep the wait warm and alive.
 */
export function CyclingVoiceLines({
  lines,
  intervalMs = 2000,
  loop = false,
}: CyclingVoiceLinesProps) {
  const idx = useCyclingIndex(lines.length, { intervalMs, loop });

  return (
    <div
      className="relative min-h-6 w-full"
      role="status"
      aria-label="Ah Mah is thinking…"
    >
      <VoiceLine lines={lines} idx={idx} />
    </div>
  );
}

/**
 * Absolutely-stacked voice-lines, fading/sliding between the active one. The
 * lines are decorative personality (the spinner already says "busy"), so they're
 * `aria-hidden` — a looping live region would spam screen readers every couple
 * of seconds. Callers carry the status semantics on a wrapper instead.
 */
export function VoiceLine({ lines, idx }: { lines: readonly string[]; idx: number }) {
  const reduced = useReducedMotion();
  return (
    <>
      {lines.map((line, i) => (
        <div
          key={i}
          aria-hidden
          className={cn(
            'absolute inset-0 flex items-center font-display italic text-base text-foreground transition-[opacity,transform]',
            reduced ? 'duration-200' : 'duration-400',
            i === idx ? 'opacity-100' : 'opacity-0',
            !reduced && (i === idx ? 'translate-y-0' : 'translate-y-1'),
          )}
        >
          {line}
        </div>
      ))}
    </>
  );
}
