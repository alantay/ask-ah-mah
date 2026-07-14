'use client';

import { ShimmerLine } from './ShimmerLine';

// Ghost of a short back-and-forth, shown while a just-switched-to conversation's
// saved history loads. Replaces the split-second flash of the lone
// INITIAL_MESSAGE welcome (see Chat.tsx). Reads as a chat: Ah Mah's turns sit
// left, the user's turns sit right in the secondary bubble. A single delay
// cascade (see delays below) sweeps the shimmer top-to-bottom so the exchange
// settles in rather than popping as a grid of placeholders.

// Ah Mah's turn: left-anchored soft text-lines, optionally led by a faint
// "Ah Mah" eyebrow (echoing the Typing loader).
function AssistantTurn({
  widths,
  startDelay,
  eyebrow = false,
}: {
  widths: string[];
  startDelay: number;
  eyebrow?: boolean;
}) {
  return (
    <div className="flex w-full flex-col items-start gap-2.5">
      {eyebrow && (
        <ShimmerLine width={68} height={10} delay={startDelay} className="rounded-full opacity-60" />
      )}
      {widths.map((width, i) => (
        <ShimmerLine
          key={i}
          width={width}
          height={14}
          delay={startDelay + (eyebrow ? i + 1 : i) * 0.09}
          className="rounded-full"
        />
      ))}
    </div>
  );
}

// User's turn: the real secondary bubble, right-aligned with its asymmetric tail.
function UserTurn({ width, delay }: { width: string; delay: number }) {
  return (
    <div className="flex w-full justify-end">
      <div className="max-w-[78%] rounded-tl-[14px] rounded-tr-[14px] rounded-br-[4px] rounded-bl-[14px] border border-border bg-muted px-4 py-3">
        <ShimmerLine width={width} height={13} delay={delay} className="rounded-full" />
      </div>
    </div>
  );
}

export function HistorySkeleton() {
  return (
    <div className="flex-1 overflow-hidden px-2 sm:p-4" role="status" aria-label="Loading conversation…">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <AssistantTurn eyebrow widths={['58%', '38%']} startDelay={0} />
        <UserTurn width="150px" delay={0.3} />
        <AssistantTurn widths={['66%', '48%', '30%']} startDelay={0.42} />
        <UserTurn width="110px" delay={0.78} />
        <AssistantTurn widths={['44%', '26%']} startDelay={0.9} />
      </div>
    </div>
  );
}
