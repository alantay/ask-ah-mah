'use client';

import { useReducedMotion } from './useReducedMotion';

interface ShimmerLineProps {
  width?: string | number;
  height?: number;
  delay?: number;
}

export function ShimmerLine({ width = '100%', height = 12, delay = 0 }: ShimmerLineProps) {
  const reduced = useReducedMotion();
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 4,
        background: reduced
          ? 'var(--border)'
          : `linear-gradient(90deg,
              oklch(0.92 0.025 75) 0%,
              oklch(0.97 0.020 80) 50%,
              oklch(0.92 0.025 75) 100%)`,
        backgroundSize: reduced ? undefined : '200% 100%',
        animation: reduced ? 'none' : `ahmah-shimmer 1.8s ease-in-out ${delay}s infinite`,
      }}
    />
  );
}
