'use client';

import { MessageAvatar } from '@/components/ai-elements/message';
import { useReducedMotion } from './useReducedMotion';

interface TypingProps {
  phrase: string;
}

export function Typing({ phrase }: TypingProps) {
  const reduced = useReducedMotion();

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', maxWidth: 560 }}>
      <MessageAvatar src="/granny-avatar.png" name="👵" className="size-9 mt-0.5 shrink-0" />
      <div style={{ flex: 1 }}>
        {/* Eyebrow */}
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--muted-foreground)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 6,
          }}
        >
          <span>Ah Mah</span>
          <span
            style={{
              fontWeight: 400,
              color: 'var(--ink-faint)',
              letterSpacing: '0.02em',
              textTransform: 'none',
              fontStyle: 'italic',
              animation: reduced ? 'none' : 'ahmah-pulse-soft 1.6s ease-in-out infinite',
            }}
          >
            · {phrase}
          </span>
        </div>

        {/* Dots bubble */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '12px 16px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '14px 14px 14px 4px',
            boxShadow: '0 1px 0 var(--border-soft)',
          }}
        >
          {[0, 1, 2].map(i => (
            <span
              key={i}
              style={{
                width: 7,
                height: 7,
                borderRadius: 999,
                background: 'var(--primary)',
                display: 'inline-block',
                animation: reduced
                  ? 'none'
                  : `ahmah-dot 1.4s ease-in-out ${i * 0.16}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
