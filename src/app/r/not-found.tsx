import { Button } from "@/components/ui/button";
import { EmptyBowlMark } from "@/features/shared/components/EmptyBowlMark";
import type { Metadata } from "next";
import Link from "next/link";

// The Retired Link page — a Shared Link whose recipe the owner threw away.
// Catches the notFound() from r/[token]/page.tsx.
//
// Built to the same skeleton as the stray-URL 404 (app/not-found.tsx): centred
// column, one heading, one way out. The two pages still mean different things —
// "you typed something wrong" versus "something real was here" — but that
// distinction is carried by the words and the mark, not by extra furniture.
//
// The one line of body copy is not decoration. The reader is a Recipient: a
// stranger holding a link a friend sent, who has never seen this app. Without
// it, "Cook with what you have" is a non sequitur. It also names *who* put the
// recipe away, so the dead link doesn't read as a broken site.
//
// The page speaks about Ah Mah rather than as her, and says "put away" rather
// than the owner's own word for it ("thrown away"), which would make the person
// who shared the link look careless. See CONTEXT.md § Retired Link.

export const metadata: Metadata = {
  title: "This one's been put away",
  robots: { index: false, follow: false },
};

export default function RetiredLinkPage() {
  return (
    <main className="paper flex min-h-dvh flex-col items-center justify-center gap-5 bg-background px-6 text-center">
      <EmptyBowlMark className="w-28" />
      <h1 className="font-display text-heading sm:text-display font-semibold italic leading-[1.1] text-foreground text-balance">
        This one&rsquo;s been put away.
      </h1>
      {/* "Ah Mah" is a name — never let it break across lines. */}
      <p className="max-w-md font-display italic text-emphasis text-muted-foreground text-balance">
        The cook took it out of their cookbook. Tell{" "}
        <span className="whitespace-nowrap">Ah Mah</span> what&rsquo;s in your
        kitchen and she&rsquo;ll cook up another.
      </p>
      <Button
        asChild
        variant="cta"
        className="inline-flex gap-2 px-5 py-2.5 text-sm font-semibold"
      >
        <Link href="/">
          Cook with what you have
          <span aria-hidden>→</span>
        </Link>
      </Button>
    </main>
  );
}
