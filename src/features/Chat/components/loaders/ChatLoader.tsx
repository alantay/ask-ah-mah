'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { getRandomNormalisedPhrase } from '../../utils';
import { StatusStream } from './StatusStream';
import { Typing } from './Typing';
import { WritingItOut } from './WritingItOut';

const SLOW_THRESHOLD_MS = 6000;

interface ChatLoaderProps {
  submittedAt: number | null;
  expectingRecipe: boolean;
}

export function ChatLoader({ submittedAt, expectingRecipe }: ChatLoaderProps) {
  const [elapsed, setElapsed] = useState(0);

  // Pick a stable phrase per submit
  const phrase = useMemo(
    () => getRandomNormalisedPhrase(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [submittedAt],
  );

  useEffect(() => {
    if (!submittedAt || expectingRecipe) return;
    const t = setInterval(() => setElapsed(Date.now() - submittedAt), 500);
    return () => {
      clearInterval(t);
      setElapsed(0);
    };
  }, [submittedAt, expectingRecipe]);

  let inner: React.ReactNode;
  if (expectingRecipe) inner = <WritingItOut />;
  else if (elapsed >= SLOW_THRESHOLD_MS) inner = <StatusStream />;
  else inner = <Typing phrase={phrase} />;

  return <div data-testid="loader-ghost">{inner}</div>;
}
