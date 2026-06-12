'use client';

import { cn } from '@/lib/utils';
import { useCyclingIndex } from './useCyclingIndex';
import { useReducedMotion } from './useReducedMotion';

interface SegmentedProgressProps {
  /** Voice-lines shown one at a time; also the number of progress segments. */
  lines: readonly string[];
  /** Time each line holds before advancing. */
  intervalMs?: number;
}

/**
 * Cycling voice-line stacked over a fill-and-hold segment indicator — the shared
 * "phase 2" progress visual. No spinner or container chrome: callers wrap it
 * with their own leading visual (e.g. the Tweak Bench granny icon). The chat
 * lays text and segments apart, so it drives {@link useCyclingIndex} +
 * {@link SegmentLines}/{@link SegmentBar} directly instead of using this.
 */
export function SegmentedProgress({
  lines,
  intervalMs = 1600,
}: SegmentedProgressProps) {
  const idx = useCyclingIndex(lines.length, { intervalMs });

  return (
    <div className="w-full">
      <div className="relative min-h-6" aria-live="polite">
        <SegmentLines lines={lines} idx={idx} />
      </div>
      <div className="flex gap-1.5 mt-2.5 ml-1">
        <SegmentBar count={lines.length} idx={idx} />
      </div>
    </div>
  );
}

/** Absolutely-stacked voice-lines, fading/sliding between the active one. */
export function SegmentLines({ lines, idx }: { lines: readonly string[]; idx: number }) {
  const reduced = useReducedMotion();
  return (
    <>
      {lines.map((line, i) => (
        <div
          key={i}
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

/**
 * The row of progress segments. Fills left→right and holds: segments before the
 * leading edge are solid, the leading edge itself pulses (never goes solid), and
 * the rest stay empty. Once `idx` holds at the last segment, that segment keeps
 * pulsing — "almost there", never completing.
 */
export function SegmentBar({ count, idx }: { count: number; idx: number }) {
  const reduced = useReducedMotion();
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={cn(
            'w-[22px] h-[3px] rounded-sm transition-colors duration-400',
            i < idx && 'bg-primary',
            i === idx &&
              (reduced
                ? 'bg-primary/50'
                : 'bg-primary animate-[ahmah-pulse-soft_1.6s_ease-in-out_infinite]'),
            i > idx && 'bg-[var(--border-soft)]',
          )}
        />
      ))}
    </>
  );
}
