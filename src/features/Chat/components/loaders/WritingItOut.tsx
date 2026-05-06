'use client';

import { MessageAvatar } from '@/components/ai-elements/message';
import { SkeletonRecipeCard } from './SkeletonRecipeCard';

export function WritingItOut() {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', maxWidth: 600 }}>
      <MessageAvatar src="/granny-avatar.png" name="👵" className="size-9 mt-0.5 shrink-0" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--muted-foreground)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          Ah Mah · just a moment
        </div>
        <div
          style={{
            fontFamily: 'Fraunces, serif',
            fontStyle: 'italic',
            fontSize: 16,
            color: 'var(--foreground)',
            lineHeight: 1.5,
            marginBottom: 4,
          }}
        >
          Let me write the whole thing out for you —
        </div>
        <SkeletonRecipeCard />
      </div>
    </div>
  );
}
