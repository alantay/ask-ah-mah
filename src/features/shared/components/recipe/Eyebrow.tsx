import { cn } from "@/lib/utils";

/**
 * Small-caps section label — the recipe surfaces' eyebrow treatment.
 *
 * Canonical typography (`tracking-[0.16em]`) with a quiet `ink-faint` default.
 * Pass `className` to override colour (e.g. `text-muted-foreground`) or layout
 * (e.g. `block mb-2`); `twMerge` resolves the conflict in favour of `className`.
 */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-sans text-eyebrow font-bold tracking-[0.16em] uppercase text-ink-faint",
        className,
      )}
    >
      {children}
    </span>
  );
}
