"use client";

import { useState } from "react";
import { Share2, X } from "lucide-react";

/**
 * The dismissable prompt shown right after marking a recipe cooked (ADR-0022):
 * "Cooked this for someone? Send them the recipe, lah." Purely presentational —
 * the parent supplies `onShare` and decides when this should render at all.
 */
export function ShareCta({
  onShare,
  sharing,
}: {
  onShare: () => void;
  sharing?: boolean;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="mt-2 flex items-center gap-2">
      <button
        type="button"
        onClick={onShare}
        disabled={sharing}
        className="inline-flex items-center gap-1.5 font-sans text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Share2 className="size-3.5" aria-hidden />
        Cooked this for someone? Send them the recipe, lah.
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
