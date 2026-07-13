'use client';

import { cn } from '@/lib/utils';
import { LoadingDots } from '../loaders/LoadingDots';
import { BowlMark } from './BowlMark';
import { PRELOADER_TIPS } from './tips';

interface AppPreloaderProps {
  /** When true, the splash fades out (the gate keeps it mounted through the fade). */
  hidden?: boolean;
}

// Must match the 4000ms step baked into `ahmah-tip-cycle`'s keyframe
// percentages in globals.css — see the comment there.
const TIP_STEP_MS = 4000;

/** Centered, muted cycling kitchen tip — the honest wait is unknowable, so the
 *  lines just keep it warm. Stacked absolutely so the row height never jumps.
 *  Rotation is pure CSS (see `.ahmah-tip` in globals.css), not a JS timer: the
 *  splash's job is to keep someone company while hydration itself may still
 *  be the slow part, so it can't depend on hydration having finished. */
function CyclingTip() {
  return (
    <div className="relative min-h-6 w-full" role="status" aria-label="Ah Mah is prepping…">
      {PRELOADER_TIPS.map((tip, i) => (
        <div
          key={i}
          aria-hidden
          className="ahmah-tip absolute inset-0 flex items-center justify-center font-display text-emphasis italic text-muted-foreground text-balance opacity-0"
          style={{ animationDelay: `${i * TIP_STEP_MS}ms` }}
        >
          {tip}
        </div>
      ))}
    </div>
  );
}

/**
 * The first-load splash. A steaming bowl, an "Ah Mah is prepping…" line, a
 * cycling kitchen tip, and progress dots on a warm paper backdrop — held over
 * the app while the guest session settles, then faded away by
 * {@link PreloaderGate}. Presentational only; all timing lives in the gate.
 */
export function AppPreloader({ hidden = false }: AppPreloaderProps) {
  return (
    <div
      aria-hidden={hidden}
      className={cn(
        'paper fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background px-6 text-center',
        'transition-opacity duration-400 ease-out',
        hidden ? 'pointer-events-none opacity-0' : 'opacity-100',
      )}
    >
      <BowlMark className="size-40" />

      <div className="flex w-full max-w-md flex-col items-center gap-2">
        <h1 className="font-display text-heading sm:text-display font-semibold italic leading-[1.1] text-foreground text-balance">
          Ah Mah is prepping the ingredients&hellip;
        </h1>
        <CyclingTip />
      </div>

      <LoadingDots className="mt-2" />
    </div>
  );
}
