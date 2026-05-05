'use client';

import { useSessionContext } from '@/contexts/SessionContext';
import { GetInventoryResponse, InventoryItem } from '@/lib/inventory/schemas';
import { GateData } from '@/lib/recipes/schemas';
import { fetcher } from '@/lib/utils/index';
import Image from 'next/image';
import { toast } from 'sonner';
import useSWR from 'swr';
import { computePantry } from './pantryUtils';

interface IngredientGateProps {
  data: GateData;
  onSend: (text: string) => void;
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
      style={{
        flex: 1,
        textAlign: 'left',
        padding: '14px 16px',
        background: primary ? 'var(--primary)' : 'var(--card)',
        border: `1px solid ${primary ? 'oklch(0.405 0.130 32)' : 'var(--border)'}`,
        borderRadius: 10,
        cursor: 'pointer',
        boxShadow: primary
          ? '0 1px 0 oklch(0.405 0.130 32), 0 14px 24px -22px oklch(0.3 0.05 50 / 0.4)'
          : '0 1px 0 var(--border-soft)',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        color: primary ? '#fff' : 'var(--foreground)',
        transition: 'transform 100ms ease',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          flexShrink: 0,
          background: primary ? 'oklch(1 0 0 / 0.18)' : 'var(--chat)',
          border: `1px solid ${primary ? 'oklch(1 0 0 / 0.3)' : 'var(--border)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: primary ? '#fff' : 'var(--primary)',
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'Fraunces, serif',
            fontWeight: 600,
            fontSize: 15,
            lineHeight: 1.2,
            letterSpacing: '-0.005em',
            marginBottom: 3,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 12,
            color: primary ? 'oklch(1 0 0 / 0.85)' : 'var(--muted-foreground)',
            lineHeight: 1.4,
          }}
        >
          {sub}
        </div>
      </div>
    </button>
  );
}

export function IngredientGate({ data, onSend }: IngredientGateProps) {
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

        {/* Intro message */}
        <div
          style={{
            fontFamily: 'Fraunces, serif',
            fontStyle: 'italic',
            fontSize: 17,
            lineHeight: 1.5,
            color: 'var(--foreground)',
            marginBottom: 14,
          }}
        >
          {haveAll ? (
            <>
              Good choice —{' '}
              <b style={{ fontStyle: 'normal', fontWeight: 600 }}>
                {data.title}
              </b>
              . Looks like you have everything. Shall I write it out?
            </>
          ) : (
            <>
              Lovely —{' '}
              <b style={{ fontStyle: 'normal', fontWeight: 600 }}>
                {data.title}
              </b>
              . Quick check before I write it out — are you missing anything?
            </>
          )}
        </div>

        {/* Pantry summary strip */}
        <div
          style={{
            background: 'var(--chat)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            fontFamily: 'Inter, sans-serif',
            fontSize: 12.5,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: 8,
              background: haveAll
                ? 'oklch(0.94 0.04 168)'
                : 'oklch(0.96 0.05 88)',
              border: `1px solid ${haveAll ? 'oklch(0.78 0.07 168)' : 'oklch(0.75 0.08 88)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Fraunces, serif',
              fontWeight: 700,
              fontSize: 14,
              color: haveAll ? 'var(--accent)' : 'oklch(0.45 0.10 60)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {have}/{total}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: 12.5,
                color: 'var(--foreground)',
                marginBottom: 2,
              }}
            >
              Pantry check
            </div>
            <div style={{ color: 'var(--muted-foreground)', fontSize: 11.5 }}>
              {haveAll ? (
                'Everything looks accounted for, dear.'
              ) : (
                <>
                  Looks like you&apos;re short on{' '}
                  <b style={{ color: 'var(--foreground)' }}>
                    {missing.join(', ')}
                  </b>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
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
            onClick={() => onSend('I have everything.')}
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
            onClick={() =>
              toast.info(
                'Coming soon — substitutions and shopping list are on the way!',
              )
            }
          />
        </div>

        {/* Tertiary link */}
        <div style={{ display: 'flex', gap: 14, marginTop: 10, paddingLeft: 4 }}>
          <button
            onClick={() => onSend('Show me other recipes.')}
            style={{
              padding: 0,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              fontSize: 11.5,
              fontWeight: 500,
              color: 'var(--ink-faint)',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
            }}
          >
            ← Show me other recipes
          </button>
        </div>
      </div>
    </div>
  );
}
