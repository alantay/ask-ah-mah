import { cn } from "@/lib/utils";

/**
 * The put-away bowl — the quiet counterpart to {@link BowlMark}. Same bowl
 * geometry, same palette tokens, with every cooking signal removed:
 * no broth fill, no steam, no bubbles, no chopsticks standing in the food. What
 * is left is the bowl and nothing in it, which is the whole message.
 *
 * An earlier pass laid chopsticks across the rim. Drawn, they read as sliding
 * off the bowl rather than set down, and tangled with the rim stroke — the
 * subtraction says "finished" more clearly than any added prop.
 *
 * Deliberately still: `BowlMark` steams, bubbles and sways because it means
 * *something is cooking*. This mark means the opposite — the dish is gone — so
 * it carries no motion at all, and needs no reduced-motion handling.
 *
 * The paths keep BowlMark's coordinates, but the viewBox crops to them. Most of
 * BowlMark's 200-square is headroom for steam this mark doesn't draw, and
 * inheriting it left the bowl rendering at a third of its box — a smudge that
 * read as an accident. Cropping means callers size the ink, not the padding, so
 * set a width and let the height follow.
 */
export function EmptyBowlMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="34 87 132 70"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary", className)}
      role="presentation"
    >
      {/* Bowl body */}
      <path
        d="M40,100 Q40,150 100,150 Q160,150 160,100 Z"
        className="fill-card"
        stroke="currentColor"
        strokeWidth={4}
      />
      {/* Rim — carries `fill-card` where BowlMark fills it with broth, so the
          bowl reads as hollow rather than full */}
      <path
        d="M40,100 Q100,115 160,100 Q100,85 40,100"
        className="fill-card"
        stroke="currentColor"
        strokeWidth={2}
      />
    </svg>
  );
}
