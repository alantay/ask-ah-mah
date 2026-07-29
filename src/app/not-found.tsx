import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import Link from "next/link";

// The stray-URL 404. Unmatched URLs never enter the component tree — Next
// routes them to a synthetic /_not-found entry that renders this inside the
// root layout only — so there is no sidebar here and the page must supply its
// own way back.
//
// Deliberately plainer than the Retired Link page (r/not-found.tsx). Nothing
// was lost here; the user just typed something wrong, and in a three-route app
// that is almost entirely crawlers and stale bookmarks. Giving it the same
// weight would flatten the distinction the two pages exist to draw.

export const metadata: Metadata = {
  title: "Nothing cooking here",
};

export default function NotFound() {
  return (
    <main className="paper flex min-h-dvh flex-col items-center justify-center gap-5 bg-background px-6 text-center">
      <h1 className="font-display text-heading sm:text-display font-semibold italic leading-[1.1] text-foreground text-balance">
        Nothing cooking at this address.
      </h1>
      <Button
        asChild
        variant="cta"
        className="inline-flex gap-2 px-5 py-2.5 text-sm font-semibold"
      >
        <Link href="/">
          Back to the kitchen
          <span aria-hidden>→</span>
        </Link>
      </Button>
    </main>
  );
}
