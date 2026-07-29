"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

// Catch-all below the root layout, so Next's bare "Application error: a
// server-side exception has occurred" never ships. Its real job is the public
// share route (/r), which does a live DB read and will throw if Postgres is
// down — leaving a stranger on a raw error screen as their first impression of
// the app. In-app crashes are caught closer, by (app)/error.tsx.
//
// Deliberately the flattest of the error surfaces: it fires when we don't know
// where we are, so it doesn't reach for a kitchen metaphor it can't back up.
// (A crash in the root layout itself is still uncovered — that needs
// global-error.tsx, which would mean a second, provider-less design system.)
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root render error:", error.digest ?? error);
  }, [error]);

  return (
    <main className="paper flex min-h-dvh flex-col items-center justify-center gap-5 bg-background px-6 text-center">
      <h1 className="font-display text-heading sm:text-display font-semibold italic leading-[1.1] text-foreground text-balance">
        Aiyah, something went wrong.
      </h1>
      <Button
        variant="cta"
        onClick={reset}
        className="px-5 py-2.5 text-sm font-semibold"
      >
        Try again
      </Button>
    </main>
  );
}
