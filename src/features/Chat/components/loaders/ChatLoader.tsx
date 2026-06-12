'use client';

import { usePhaseAfter } from '@/features/shared/components/loaders';
import React, { useMemo } from 'react';
import { getRandomNormalisedPhrase } from '../../utils';
import { StatusStream } from './StatusStream';
import { Typing } from './Typing';

// Dots give way to the segmented progress indicator after this long. Kept short
// so the indicator shows on nearly every generation; sub-threshold replies show
// only dots, so there's no progress flash.
const SLOW_THRESHOLD_MS = 2000;

interface ChatLoaderProps {
  submittedAt: number | null;
}

export function ChatLoader({ submittedAt }: ChatLoaderProps) {
  // Pick a stable phrase per submit
  const phrase = useMemo(
    () => getRandomNormalisedPhrase(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [submittedAt],
  );

  const slow = usePhaseAfter(submittedAt, SLOW_THRESHOLD_MS);

  const inner: React.ReactNode = slow ? <StatusStream /> : <Typing phrase={phrase} />;

  return <div data-testid="loader-ghost">{inner}</div>;
}
