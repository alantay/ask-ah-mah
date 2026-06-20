import { cn } from "@/lib/utils";

/**
 * Foundation specimen — the semantic color roles, grouped. Each swatch renders
 * the live `var(--color-*)` value, so it always reflects the current theme
 * (light or dark). Reference card for the design system; not used by the app.
 */
type Swatch = { name: string; token: string };
type Group = { label: string; swatches: Swatch[] };

const GROUPS: Group[] = [
  {
    label: "Brand",
    swatches: [
      { name: "primary", token: "--color-primary" },
      { name: "primary-deep", token: "--color-primary-deep" },
      { name: "primary-tint", token: "--color-primary-tint" },
      { name: "secondary", token: "--color-secondary" },
      { name: "secondary-deep", token: "--color-secondary-deep" },
      { name: "tertiary", token: "--color-tertiary" },
      { name: "jade", token: "--color-jade" },
      { name: "jade-deep", token: "--color-jade-deep" },
    ],
  },
  {
    label: "Surface",
    swatches: [
      { name: "background", token: "--color-background" },
      { name: "foreground", token: "--color-foreground" },
      { name: "card", token: "--color-card" },
      { name: "muted", token: "--color-muted" },
      { name: "muted-foreground", token: "--color-muted-foreground" },
      { name: "accent", token: "--color-accent" },
      { name: "chat", token: "--color-chat" },
      { name: "popover", token: "--color-popover" },
    ],
  },
  {
    label: "Line & ink",
    swatches: [
      { name: "border", token: "--color-border" },
      { name: "border-soft", token: "--color-border-soft" },
      { name: "input", token: "--color-input" },
      { name: "ring", token: "--color-ring" },
      { name: "ink-faint", token: "--color-ink-faint" },
    ],
  },
  {
    label: "Semantic",
    swatches: [
      { name: "callout", token: "--color-callout" },
      { name: "danger", token: "--color-danger" },
      { name: "danger-border", token: "--color-danger-border" },
      { name: "danger-tint", token: "--color-danger-tint" },
      { name: "destructive", token: "--color-destructive" },
    ],
  },
  {
    label: "Sidebar",
    swatches: [
      { name: "sidebar", token: "--color-sidebar" },
      { name: "sidebar-foreground", token: "--color-sidebar-foreground" },
      { name: "sidebar-accent", token: "--color-sidebar-accent" },
      { name: "sidebar-primary", token: "--color-sidebar-primary" },
      { name: "sidebar-border", token: "--color-sidebar-border" },
    ],
  },
];

export function ColorTokens({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {GROUPS.map((group) => (
        <section key={group.label} className="flex flex-col gap-2.5">
          <h3 className="font-sans text-eyebrow font-bold tracking-[0.16em] uppercase text-ink-faint">
            {group.label}
          </h3>
          <div className="flex flex-wrap gap-3">
            {group.swatches.map((s) => (
              <div key={s.token} className="flex flex-col gap-1.5 w-24">
                <div
                  className="h-14 w-full rounded-lg border border-border"
                  style={{ background: `var(${s.token})` }}
                />
                <div className="font-mono text-micro leading-tight text-foreground break-all">
                  {s.name}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
