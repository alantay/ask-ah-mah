'use client';

import { useSessionContext } from '@/contexts/SessionContext';
import { GetInventoryResponse, InventoryItem } from '@/lib/inventory/schemas';
import { SuggestionsBlockData, SuggestionOption } from '@/lib/recipes/schemas';
import { cn } from '@/lib/utils';
import { fetcher } from '@/lib/utils/index';
import { TextUIPart, UIMessage } from 'ai';
import Image from 'next/image';
import useSWR from 'swr';
import { computePantry } from './pantryUtils';

interface SuggestionsBlockProps {
  data: SuggestionsBlockData;
  allMessages: UIMessage[];
  messageIndex: number;
  onSend: (text: string) => void;
}

function derivePickedId(
  options: SuggestionOption[],
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
      if (text.toLowerCase().includes(opt.title.toLowerCase())) {
        return opt.id;
      }
    }
  }
  return null;
}

function GrannyAvatar() {
  return (
    <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-border">
      <Image
        src="/granny-avatar.png"
        alt="Ah Mah"
        width={36}
        height={36}
        className="object-cover size-full"
      />
    </div>
  );
}

interface SuggestionCardProps {
  option: SuggestionOption;
  isPicked: boolean;
  isDimmed: boolean;
  inventoryItems: InventoryItem[];
  onSend: (text: string) => void;
}

function SuggestionCard({
  option,
  isPicked,
  isDimmed,
  inventoryItems,
  onSend,
}: SuggestionCardProps) {
  const { have, total, missing } = computePantry(option.keyIngredients, inventoryItems);
  const haveAll = have === total && total > 0;

  return (
    <div
      className={cn(
        'bg-card rounded-xl p-4 relative transition-all duration-180 flex flex-col gap-1.5',
        isPicked
          ? 'border border-primary shadow-[0_0_0_2px_oklch(0.56_0.135_35/0.18),0_1px_0_var(--border-soft)]'
          : 'border border-border shadow-[0_1px_0_var(--border-soft),0_14px_24px_-22px_oklch(0.3_0.05_50/0.4)]',
        isDimmed ? 'opacity-50 pointer-events-none' : 'opacity-100 pointer-events-auto'
      )}
    >
      {/* Corner tab */}
      <div className="absolute top-[-1px] right-[18px] w-5.5 h-2.5 bg-primary rounded-b shadow-[inset_0_-1px_0_oklch(0.45_0.12_32)]" />

      {/* Tags + time row */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 items-center flex-wrap">
          {option.tags.map(t => (
            <span
              key={t}
              className="font-sans text-[10px] font-semibold px-1.5 py-0.25 text-muted-foreground bg-transparent border border-border rounded-full tracking-wider lowercase"
            >
              {t}
            </span>
          ))}
        </div>
        <span className="font-mono text-[10px] text-ink-faint">⏱ {option.time}</span>
      </div>

      {/* Title */}
      <div className="font-display font-semibold text-xl text-foreground leading-tight tracking-tight">
        {option.title}
      </div>

      {/* Blurb */}
      <div className="font-display italic text-sm text-muted-foreground leading-relaxed">
        {option.blurb}
      </div>

      {/* Ah Mah note */}
      {option.note && (
        <div className="flex items-center gap-1.5 mt-0.5 font-display italic text-xs text-ink-faint">
          <span className="font-sans not-italic text-[9px] font-bold tracking-widest uppercase text-[oklch(0.45_0.10_60)] px-1.25 py-0.25 bg-[oklch(0.96_0.05_88)] border border-dashed border-[oklch(0.75_0.08_88)] rounded">
            Ah Mah
          </span>
          <span className="flex-1">{option.note}</span>
        </div>
      )}

      {/* Footer row */}
      <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-dashed border-border">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 font-sans text-xs font-semibold',
            haveAll ? 'text-jade' : 'text-[oklch(0.42_0.18_25)]'
          )}
        >
          <span
            className={cn(
              'size-[7px] rounded-full shrink-0',
              haveAll ? 'bg-jade' : 'bg-[oklch(0.6_0.18_25)]'
            )}
          />
          {total === 0
            ? 'Pantry check N/A'
            : haveAll
              ? 'All set ✓'
              : `${have}/${total} in pantry · short ${missing.length}`}
        </span>
        <div className="flex-1" />
        <button
          onClick={() => onSend(`${option.title} — let's go.`)}
          className={cn(
            'px-3 py-1.5 font-sans text-xs font-semibold rounded-lg cursor-pointer inline-flex items-center gap-1',
            isPicked
              ? 'text-[oklch(0.405_0.130_32)] bg-[oklch(0.94_0.06_35)] border border-[oklch(0.405_0.130_32)] shadow-none'
              : 'text-white bg-primary border border-[oklch(0.405_0.130_32)] shadow-[0_1px_0_oklch(0.405_0.130_32)]'
          )}
        >
          {isPicked ? '✓ Picked' : 'I want to cook this →'}
        </button>
      </div>
    </div>
  );
}

export function SuggestionsBlock({
  data,
  allMessages,
  messageIndex,
  onSend,
}: SuggestionsBlockProps) {
  const { userId } = useSessionContext();
  const { data: inventoryData } = useSWR<GetInventoryResponse>(
    userId ? `/api/inventory?userId=${userId}` : null,
    fetcher
  );

  const inventoryItems: InventoryItem[] = [
    ...(inventoryData?.ingredientInventory ?? []),
    ...(inventoryData?.kitchenwareInventory ?? []),
  ];

  const pickedId = derivePickedId(data.options, allMessages, messageIndex);

  // Format timestamp
  const time = new Date().toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="flex gap-3 items-start">
      <GrannyAvatar />
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 font-sans text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-1">
          <span>Ah Mah</span>
          <span className="font-normal text-ink-faint tracking-wider normal-case">· {time}</span>
        </div>

        {/* Intro */}
        <div className="font-display italic text-lg leading-relaxed text-foreground mb-3">
          {data.intro}
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-2.5">
          {data.options.map(option => (
            <SuggestionCard
              key={option.id}
              option={option}
              isPicked={pickedId === option.id}
              isDimmed={pickedId !== null && pickedId !== option.id}
              inventoryItems={inventoryItems}
              onSend={onSend}
            />
          ))}
        </div>

        {/* Footer hint */}
        <div className="mt-2.5 font-display italic text-sm text-ink-faint leading-relaxed">
          Or tell me what you&apos;re in the mood for and I&apos;ll think of others.
        </div>
      </div>
    </div>
  );
}
