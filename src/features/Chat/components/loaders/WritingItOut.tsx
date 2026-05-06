'use client';

import { MessageAvatar } from '@/components/ai-elements/message';
import { SkeletonRecipeCard } from './SkeletonRecipeCard';

export function WritingItOut() {
  return (
    <div className="flex gap-3 items-start max-w-2xl">
      <MessageAvatar src="/granny-avatar.png" name="👵" className="size-9 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-sans text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-1">
          Ah Mah · just a moment
        </div>
        <div className="font-display italic text-base text-foreground leading-relaxed mb-1">
          Let me write the whole thing out for you —
        </div>
        <SkeletonRecipeCard />
      </div>
    </div>
  );
}
