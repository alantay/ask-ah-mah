'use client';

import { useReducedMotion } from './useReducedMotion';
import { ShimmerLine } from './ShimmerLine';

export function SkeletonRecipeCard() {
  const reduced = useReducedMotion();

  const shimmerStep = (): React.CSSProperties => ({
    flexShrink: 0,
    width: 26,
    height: 26,
    background: reduced
      ? 'var(--border)'
      : `linear-gradient(90deg, oklch(0.92 0.025 75) 0%, oklch(0.97 0.020 80) 50%, oklch(0.92 0.025 75) 100%)`,
    backgroundSize: reduced ? undefined : '200% 100%',
    borderRadius: '50% 50% 50% 6px',
    animation: reduced ? 'none' : 'ahmah-shimmer 1.8s ease-in-out infinite',
  });

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '18px 20px',
        maxWidth: '100%',
        marginTop: 10,
        position: 'relative',
        boxShadow: '0 1px 0 var(--border-soft), 0 14px 24px -22px oklch(0.3 0.05 50 / 0.5)',
      }}
    >
      {/* corner tab */}
      <div
        style={{
          position: 'absolute',
          top: -1,
          right: 22,
          width: 28,
          height: 14,
          background: 'var(--primary)',
          borderRadius: '0 0 4px 4px',
          boxShadow: 'inset 0 -1px 0 oklch(0.45 0.12 32)',
        }}
      />

      {/* eyebrow + pen glyph */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--primary)',
          }}
        >
          Ah Mah is writing it out
        </div>
        <svg
          width="13"
          height="13"
          viewBox="0 0 16 16"
          fill="none"
          style={{
            transformOrigin: '14px 14px',
            animation: reduced ? 'none' : 'ahmah-pen 1.2s ease-in-out infinite',
          }}
        >
          <style>{`@keyframes ahmah-pen {
            0%   { transform: translateX(0) rotate(-8deg); }
            50%  { transform: translateX(2px) rotate(-6deg); }
            100% { transform: translateX(0) rotate(-8deg); }
          }`}</style>
          <path
            d="M1.5 14.5 L4 12 L12 4 L14 6 L6 14 L3.5 14.5 Z"
            fill="var(--secondary)"
            stroke="var(--foreground)"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <path d="M11 5 L13 7" stroke="var(--primary)" strokeWidth="1" />
        </svg>
      </div>

      {/* title skeleton */}
      <ShimmerLine width="78%" height={22} />
      <div style={{ height: 8 }} />
      <ShimmerLine width="58%" height={14} delay={0.1} />

      {/* meta strip */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginTop: 16,
          marginBottom: 16,
          padding: '10px 12px',
          background: 'var(--chat)',
          border: '1px solid var(--border-soft)',
          borderRadius: 8,
        }}
      >
        <ShimmerLine width={60} height={10} delay={0.15} />
        <ShimmerLine width={60} height={10} delay={0.2} />
        <ShimmerLine width={60} height={10} delay={0.25} />
      </div>

      {/* ingredients */}
      <div
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--muted-foreground)',
          marginBottom: 10,
        }}
      >
        Ingredients
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px 24px',
          marginBottom: 18,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShimmerLine width={48} height={11} delay={i * 0.05} />
            <ShimmerLine width={`${60 + (i % 3) * 12}%`} height={11} delay={i * 0.05 + 0.05} />
          </div>
        ))}
      </div>

      {/* method */}
      <div
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--muted-foreground)',
          marginBottom: 10,
        }}
      >
        Method
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={shimmerStep()} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <ShimmerLine width="90%" height={11} delay={i * 0.1} />
              <ShimmerLine width="70%" height={11} delay={i * 0.1 + 0.05} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
