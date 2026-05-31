"use client";

import { ShimmerLine } from "@/features/Chat/components/loaders/ShimmerLine";

// Section eyebrows stay visible during load so the rail's spine never collapses.
// Widths vary 40–80% to mimic real title rhythm.

function SkeletonRow({ width, delay }: { width: string; delay: number }) {
  return (
    <div className="rounded-[10px] p-3 border border-transparent">
      <ShimmerLine width={width} height={14} delay={delay} />
    </div>
  );
}

export function ConversationListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="font-sans text-eyebrow font-bold tracking-[0.18em] uppercase text-ink-faint mb-1.5 px-0.5">
          Today
        </div>
        <div className="flex flex-col gap-2">
          <SkeletonRow width="72%" delay={0} />
          <SkeletonRow width="55%" delay={0.08} />
        </div>
      </div>
      <div>
        <div className="font-sans text-eyebrow font-bold tracking-[0.18em] uppercase text-ink-faint mb-1.5 px-0.5">
          Earlier
        </div>
        <div className="flex flex-col gap-2">
          <SkeletonRow width="80%" delay={0.16} />
          <SkeletonRow width="63%" delay={0.24} />
          <SkeletonRow width="48%" delay={0.32} />
          <SkeletonRow width="75%" delay={0.40} />
        </div>
      </div>
    </div>
  );
}
