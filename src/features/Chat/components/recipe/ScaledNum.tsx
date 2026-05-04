'use client';

import { useEffect, useRef, useState } from 'react';

interface ScaledNumProps {
  children: string;
}

/**
 * Inline monospace span that pulses with a warm yellow flash whenever its value changes.
 * Used inside recipe ingredient prose to highlight scaled amounts.
 */
export function ScaledNum({ children }: ScaledNumProps) {
  const [pulseKey, setPulseKey] = useState(0);
  const prev = useRef(children);

  useEffect(() => {
    if (prev.current !== children) {
      setPulseKey(k => k + 1);
      prev.current = children;
    }
  }, [children]);

  return (
    <span
      key={pulseKey}
      className="font-mono not-italic font-semibold text-foreground bg-secondary/50 px-1 rounded-sm scaled-num-pulse"
      style={{ fontSize: '0.9em' }}
    >
      {children}
    </span>
  );
}
