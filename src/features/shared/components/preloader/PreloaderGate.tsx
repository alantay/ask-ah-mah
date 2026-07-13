'use client';

import { useEffect, useState } from 'react';
import { useSessionContext } from '@/contexts/SessionContext';
import { AppPreloader } from './AppPreloader';

// Held a beat past a warm session so the splash never flashes; on a true first
// visit (anonymous sign-in + pantry seed) the session is the longer pole and
// this floor is invisible. Fade must match `duration-400` in AppPreloader.
const MIN_VISIBLE_MS = 700;
const FADE_MS = 400;

/**
 * Curtain over the whole app surface until the guest session is ready. Renders
 * children underneath the whole time, so the app hydrates and its panels start
 * fetching behind the splash — when the curtain lifts, content is already warm.
 * Lives inside the `(app)` route group only, so the public `/r` share route
 * (no session providers) is never gated.
 */
export function PreloaderGate({ children }: { children: React.ReactNode }) {
  const { isLoading, userId } = useSessionContext();
  const ready = !isLoading && !!userId;

  const [minElapsed, setMinElapsed] = useState(false);
  const [unmounted, setUnmounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), MIN_VISIBLE_MS);
    return () => clearTimeout(t);
  }, []);

  const hidden = ready && minElapsed;

  // Keep the splash mounted through the fade, then drop it entirely.
  useEffect(() => {
    if (!hidden) return;
    const t = setTimeout(() => setUnmounted(true), FADE_MS);
    return () => clearTimeout(t);
  }, [hidden]);

  return (
    <>
      {children}
      {!unmounted && <AppPreloader hidden={hidden} />}
    </>
  );
}
