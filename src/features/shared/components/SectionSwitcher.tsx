"use client";

import type { ReactNode } from "react";
import type { Section } from "@/hooks/useActiveSection";

export interface SectionDef {
  id: Section;
  /** Wrapper classes for this Section's panel (layout, background, borders). */
  className?: string;
  panel: ReactNode;
}

interface SectionSwitcherProps {
  active: Section;
  sections: SectionDef[];
}

/**
 * Shows one Section's panel and hides the rest. Every panel stays mounted —
 * inactive ones are hidden via the native `hidden` attribute — so in-flight
 * state (e.g. the chat stream) survives switching Sections. See ADR-0019.
 *
 * This is a deliberate, honest replacement for the Radix `Tabs` primitive:
 * there is no tab strip in this app (navigation lives in the sidebar), so the
 * tab semantics (`role="tablist"`/`"tab"`/`"tabpanel"`) don't apply. This
 * renders plain mounted-and-hidden panels instead.
 */
export function SectionSwitcher({ active, sections }: SectionSwitcherProps) {
  return (
    <>
      {sections.map(({ id, className, panel }) => (
        <div key={id} hidden={id !== active} className={className}>
          {panel}
        </div>
      ))}
    </>
  );
}
