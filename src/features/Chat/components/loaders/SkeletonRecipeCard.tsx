'use client';

import { cn } from '@/lib/utils';
import { ShimmerLine } from './ShimmerLine';
import { useReducedMotion } from './useReducedMotion';

export function SkeletonRecipeCard() {
  const reduced = useReducedMotion();

  const EYEBROW_CLASSES = 'font-sans text-[10px] font-bold tracking-widest uppercase';
  const SHIMMER_STEP_BASE = 'shrink-0 size-[26px] rounded-[50%_50%_50%_6px]';

  const shimmerStepClassName = cn(
    SHIMMER_STEP_BASE,
    reduced
      ? 'bg-border'
      : 'bg-[linear-gradient(90deg,var(--muted)_0%,var(--card)_50%,var(--muted)_100%)] bg-[length:200%_100%] animate-[ahmah-shimmer_1.8s_ease-in-out_infinite]'
  );

  return (
    <div className="bg-card border border-border rounded-xl p-[18px_20px] max-w-full mt-2.5 relative shadow-[0_1px_0_var(--border-soft),0_14px_24px_-22px_oklch(0.3_0.05_50/0.5)]">
      {/* corner tab */}
      <div className="absolute top-[-1px] right-[22px] w-7 h-3.5 bg-primary rounded-b shadow-[inset_0_-1px_0_oklch(0.45_0.12_32)]" />

      {/* eyebrow + pen glyph */}
      <div className="flex items-center gap-2 mb-3">
        <div className={cn(EYEBROW_CLASSES, 'text-primary')}>Ah Mah is writing it out</div>
        <svg
          width="13"
          height="13"
          viewBox="0 0 16 16"
          fill="none"
          className={cn(
            !reduced && 'origin-[14px_14px] animate-[ahmah-pen_1.2s_ease-in-out_infinite]'
          )}
        >
          <style>{`@keyframes ahmah-pen {
            0%   { transform: translateX(0) rotate(-8deg); }
            50%  { transform: translateX(2px) rotate(-6deg); }
            100% { transform: translateX(0) rotate(-8deg); }
          }`}</style>
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

      {/* title skeleton */}
      <ShimmerLine width="78%" height={22} />
      <div className="h-2" />
      <ShimmerLine width="58%" height={14} delay={0.1} />

      {/* meta strip */}
      <div className="flex gap-2.5 mt-4 mb-4 p-[10px_12px] bg-chat border border-border-soft rounded-lg">
        <ShimmerLine width={60} height={10} delay={0.15} />
        <ShimmerLine width={60} height={10} delay={0.2} />
        <ShimmerLine width={60} height={10} delay={0.25} />
      </div>

      {/* ingredients */}
      <div className={cn(EYEBROW_CLASSES, 'text-muted-foreground mb-2.5')}>Ingredients</div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 mb-4.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <ShimmerLine width={48} height={11} delay={i * 0.05} />
            <ShimmerLine width={`${60 + (i % 3) * 12}%`} height={11} delay={i * 0.05 + 0.05} />
          </div>
        ))}
      </div>

      {/* method */}
      <div className={cn(EYEBROW_CLASSES, 'text-muted-foreground mb-2.5')}>Method</div>
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex gap-3 items-start">
            <div className={shimmerStepClassName} />
            <div className="flex-1 flex flex-col gap-1.5">
              <ShimmerLine width="90%" height={11} delay={i * 0.1} />
              <ShimmerLine width="70%" height={11} delay={i * 0.1 + 0.05} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

