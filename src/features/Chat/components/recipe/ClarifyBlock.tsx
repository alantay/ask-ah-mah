'use client';

import { ClarifyBlockData, ClarifyOption } from '@/lib/recipes/schemas';
import { cn } from '@/lib/utils';
import { TextUIPart, UIMessage } from 'ai';

interface ClarifyBlockProps {
  // Partial during progressive reveal — question/options fill in as the JSON streams.
  data: Partial<ClarifyBlockData>;
  allMessages: UIMessage[];
  messageIndex: number;
  onSend: (text: string) => void;
  // While true the block is still streaming: options may be incomplete and the
  // picked/locked state is suppressed (mirrors SuggestionsBlock).
  isStreaming?: boolean;
}

// A clarify answer is a canned user message: tapping an option sends its `label`.
// So we recover which option was picked exactly like suggestions — scan the user
// messages that came AFTER this block for one whose text matches an option label.
function derivePickedId(
  options: ClarifyOption[],
  allMessages: UIMessage[],
  messageIndex: number
): string | null {
  const laterMessages = allMessages.slice(messageIndex + 1);
  for (const msg of laterMessages) {
    if (msg.role !== 'user') continue;
    const text =
      msg.parts
        ?.filter((p): p is TextUIPart => p.type === 'text')
        .map(p => p.text)
        .join('') ?? '';
    for (const opt of options) {
      if (text.toLowerCase().includes(opt.label.toLowerCase())) {
        return opt.id;
      }
    }
  }
  return null;
}

interface ClarifyCardProps {
  option: ClarifyOption;
  isPicked: boolean;
  isDimmed: boolean;
  onSend: (text: string) => void;
  isStreaming?: boolean;
}

function ClarifyCard({ option, isPicked, isDimmed, onSend, isStreaming = false }: ClarifyCardProps) {
  // Tap = send the option's label as the user's reply (single-select, approved
  // behaviour). The whole card is the control. Suppressed while streaming and
  // once an answer is locked in.
  const locked = isStreaming || isDimmed || isPicked;

  return (
    <button
      type="button"
      onClick={() => onSend(option.label)}
      disabled={locked}
      className={cn(
        'w-full text-left bg-card rounded-xl px-4 py-3 relative transition-all duration-180 flex items-center gap-3',
        isPicked
          ? 'border border-primary shadow-[0_0_0_2px_oklch(0.56_0.135_35/0.18),0_1px_0_var(--border-soft)]'
          : 'border border-border shadow-[0_1px_0_var(--border-soft),0_14px_24px_-22px_oklch(0.3_0.05_50/0.4)]',
        isDimmed ? 'opacity-50' : 'opacity-100',
        locked ? 'cursor-default' : 'cursor-pointer hover:border-primary/60'
      )}
    >
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span className="font-display font-semibold text-lg text-foreground leading-tight tracking-tight">
          {option.label}
        </span>
        {option.hint && (
          <span className="font-display italic text-sm text-muted-foreground leading-relaxed">
            {option.hint}
          </span>
        )}
      </div>
      {isPicked && (
        <span className="font-sans text-xs font-semibold text-primary-deep shrink-0">✓ Picked</span>
      )}
    </button>
  );
}

export function ClarifyBlock({
  data,
  allMessages,
  messageIndex,
  onSend,
  isStreaming = false,
}: ClarifyBlockProps) {
  // Streaming partials may omit question/options entirely; default them so the
  // same render path serves both the live and the final view (ADR-0009).
  const question = data.question ?? '';
  const options = data.options ?? [];

  const pickedId = isStreaming ? null : derivePickedId(options, allMessages, messageIndex);

  return (
    <div className="min-w-0">
      {/* Question */}
      <div className="font-display italic text-lg leading-relaxed text-foreground mb-3">
        {question}
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2.5">
        {options.map(option => (
          <ClarifyCard
            key={option.id}
            option={option}
            isPicked={pickedId === option.id}
            isDimmed={pickedId !== null && pickedId !== option.id}
            onSend={onSend}
            isStreaming={isStreaming}
          />
        ))}
      </div>

      {/* Footer hint — the always-present composer is the escape hatch. */}
      <div className="mt-2.5 font-display italic text-sm text-ink-faint leading-relaxed">
        Or just tell me — type it below.
      </div>
    </div>
  );
}
