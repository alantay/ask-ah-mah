import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface MessageInputProps {
  onSendMessage: (message: string) => Promise<void>;
  disabled: boolean;
  // Overrides the form's default outer padding. Used by the first-run hero to
  // sit the composer flush with the opener cards instead of the bottom bar.
  className?: string;
  // Text to drop into the composer without sending — used by the recipe card's
  // "Ask Ah Mah for substitutions" nudge so the user can edit before sending.
  // The nonce forces a re-seed even when the same text is requested twice.
  seed?: { text: string; nonce: number } | null;
}

export const MessageInput = ({
  onSendMessage,
  disabled,
  className,
  seed,
}: MessageInputProps) => {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Seeding replaces whatever's in the composer (a fresh, self-contained ask),
  // then focuses with the cursor at the end so the user can trim or extend it.
  // rAF runs after the controlled value commits, so the cursor lands correctly.
  useEffect(() => {
    if (!seed) return;
    setInput(seed.text);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(seed.text.length, seed.text.length);
    });
  }, [seed]);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (input.trim()) {
          await onSendMessage(input);
          setInput("");
        }
      }}
      className={cn("p-4", className)}
    >
      <div className="flex gap-1 items-center bg-muted/50 rounded-xl border border-border/60 px-3 py-1 max-w-5xl mx-auto">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={disabled}
          placeholder={disabled ? "Sending…" : "Ask Ah Mah…"}
          className="flex-1 border-none shadow-none bg-transparent focus-visible:ring-0 px-0"
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Send message"
          variant={input.trim() ? "default" : "ghost"}
          className="shrink-0 disabled:cursor-not-allowed rounded-lg h-11 w-11"
          disabled={disabled || !input.trim()}
        >
          <svg
            aria-hidden="true"
            focusable="false"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20.235 5.68609C20.667 4.49109 19.509 3.33309 18.314 3.76609L3.70904 9.04809C2.51004 9.48209 2.36504 11.1181 3.46804 11.7571L8.13004 14.4561L12.293 10.2931C12.4816 10.1109 12.7342 10.0101 12.9964 10.0124C13.2586 10.0147 13.5095 10.1199 13.6949 10.3053C13.8803 10.4907 13.9854 10.7415 13.9877 11.0037C13.99 11.2659 13.8892 11.5185 13.707 11.7071L9.54404 15.8701L12.244 20.5321C12.882 21.6351 14.518 21.4891 14.952 20.2911L20.235 5.68609Z"
              fill="currentColor"
            />
          </svg>
        </Button>
      </div>
    </form>
  );
};
