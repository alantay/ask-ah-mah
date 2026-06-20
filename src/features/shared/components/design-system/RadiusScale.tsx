import { cn } from "@/lib/utils";

/**
 * Foundation specimen — the radius scale, derived from a single `--radius` base
 * (0.625rem). Each tile renders the live `var(--radius-*)` value. Reference
 * card; not used by the app.
 */
type Radius = { name: string; token: string; note: string };

const RADII: Radius[] = [
  { name: "sm", token: "--radius-sm", note: "base − 4px" },
  { name: "md", token: "--radius-md", note: "base − 2px" },
  { name: "lg", token: "--radius-lg", note: "0.625rem (base)" },
  { name: "xl", token: "--radius-xl", note: "base + 4px" },
];

export function RadiusScale({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-5", className)}>
      {RADII.map((r) => (
        <div key={r.token} className="flex flex-col gap-2 w-24">
          <div
            className="h-16 w-full border border-border bg-primary-tint"
            style={{ borderRadius: `var(${r.token})` }}
          />
          <div className="flex flex-col">
            <span className="font-mono text-dense font-semibold text-foreground">
              {r.name}
            </span>
            <span className="font-mono text-micro text-ink-faint">{r.note}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
