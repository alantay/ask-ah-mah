import { cn } from "@/lib/utils";

/**
 * Serif section heading used on the cookbook reference surface
 * ("What to gather", "Method", "Notes"…). Pass margins via `className`.
 */
export function SectionHeading({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "font-display font-semibold text-[24px] sm:text-[26px] text-foreground tracking-tight m-0",
        className,
      )}
    >
      {children}
    </h2>
  );
}
