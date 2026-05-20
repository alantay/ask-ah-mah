"use client";

import { ShimmerLine } from "@/features/Chat/components/loaders/ShimmerLine";

const WIDTHS = ["72%", "58%", "80%", "64%", "52%"];

export function ConversationListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {WIDTHS.map((w, i) => (
        <div key={i} className="rounded-[10px] p-3 border border-transparent">
          <ShimmerLine width={w} height={16} delay={i * 0.07} />
        </div>
      ))}
    </div>
  );
}
