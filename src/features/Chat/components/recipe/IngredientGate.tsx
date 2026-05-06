'use client';

import { useSessionContext } from '@/contexts/SessionContext';
import { GetInventoryResponse, InventoryItem } from '@/lib/inventory/schemas';
import { GateData } from '@/lib/recipes/schemas';
import { cn } from '@/lib/utils';
import { fetcher } from '@/lib/utils/index';
import Image from 'next/image';
import useSWR from 'swr';
import { computePantry } from './pantryUtils';

interface IngredientGateProps {
  data: GateData;
  onSend: (text: string) => void;
  onExpectRecipe?: () => void;
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

interface GateButtonProps {
  icon: React.ReactNode;
  title: string;
  sub: string;
  primary?: boolean;
  onClick: () => void;
}

function GateButton({ icon, title, sub, primary, onClick }: GateButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 text-left p-[14px_16px] rounded-[10px] cursor-pointer flex gap-3 items-start transition-transform duration-100',
        primary
          ? 'bg-primary border border-[oklch(0.405_0.130_32)] text-white shadow-[0_1px_0_oklch(0.405_0.130_32),0_14px_24px_-22px_oklch(0.3_0.05_50/0.4)]'
          : 'bg-card border border-border text-foreground shadow-[0_1px_0_var(--border-soft)]'
      )}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-lg shrink-0 flex items-center justify-center',
          primary
            ? 'bg-white/18 border border-white/30 text-white'
            : 'bg-chat border border-border text-primary'
        )}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-display font-semibold text-[15px] leading-[1.2] tracking-[-0.005em] mb-0.5">
          {title}
        </div>
        <div
          className={cn(
            'font-sans text-[12px] leading-[1.4]',
            primary ? 'text-white/85' : 'text-muted-foreground'
          )}
        >
          {sub}
        </div>
      </div>
    </button>
  );
}

export function IngredientGate({ data, onSend, onExpectRecipe }: IngredientGateProps) {
  const { userId } = useSessionContext();
  const { data: inventoryData } = useSWR<GetInventoryResponse>(
    userId ? `/api/inventory?userId=${userId}` : null,
    fetcher,
  );

  const inventoryItems: InventoryItem[] = [
    ...(inventoryData?.ingredientInventory ?? []),
    ...(inventoryData?.kitchenwareInventory ?? []),
  ];

  const { have, total, missing } = computePantry(
    data.keyIngredients,
    inventoryItems,
  );
  const haveAll = have === total && total > 0;

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

        {/* Intro message */}
        <div className="font-display italic text-lg leading-relaxed text-foreground mb-3.5">
          {haveAll ? (
            <>
              Good choice — <b className="font-semibold not-italic">{data.title}</b>. Looks like you
              have everything. Shall I write it out?
            </>
          ) : (
            <>
              Lovely — <b className="font-semibold not-italic">{data.title}</b>. Quick check before
              I write it out — are you missing anything?
            </>
          )}
        </div>

        {/* Pantry summary strip */}
        <div className="flex items-center gap-3.5 p-3.5 bg-chat border border-border rounded-xl mb-3 font-sans text-sm">
          <div
            className={cn(
              'size-9 shrink-0 rounded-lg flex items-center justify-center font-display font-bold text-sm tabular-nums',
              haveAll
                ? 'bg-[oklch(0.94_0.04_168)] border border-[oklch(0.78_0.07_168)] text-accent'
                : 'bg-[oklch(0.96_0.05_88)] border border-[oklch(0.75_0.08_88)] text-[oklch(0.45_0.10_60)]'
            )}
          >
            {have}/{total}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm text-foreground mb-0.5">Pantry check</div>
            <div className="text-muted-foreground text-xs">
              {haveAll ? (
                'Everything looks accounted for, dear.'
              ) : (
                <>
                  Looks like you&apos;re short on{' '}
                  <b className="text-foreground">{missing.join(', ')}</b>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2.5">
          <GateButton
            primary
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path d="M5 12l5 5 9-9" />
              </svg>
            }
            title="I have everything"
            sub="Write me the full recipe."
            onClick={() => {
              onExpectRecipe?.();
              onSend('I have everything.');
            }}
          />
          <GateButton
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            }
            title="I'm missing some"
            sub="Suggest swaps, or send me to the shop."
            onClick={() => {
              onSend("I'm missing some.");
            }}
          />
        </div>

        {/* Tertiary link */}
        <div className="flex gap-3.5 mt-2.5 pl-1">
          <button
            onClick={() => onSend('Show me other recipes.')}
            className="p-0 bg-transparent border-none cursor-pointer font-sans text-xs font-medium text-ink-faint underline underline-offset-4"
          >
            ← Show me other recipes
          </button>
        </div>
      </div>
    </div>
  );
}
