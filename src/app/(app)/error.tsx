"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

// Crash net for the app shell. This renders *inside* (app)/layout.tsx, so the
// sidebar and top bar survive and the failure is contained to the content pane
// — reset() then reads as a retry rather than a reload.
//
// It catches genuine render crashes, not data failures: the pages here are SWR
// clients, and SWR returns errors rather than throwing. So the page can't
// explain what happened, and shouldn't pretend to — in production Next redacts
// the message and leaves only a digest.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // The digest is the only handle on this in production — without it there's
  // nothing to correlate against the server log.
  useEffect(() => {
    console.error("App render error:", error.digest ?? error);
  }, [error]);

  return (
    <div className="paper flex flex-1 flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <h1 className="font-display text-heading font-semibold italic leading-[1.1] text-foreground text-balance">
        Aiyah &mdash; something burnt in the kitchen.
      </h1>
      <p className="font-display italic text-emphasis text-muted-foreground">
        Not your fault. Give it another go?
      </p>
      <Button
        variant="cta"
        onClick={reset}
        className="px-5 py-2.5 text-sm font-semibold"
      >
        Try again
      </Button>
    </div>
  );
}
