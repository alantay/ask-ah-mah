'use client';

import { cn } from '@/lib/utils';
import { useReducedMotion } from '../loaders/useReducedMotion';

interface BowlMarkProps {
  className?: string;
}

// Rise/pop timings staggered so the steam and bubbles don't beat in unison.
const STEAM = [
  { d: 'M80,80 Q85,60 80,40', delay: '0s' },
  { d: 'M100,75 Q105,55 100,35', delay: '0.5s' },
  { d: 'M120,80 Q125,60 120,40', delay: '1s' },
];
const BUBBLES = [
  { cx: 70, cy: 110, r: 4, delay: '0.2s' },
  { cx: 100, cy: 120, r: 3, delay: '0.7s' },
  { cx: 130, cy: 115, r: 5, delay: '1.1s' },
];

/**
 * The steaming-bowl splash mark. A stroked line-drawing of Ah Mah's bowl —
 * steam curling up, bubbles surfacing, the whole thing swaying gently. Colours
 * come from the wrapper's `currentColor` (terracotta) plus the cream/butter
 * surface tokens, so it sits inside the app's palette rather than the raw hex
 * it was mocked in. All motion is dropped under `prefers-reduced-motion`.
 */
export function BowlMark({ className }: BowlMarkProps) {
  const reduced = useReducedMotion();
  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('text-primary', className)}
      role="presentation"
    >
      {/* Steam */}
      <g opacity="0.4">
        {STEAM.map((s, i) => (
          <path
            key={i}
            d={s.d}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className={cn(!reduced && 'animate-[ahmah-steam_2s_ease-out_infinite]')}
            style={reduced ? undefined : { animationDelay: s.delay }}
          />
        ))}
      </g>

      {/* Bowl — sways as a group */}
      <g
        className={cn(!reduced && 'animate-[ahmah-sway_3s_ease-in-out_infinite]')}
        style={{ transformOrigin: 'center 150px' }}
      >
        {/* Bowl body + broth surface */}
        <path
          d="M40,100 Q40,150 100,150 Q160,150 160,100 Z"
          className="fill-card"
          stroke="currentColor"
          strokeWidth={4}
        />
        <path
          d="M40,100 Q100,115 160,100 Q100,85 40,100"
          className="fill-secondary"
          stroke="currentColor"
          strokeWidth={2}
        />

        {/* Bubbles */}
        {BUBBLES.map((b, i) => (
          <circle
            key={i}
            cx={b.cx}
            cy={b.cy}
            r={b.r}
            fill="currentColor"
            className={cn(!reduced && 'animate-[ahmah-bubble_1.5s_ease-out_infinite]')}
            style={reduced ? undefined : { animationDelay: b.delay }}
          />
        ))}

        {/* Chopsticks */}
        <line
          x1={140}
          y1={60}
          x2={170}
          y2={110}
          stroke="currentColor"
          strokeWidth={4}
          strokeLinecap="round"
        />
        <line
          x1={150}
          y1={55}
          x2={180}
          y2={105}
          stroke="currentColor"
          strokeWidth={4}
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
