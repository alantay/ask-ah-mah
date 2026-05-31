"use client";

import { ShimmerLine } from "@/features/Chat/components/loaders/ShimmerLine";

function SkeletonRow({ width, delay }: { width: string; delay: number }) {
  return (
    <div className="rounded-[10px] p-3 border border-transparent">
      <ShimmerLine width={width} height={14} delay={delay} />
    </div>
  );
}

export function ConversationListSkeleton() {
  const rows: Array<{ width: string; delay: number }> = [
    { width: "72%", delay: 0 },
    { width: "55%", delay: 0.08 },
    { width: "80%", delay: 0.16 },
    { width: "63%", delay: 0.24 },
    { width: "48%", delay: 0.32 },
    { width: "75%", delay: 0.4 },
  ];

  return (
    <div className="flex flex-col gap-2">
      {rows.map((r, i) => (
        <SkeletonRow key={i} width={r.width} delay={r.delay} />
      ))}
    </div>
  );
}
