"use client";

import Image from "next/image";

import { Stamp } from "@/features/shared/components/Stamp";

import { SUGGESTIONS } from "../constants";

// The three example openers, echoing the initial greeting bullets. Tapping one
// sends it straight to Ah Mah as a quick start.
const PROMPTS = [
  { label: "What you have", example: "Got some chicken and rice" },
  { label: "Your tools", example: "I have a wok" },
  { label: "Or just ask", example: "What can I make for dinner?" },
] as const;

const chip =
  "inline-flex items-center min-h-11 px-3.5 text-xs text-muted-foreground border border-border rounded-full hover:border-border-soft hover:text-foreground transition-colors cursor-pointer";

interface ChatEmptyStateProps {
  onSend: (text: string) => void;
  onCookWith: () => void;
}

/**
 * First-run hero — the composed welcome shown while a chat has no messages yet.
 * Fills the chat column (which would otherwise be a tall empty void on desktop)
 * with a stamped Ah Mah mark, the greeting, three tappable opener cards, and the
 * quick-start chips. Once the first message is sent, the normal message thread
 * takes over and the greeting reappears as Ah Mah's opening bubble.
 */
export function ChatEmptyState({ onSend, onCookWith }: ChatEmptyStateProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="min-h-full mx-auto flex w-full max-w-2xl flex-col items-center justify-center px-4 py-10 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Stamped Ah Mah mark */}
        <Stamp className="size-16 mb-5">
          <span className="relative size-10">
            <Image
              src="/granny-icon.png"
              alt="Ah Mah"
              fill
              className="object-contain"
            />
          </span>
        </Stamp>

        {/* Greeting */}
        <h1 className="font-display text-heading sm:text-display font-semibold tracking-tight leading-[1.1] text-foreground text-balance">
          Aiyoh, you&rsquo;re here &mdash;{" "}
          <span className="italic text-primary">good!</span>
        </h1>
        <p className="font-display italic text-emphasis sm:text-lg text-muted-foreground mt-2.5 leading-relaxed text-balance">
          I&rsquo;m Ah Mah. Tell me what&rsquo;s in your kitchen and we cook
          something together, can?
        </p>

        {/* Opener cards */}
        <div className="mt-7 grid w-full gap-2.5 text-left sm:grid-cols-3">
          {PROMPTS.map((p) => (
            <button
              key={p.label}
              onClick={() => onSend(p.example)}
              className="group flex min-h-[5.25rem] flex-col items-start gap-1.5 rounded-xl border border-border bg-card p-3.5 text-left shadow-[0_1px_0_var(--border-soft)] transition-all duration-150 hover:border-primary hover:shadow-[0_0_0_2px_oklch(0.56_0.135_35/0.14),0_1px_0_var(--border-soft)] cursor-pointer"
            >
              <span className="font-sans text-eyebrow font-bold uppercase tracking-[0.14em] text-ink-faint">
                {p.label}
              </span>
              <span className="font-display text-emphasis leading-snug text-foreground">
                &ldquo;{p.example}&rdquo;
              </span>
            </button>
          ))}
        </div>

        {/* Quick-start chips */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={onCookWith} className={chip}>
            🥬 Cook with what I have →
          </button>
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => onSend(s)} className={chip}>
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
