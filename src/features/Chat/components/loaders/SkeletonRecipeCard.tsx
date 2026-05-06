'use client';

import { cn } from '@/lib/utils';
import { ShimmerLine } from './ShimmerLine';
import { ShimmerWord } from './ShimmerWord';
import { useReducedMotion } from './useReducedMotion';

const INGREDIENT_PAIRS: [number, number][] = [
  [54, 96], [44, 70], [40, 60], [44, 56], [40, 64],
  [44, 78], [40, 56], [40, 84], [40, 64], [44, 72],
];

const STEPS = [
  { titleW: 132, bodyLines: ['88%', '62%'] },
  { titleW: 168, bodyLines: ['92%', '54%'] },
  { titleW: 156, bodyLines: ['90%', '74%'] },
];

export function SkeletonRecipeCard() {
  const reduced = useReducedMotion();

  return (
    <div className="bg-chat border-y border-border-soft p-[20px_26px_22px] relative mt-2.5 max-w-full">
      {/* Ribbon header — mirrors RecipeLetter's ribbon exactly */}
      <div className="flex items-center gap-2.5 mb-3.5 pb-2.5 border-b border-dashed border-border">
        <div className="size-[22px] rounded-full bg-primary flex items-center justify-center text-white shrink-0">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <path d="M3 2v12l5-3 5 3V2z" stroke="currentColor" strokeWidth="1.4" fill="currentColor" />
          </svg>
        </div>

        <div className="font-sans text-[10px] font-bold tracking-widest uppercase text-muted-foreground inline-flex items-center gap-1.5">
          The way I make it
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="none"
            className={cn(!reduced && 'origin-[14px_14px] animate-[ahmah-pen_1.2s_ease-in-out_infinite]')}
          >
            <path
              d="M1.5 14.5 L4 12 L12 4 L14 6 L6 14 L3.5 14.5 Z"
              fill="var(--secondary)"
              stroke="var(--foreground)"
              strokeWidth="1"
              strokeLinejoin="round"
            />
            <path d="M11 5 L13 7" stroke="var(--primary)" strokeWidth="1" />
          </svg>
        </div>

        <div className="flex-1" />

        {/* Time label placeholder */}
        <ShimmerWord width={64} height={11} delay={0.05} mono />

        {/* Stepper placeholder */}
        <div
          className={cn(
            'w-[100px] h-[30px] border border-border rounded-lg',
            reduced
              ? 'bg-border'
              : 'bg-[linear-gradient(90deg,var(--muted)_0%,var(--card)_50%,var(--muted)_100%)] bg-[length:200%_100%] animate-[ahmah-shimmer_1.8s_ease-in-out_0.1s_infinite]',
          )}
        />
      </div>

      {/* Title */}
      <div className="flex flex-col gap-2 mb-4">
        <ShimmerLine width="64%" height={26} />
        <ShimmerLine width="38%" height={26} delay={0.08} />
      </div>

      {/* "You'll need —" flowing ingredient prose */}
      <div className="font-display italic text-[15px] text-muted-foreground leading-[1.85] mb-4.5">
        <b className="not-italic text-foreground font-semibold">You&apos;ll need —</b>{' '}
        {INGREDIENT_PAIRS.map(([amountW, nameW], i) => (
          <span key={i}>
            <ShimmerWord width={amountW} height={13} delay={i * 0.04} mono />
            {' '}
            <ShimmerWord width={nameW} height={13} delay={i * 0.04 + 0.02} />
            {i < INGREDIENT_PAIRS.length - 1 ? ', ' : '.'}
            {' '}
          </span>
        ))}
      </div>

      {/* Method — numbered prose steps */}
      <div className="font-display text-base leading-[1.85]">
        {STEPS.map((s, i) => (
          <div key={i} className="mb-3.5">
            <span
              className="inline-flex items-center justify-center size-[22px] bg-primary text-white font-display font-bold text-xs rounded-[50%_50%_50%_5px] -rotate-3 mr-2 shadow-[inset_0_-1px_0_oklch(0.405_0.130_32)] align-middle"
              style={{ opacity: 0.55 + 0.15 * (STEPS.length - i) }}
            >
              {i + 1}
            </span>
            <ShimmerWord width={s.titleW} height={14} delay={i * 0.08} />
            {' '}
            {s.bodyLines.map((w, j) => (
              <span
                key={j}
                className={cn(j === 0 ? 'inline' : 'block mt-1 ml-[30px]')}
              >
                <ShimmerLine width={w} height={12} delay={i * 0.08 + 0.04 + j * 0.04} />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
