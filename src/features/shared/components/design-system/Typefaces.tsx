import { cn } from "@/lib/utils";

/**
 * Foundation specimen — the three typefaces. Each renders a sample in the live
 * `var(--font-*)` family with its role. Reference card; not used by the app.
 */
type Face = {
  name: string;
  token: string;
  label: string;
  use: string;
  sample: string;
};

const FACES: Face[] = [
  {
    name: "display",
    token: "--font-display",
    label: "Fraunces",
    use: "Headings & recipe voice — warm serif",
    sample: "Ah Mah’s kitchen",
  },
  {
    name: "sans",
    token: "--font-sans",
    label: "Inter",
    use: "Body & UI — neutral, legible",
    sample: "What to gather",
  },
  {
    name: "logo",
    token: "--font-logo",
    label: "Nunito",
    use: "Wordmark only — rounded, friendly",
    sample: "Ask Ah Mah",
  },
];

export function Typefaces({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {FACES.map((face) => (
        <div key={face.token} className="flex flex-col gap-1 border-b border-border pb-4 last:border-none">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-dense font-semibold text-foreground">
              {face.name}
            </span>
            <span className="font-mono text-micro text-ink-faint">
              {face.label}
            </span>
          </div>
          <div
            className="text-foreground leading-tight"
            style={{ fontFamily: `var(${face.token})`, fontSize: "28px" }}
          >
            {face.sample}
          </div>
          <div className="font-sans text-micro text-muted-foreground">
            {face.use}
          </div>
        </div>
      ))}
    </div>
  );
}
