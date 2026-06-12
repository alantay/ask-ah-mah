'use client';

import {
  SegmentBar,
  SegmentLines,
  useCyclingIndex,
  useReducedMotion,
} from '@/features/shared/components/loaders';
import { cn } from '@/lib/utils';
import { STATUS_LINES } from '../../constants';

export function StatusStream() {
  const reduced = useReducedMotion();
  const idx = useCyclingIndex(STATUS_LINES.length);

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
            <SegmentLines lines={STATUS_LINES} idx={idx} />
          </div>
        </div>

        {/* Progress segments */}
        <div className="flex gap-1.5 mt-2.5 ml-1">
          <SegmentBar count={STATUS_LINES.length} idx={idx} />
        </div>
      </div>
    </div>
  );
}
