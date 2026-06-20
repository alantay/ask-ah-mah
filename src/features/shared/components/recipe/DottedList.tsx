import { cn } from "@/lib/utils";

/**
 * Dotted bullet list — prep ("Before you start") and whole-dish notes on both
 * recipe surfaces. Canonical style is the aligned reference treatment: a
 * right-aligned `·` marker in a fixed gutter, serif body, dashed dividers.
 */
export function DottedList({
  items,
  className,
}: {
  items: string[];
  className?: string;
}) {
  return (
    <ul className={cn("list-none p-0 m-0 flex flex-col", className)}>
      {items.map((item, i) => (
        <li
          key={i}
          className="flex gap-3 items-baseline py-2 border-b border-dashed border-border last:border-none"
        >
          <span className="font-mono text-[13px] font-bold text-ink-faint tabular-nums shrink-0 w-5 text-right">
            ·
          </span>
          <span className="flex-1 font-display text-[15px] text-foreground leading-[1.45]">
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}
