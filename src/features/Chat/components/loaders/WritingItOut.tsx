'use client';

import { SkeletonRecipeCard } from './SkeletonRecipeCard';

export function WritingItOut() {
  return (
    <div className="max-w-2xl">
      <div className="min-w-0">
        <div className="font-display italic text-base text-foreground leading-relaxed mb-1">
          Let me write the whole thing out for you —
        </div>
        <SkeletonRecipeCard />
      </div>
    </div>
  );
}
