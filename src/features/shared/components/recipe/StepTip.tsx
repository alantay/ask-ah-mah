/**
 * Ah Mah's per-step aside — an ochre left-bar callout prefixed with an em-dash.
 * Shared signature across the chat letter and cookbook reference surfaces.
 */
export function StepTip({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 pl-3 border-l-[3px] border-callout font-display italic text-sm text-muted-foreground leading-relaxed">
      — {children}
    </div>
  );
}
