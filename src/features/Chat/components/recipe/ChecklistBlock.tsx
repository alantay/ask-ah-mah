'use client';

import { extractRecipeBlocks } from '@/lib/recipes/parseBlocks';
import {
  ChecklistBlockData,
  ChecklistReplyData,
  ChecklistRow,
} from '@/lib/recipes/schemas';
import { cn } from '@/lib/utils';
import { TextUIPart, UIMessage } from 'ai';
import { useState } from 'react';

interface ChecklistBlockProps {
  // Partial during progressive reveal — question/deal/rows fill in as the JSON
  // streams.
  data: Partial<ChecklistBlockData>;
  allMessages: UIMessage[];
  messageIndex: number;
  onSend: (text: string) => void;
  // Called with the rows the user ticked, so they can be written to the Pantry.
  // A tick is a factual claim ("I own this"), so the write is deterministic and
  // client-driven rather than left to the model to choose to perform.
  // Awaited before the reply is sent: the chat turn calls `getInventory`, and
  // `captureMentionedInventory` deliberately skips checklist replies, so this
  // write is the only thing putting the ticks in front of the model.
  onTicked: (rows: ChecklistRow[]) => Promise<void>;
  // While true the block is still streaming: rows may be incomplete and staging
  // is suppressed (mirrors ClarifyBlock/SuggestionsBlock).
  isStreaming?: boolean;
}

// Unlike clarify — which recovers its picked option by scanning later user
// messages for the option's label — a checklist answer is recovered from the
// `checklist-reply` fence the submit wrote into the user's message. Prose is
// never scanned: "I have coconut milk but no laksa paste" would scan as laksa
// paste present, and a zero-tick answer carries no labels at all, so it would
// be indistinguishable from a card the user ignored.
function deriveReply(
  allMessages: UIMessage[],
  messageIndex: number
): ChecklistReplyData | null {
  for (const msg of allMessages.slice(messageIndex + 1)) {
    const text =
      msg.parts
        ?.filter((p): p is TextUIPart => p.type === 'text')
        .map(p => p.text)
        .join('') ?? '';
    const blocks = extractRecipeBlocks(text);
    // Stop at the next card. Re-asking means one conversation can hold several
    // checklists, and an *ignored* card has no reply of its own — without this
    // bound it would scan past the card that superseded it and render itself
    // answered with the later card's ticks.
    if (msg.role === 'assistant' && blocks.some(b => b.kind === 'checklist')) return null;
    if (msg.role !== 'user') continue;
    const reply = blocks.find(b => b.kind === 'checklist-reply');
    if (reply) return reply.payload;
  }
  return null;
}

function listify(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

// The user's turn: a human sentence — the durable receipt that keeps the thread
// legible (ADR-0006) — followed by the machine-readable payload the replay path
// reads. `stripFences` hides the payload from the rendered bubble.
export function buildReplyMessage(ticked: ChecklistRow[], absent: ChecklistRow[]): string {
  const sentence = ticked.length
    ? `I've got the ${listify(ticked.map(r => r.label))}.`
    : "I don't have any of those.";
  const payload = JSON.stringify({
    ticked: ticked.map(r => r.id),
    absent: absent.map(r => r.id),
  });
  return `${sentence}\n\`\`\`checklist-reply\n${payload}\n\`\`\``;
}

interface ChecklistCardProps {
  row: ChecklistRow;
  isTicked: boolean;
  locked: boolean;
  onToggle: () => void;
}

function ChecklistCard({ row, isTicked, locked, onToggle }: ChecklistCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={locked}
      aria-pressed={isTicked}
      className={cn(
        'w-full text-left bg-card rounded-xl px-4 py-3 relative transition-all duration-180 flex items-center gap-3',
        isTicked
          ? 'border border-primary shadow-[0_0_0_2px_oklch(0.56_0.135_35/0.18),0_1px_0_var(--border-soft)]'
          : 'border border-border shadow-[0_1px_0_var(--border-soft),0_14px_24px_-22px_oklch(0.3_0.05_50/0.4)]',
        locked ? 'cursor-default' : 'cursor-pointer hover:border-primary/60',
        locked && !isTicked ? 'opacity-50' : 'opacity-100'
      )}
    >
      <span
        className={cn(
          'shrink-0 size-5 rounded-md border grid place-items-center text-xs font-bold transition-colors',
          isTicked
            ? 'bg-primary border-primary text-primary-foreground'
            : 'border-border text-transparent'
        )}
        aria-hidden
      >
        ✓
      </span>
      <span className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span className="font-display font-semibold text-lg text-foreground leading-tight tracking-tight">
          {row.label}
        </span>
        {row.hint && (
          <span className="font-display italic text-sm text-muted-foreground leading-relaxed">
            {row.hint}
          </span>
        )}
      </span>
    </button>
  );
}

export function ChecklistBlock({
  data,
  allMessages,
  messageIndex,
  onSend,
  onTicked,
  isStreaming = false,
}: ChecklistBlockProps) {
  const [staged, setStaged] = useState<string[]>([]);

  // Streaming partials may omit any field; default them so the same render path
  // serves both the live and the final view (ADR-0009).
  const question = data.question ?? '';
  const deal = data.deal ?? '';
  const rows = data.rows ?? [];

  const reply = isStreaming ? null : deriveReply(allMessages, messageIndex);
  const locked = reply !== null;
  const ticked = reply ? reply.ticked : staged;

  const submit = async () => {
    const tickedRows = rows.filter(r => ticked.includes(r.id));
    const absentRows = rows.filter(r => !ticked.includes(r.id));
    // Await the Pantry write first, or the chat turn races it and `getInventory`
    // can miss the very items the user just ticked.
    if (tickedRows.length) await onTicked(tickedRows);
    onSend(buildReplyMessage(tickedRows, absentRows));
  };

  const count = ticked.length;
  const total = rows.length;

  return (
    <div className="min-w-0">
      <div className="font-display italic text-lg leading-relaxed text-foreground mb-1">
        {question}
      </div>
      {deal && (
        <div className="font-display italic text-sm text-muted-foreground leading-relaxed mb-3">
          {deal}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {rows.map(row => (
          <ChecklistCard
            key={row.id}
            row={row}
            isTicked={ticked.includes(row.id)}
            locked={locked || isStreaming}
            onToggle={() =>
              setStaged(s =>
                s.includes(row.id) ? s.filter(x => x !== row.id) : [...s, row.id]
              )
            }
          />
        ))}
      </div>

      {/* Submit is always enabled: ticking nothing is a real answer, not an
          abandonment. The resting label stays neutral and only sharpens once
          something is ticked — an untouched card must not shout a negative the
          user hasn't given. */}
      {!locked && !isStreaming && total > 0 && (
        <button
          type="button"
          onClick={submit}
          className="mt-3 w-full rounded-xl bg-primary text-primary-foreground font-display font-semibold text-base px-4 py-3 cursor-pointer hover:opacity-90 transition-opacity"
        >
          {count === 0
            ? 'Tell Ah Mah'
            : count === total
              ? `I have all ${total}`
              : count === 1
                ? 'I have this 1'
                : `I have these ${count}`}
        </button>
      )}

      {locked && (
        <div className="mt-3 font-sans text-xs font-semibold text-primary-deep">
          ✓ Answered — {count} of {total}
        </div>
      )}

      {/* Footer hint — the always-present composer is the escape hatch. An
          ignored card is never closed, so there is nothing to dismiss. */}
      {!locked && (
        <div className="mt-2.5 font-display italic text-sm text-ink-faint leading-relaxed">
          Or just tell me — type it below.
        </div>
      )}
    </div>
  );
}
