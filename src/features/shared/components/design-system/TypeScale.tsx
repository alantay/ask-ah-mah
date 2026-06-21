import { cn } from "@/lib/utils";

/**
 * Foundation specimen — the named type scale. Each row renders sample text at
 * the live `var(--text-*)` size with its intended use. Reference card; not used
 * by the app.
 */
type Step = {
  name: string;
  token: string;
  px: string;
  use: string;
  display?: boolean;
};

const STEPS: Step[] = [
  { name: "display", token: "--text-display", px: "40 / 1.0", use: "Hero, recipe title", display: true },
  { name: "heading", token: "--text-heading", px: "22 / 1.15", use: "Section headings", display: true },
  { name: "emphasis", token: "--text-emphasis", px: "15 / 1.5", use: "Body, ingredient names" },
  { name: "dense", token: "--text-dense", px: "13 / 1.4", use: "Quantities, dense labels" },
  { name: "micro", token: "--text-micro", px: "11 / 1.35", use: "Meta rows, counts" },
  { name: "eyebrow", token: "--text-eyebrow", px: "10 / 1.4", use: "Eyebrows (uppercase, tracked)" },
];

export function TypeScale({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col divide-y divide-border", className)}>
      {STEPS.map((step) => (
        <div key={step.token} className="flex items-baseline gap-5 py-3">
          <div className="w-28 shrink-0">
            <div className="font-mono text-dense font-semibold text-foreground">
              {step.name}
            </div>
            <div className="font-mono text-micro text-ink-faint">{step.px}</div>
          </div>
          <div
            className={cn(
              "flex-1 text-foreground leading-none",
              step.display ? "font-display" : "font-sans",
            )}
            style={{ fontSize: `var(${step.token})` }}
          >
            Ah Mah&rsquo;s kitchen
          </div>
          <div className="w-44 shrink-0 font-sans text-micro text-muted-foreground text-right self-center">
            {step.use}
          </div>
        </div>
      ))}
    </div>
  );
}
