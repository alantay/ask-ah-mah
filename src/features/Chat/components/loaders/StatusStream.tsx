'use client';

import { MessageAvatar } from '@/components/ai-elements/message';
import { useEffect, useState } from 'react';
import { STATUS_LINES } from '../../constants';
import { useReducedMotion } from './useReducedMotion';

export function StatusStream() {
  const reduced = useReducedMotion();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % STATUS_LINES.length), 1600);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', maxWidth: 560 }}>
      <MessageAvatar src="/granny-avatar.png" name="👵" className="size-9 mt-0.5 shrink-0" />
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--muted-foreground)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          Ah Mah
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '14px 14px 14px 4px',
            boxShadow: '0 1px 0 var(--border-soft)',
            minWidth: 260,
          }}
        >
          {/* Spinner ring */}
          <div style={{ position: 'relative', width: 22, height: 22, flexShrink: 0 }}>
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              style={{
                animation: reduced ? 'none' : 'ahmah-pulse-soft 1.6s ease-in-out infinite',
              }}
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
                style={{
                  transformOrigin: '11px 11px',
                  animation: reduced ? 'none' : 'ahmah-spin 1.2s linear infinite',
                }}
              />
            </svg>
          </div>

          {/* Cycling status text */}
          <div style={{ flex: 1, position: 'relative', minHeight: 22 }}>
            {STATUS_LINES.map((line, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  fontFamily: 'Fraunces, serif',
                  fontStyle: 'italic',
                  fontSize: 15,
                  color: 'var(--foreground)',
                  opacity: i === idx ? 1 : 0,
                  transform: reduced ? 'none' : (i === idx ? 'translateY(0)' : 'translateY(4px)'),
                  transition: reduced ? 'opacity 0.2s ease' : 'opacity 0.4s ease, transform 0.4s ease',
                }}
              >
                {line}
              </div>
            ))}
          </div>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10, marginLeft: 4 }}>
          {STATUS_LINES.map((_, i) => (
            <div
              key={i}
              style={{
                width: 22,
                height: 3,
                borderRadius: 2,
                background: i <= idx ? 'var(--primary)' : 'var(--border-soft)',
                transition: 'background 0.4s ease',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
