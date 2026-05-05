'use client';

import { useSessionContext } from '@/contexts/SessionContext';
import { GetInventoryResponse, InventoryItem } from '@/lib/inventory/schemas';
import { SuggestionsBlockData, SuggestionOption } from '@/lib/recipes/schemas';
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
  messageIndex: number,
): string | null {
  const laterMessages = allMessages.slice(messageIndex + 1);
  for (const msg of laterMessages) {
    if (msg.role !== 'user') continue;
    const text =
      msg.parts
        ?.filter((p): p is TextUIPart => p.type === 'text')
        .map((p) => p.text)
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
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        border: '1px solid var(--border)',
      }}
    >
      <Image
        src="/granny-avatar.png"
        alt="Ah Mah"
        width={36}
        height={36}
        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
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
  const { have, total, missing } = computePantry(
    option.keyIngredients,
    inventoryItems,
  );
  const haveAll = have === total && total > 0;

  return (
    <div
      style={{
        background: 'var(--card)',
        border: `1px solid ${isPicked ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: 10,
        padding: '14px 16px 14px',
        position: 'relative',
        boxShadow: isPicked
          ? '0 0 0 2px oklch(0.56 0.135 35 / 0.18), 0 1px 0 var(--border-soft)'
          : '0 1px 0 var(--border-soft), 0 14px 24px -22px oklch(0.3 0.05 50 / 0.4)',
        opacity: isDimmed ? 0.5 : 1,
        transition: 'all 180ms ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        pointerEvents: isDimmed ? 'none' : 'auto',
      }}
    >
      {/* Corner tab */}
      <div
        style={{
          position: 'absolute',
          top: -1,
          right: 18,
          width: 22,
          height: 11,
          background: 'var(--primary)',
          borderRadius: '0 0 3px 3px',
          boxShadow: 'inset 0 -1px 0 oklch(0.45 0.12 32)',
        }}
      />

      {/* Tags + time row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 6,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {option.tags.map((t) => (
            <span
              key={t}
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 9.5,
                fontWeight: 600,
                padding: '1px 6px',
                color: 'var(--muted-foreground)',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 999,
                letterSpacing: '0.04em',
                textTransform: 'lowercase',
              }}
            >
              {t}
            </span>
          ))}
        </div>
        <span
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 10.5,
            color: 'var(--ink-faint)',
          }}
        >
          ⏱ {option.time}
        </span>
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: 'Fraunces, serif',
          fontWeight: 600,
          fontSize: 19,
          color: 'var(--foreground)',
          lineHeight: 1.15,
          letterSpacing: '-0.01em',
        }}
      >
        {option.title}
      </div>

      {/* Blurb */}
      <div
        style={{
          fontFamily: 'Fraunces, serif',
          fontStyle: 'italic',
          fontSize: 13,
          color: 'var(--muted-foreground)',
          lineHeight: 1.4,
        }}
      >
        {option.blurb}
      </div>

      {/* Ah Mah note */}
      {option.note && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 2,
            fontFamily: 'Fraunces, serif',
            fontStyle: 'italic',
            fontSize: 12,
            color: 'var(--ink-faint)',
          }}
        >
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontStyle: 'normal',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'oklch(0.45 0.10 60)',
              padding: '1px 5px',
              background: 'oklch(0.96 0.05 88)',
              border: '1px dashed oklch(0.75 0.08 88)',
              borderRadius: 4,
            }}
          >
            Ah Mah
          </span>
          <span style={{ flex: 1 }}>{option.note}</span>
        </div>
      )}

      {/* Footer row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 10,
          paddingTop: 10,
          borderTop: '1px dashed var(--border)',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'Inter, sans-serif',
            fontSize: 11,
            fontWeight: 600,
            color: haveAll ? 'var(--accent)' : 'oklch(0.42 0.18 25)',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: haveAll ? 'var(--accent)' : 'oklch(0.6 0.18 25)',
              flexShrink: 0,
            }}
          />
          {total === 0
            ? 'Pantry check N/A'
            : haveAll
              ? `All ${total} in pantry`
              : `${have}/${total} in pantry · short ${missing.length}`}
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => onSend(`${option.title} — let's go.`)}
          style={{
            padding: '6px 12px',
            fontFamily: 'Inter, sans-serif',
            fontSize: 12,
            fontWeight: 600,
            color: isPicked ? 'oklch(0.405 0.130 32)' : '#fff',
            background: isPicked ? 'oklch(0.94 0.06 35)' : 'var(--primary)',
            border: '1px solid oklch(0.405 0.130 32)',
            borderRadius: 7,
            cursor: 'pointer',
            boxShadow: isPicked
              ? 'none'
              : '0 1px 0 oklch(0.405 0.130 32)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
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
    fetcher,
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
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <GrannyAvatar />
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--muted-foreground)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 4,
          }}
        >
          <span>Ah Mah</span>
          <span
            style={{
              fontWeight: 400,
              color: 'var(--ink-faint)',
              letterSpacing: '0.02em',
              textTransform: 'none',
            }}
          >
            · {time}
          </span>
        </div>

        {/* Intro */}
        <div
          style={{
            fontFamily: 'Fraunces, serif',
            fontStyle: 'italic',
            fontSize: 17,
            lineHeight: 1.5,
            color: 'var(--foreground)',
            marginBottom: 12,
          }}
        >
          {data.intro}
        </div>

        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.options.map((option) => (
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
        <div
          style={{
            marginTop: 10,
            fontFamily: 'Fraunces, serif',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--ink-faint)',
            lineHeight: 1.5,
          }}
        >
          Or tell me what you&apos;re in the mood for and I&apos;ll think of
          others.
        </div>
      </div>
    </div>
  );
}
