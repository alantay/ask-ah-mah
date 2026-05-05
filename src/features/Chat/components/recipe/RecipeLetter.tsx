'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useSessionContext } from '@/contexts/SessionContext';
import { GetInventoryResponse, InventoryItem } from '@/lib/inventory/schemas';
import { fetcher } from '@/lib/utils/index';
import { ScaledNum } from './ScaledNum';
import { scaleAmount } from './scaleAmount';

interface Ingredient {
  name: string;
  amount?: string;
  unit?: string;
  note?: string;
}

interface Step {
  title: string;
  body: string;
  tip?: string;
}

interface RecipeData {
  title: string;
  description?: string;
  totalTimeMinutes?: number;
  baseServings: number;
  ingredients: Ingredient[];
  steps: Step[];
  tags?: string[];
}

export interface RecipeLetterProps {
  recipe: RecipeData;
  onSave?: (recipe: RecipeData) => void;
  isSaved?: boolean;
}

function ServingsStepper({
  servings,
  baseServings,
  onDecrement,
  onIncrement,
}: {
  servings: number;
  baseServings: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  const ratio = servings / baseServings;
  const ratioLabel = ratio.toFixed(2).replace(/\.?0+$/, '');

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'stretch',
        border: '1px solid var(--border)',
        borderRadius: 8,
        background: 'var(--card)',
        overflow: 'hidden',
        boxShadow: '0 1px 0 var(--border-soft)',
        height: 30,
      }}
    >
      <button
        onClick={onDecrement}
        disabled={servings <= 1}
        style={{
          width: 28,
          border: 'none',
          background: 'transparent',
          cursor: servings <= 1 ? 'not-allowed' : 'pointer',
          color: servings <= 1 ? 'var(--muted-foreground)' : 'var(--foreground)',
          fontSize: 16,
          fontWeight: 600,
          borderRight: '1px solid var(--border)',
          opacity: servings <= 1 ? 0.5 : 1,
        }}
        aria-label="Decrease servings"
      >
        −
      </button>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minWidth: 64,
          padding: '0 8px',
          lineHeight: 1,
        }}
      >
        <span
          style={{
            fontFamily: 'Fraunces, serif',
            fontWeight: 600,
            fontSize: 14,
            color: 'var(--foreground)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {servings} {servings === 1 ? 'serving' : 'servings'}
        </span>
        {servings !== baseServings && (
          <span
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 9,
              color: 'var(--muted-foreground)',
              marginTop: 2,
              letterSpacing: '0.04em',
            }}
          >
            ×{ratioLabel} from {baseServings}
          </span>
        )}
      </div>
      <button
        onClick={onIncrement}
        disabled={servings >= 12}
        style={{
          width: 28,
          border: 'none',
          background: 'transparent',
          cursor: servings >= 12 ? 'not-allowed' : 'pointer',
          color: servings >= 12 ? 'var(--muted-foreground)' : 'var(--foreground)',
          fontSize: 16,
          fontWeight: 600,
          borderLeft: '1px solid var(--border)',
        }}
        aria-label="Increase servings"
      >
        +
      </button>
    </div>
  );
}

function HaveTag({ have }: { have: boolean }) {
  if (have) {
    return (
      <span
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 9.5,
          fontWeight: 700,
          padding: '1px 6px',
          color: 'var(--accent)',
          background: 'oklch(0.94 0.04 168)',
          border: '1px solid oklch(0.78 0.07 168)',
          borderRadius: 999,
          letterSpacing: '0.04em',
          flexShrink: 0,
        }}
      >
        HAVE
      </span>
    );
  }
  return (
    <span
      style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 9.5,
        fontWeight: 700,
        padding: '1px 6px',
        color: 'var(--muted-foreground)',
        background: 'transparent',
        border: '1px solid var(--border)',
        borderRadius: 999,
        letterSpacing: '0.04em',
        flexShrink: 0,
      }}
    >
      NEED
    </span>
  );
}

function ingredientHave(name: string, inventoryNames: string[]): boolean {
  const n = name.trim().toLowerCase();
  return inventoryNames.some((inv) => inv.includes(n) || n.includes(inv));
}

export function RecipeLetter({ recipe, onSave, isSaved }: RecipeLetterProps) {
  const [servings, setServings] = useState(recipe.baseServings);
  const ratio = servings / recipe.baseServings;
  const { userId } = useSessionContext();
  const { data: inventoryData } = useSWR<GetInventoryResponse>(
    userId ? `/api/inventory?userId=${userId}` : null,
    fetcher,
  );

  const inventoryItems: InventoryItem[] = [
    ...(inventoryData?.ingredientInventory ?? []),
    ...(inventoryData?.kitchenwareInventory ?? []),
  ];
  const inventoryNames = inventoryItems.map((i) => i.name.trim().toLowerCase());

  const haveCount = recipe.ingredients.filter((ing) =>
    ingredientHave(ing.name, inventoryNames),
  ).length;

  const timeLabel = recipe.totalTimeMinutes ? `${recipe.totalTimeMinutes} min` : null;

  return (
    <div
      className="bg-chat"
      style={{
        borderTop: '1px solid var(--border-soft)',
        borderBottom: '1px solid var(--border-soft)',
        padding: '20px 26px 22px',
        position: 'relative',
      }}
    >
      {/* Ribbon header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 14,
          paddingBottom: 10,
          borderBottom: '1px dashed var(--border)',
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            flexShrink: 0,
          }}
        >
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <path d="M3 2v12l5-3 5 3V2z" stroke="currentColor" strokeWidth="1.4" fill="currentColor" />
          </svg>
        </div>

        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--muted-foreground)',
          }}
        >
          The way I make it
        </div>

        <div style={{ flex: 1 }} />

        {timeLabel && (
          <div
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 10.5,
              color: 'var(--muted-foreground)',
            }}
          >
            {timeLabel}
          </div>
        )}

        <ServingsStepper
          servings={servings}
          baseServings={recipe.baseServings}
          onDecrement={() => setServings(s => Math.max(1, s - 1))}
          onIncrement={() => setServings(s => Math.min(12, s + 1))}
        />
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 28,
          fontWeight: 600,
          color: 'var(--foreground)',
          lineHeight: 1.05,
          letterSpacing: '-0.015em',
          marginBottom: 8,
        }}
      >
        {recipe.title}
      </div>

      {/* Description */}
      {recipe.description && (
        <div
          style={{
            fontFamily: 'Fraunces, serif',
            fontStyle: 'italic',
            fontSize: 14,
            color: 'var(--muted-foreground)',
            lineHeight: 1.5,
            marginBottom: 18,
          }}
        >
          {recipe.description}
        </div>
      )}

      {/* Ingredients — neat 2-column grid card */}
      {recipe.ingredients.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--muted-foreground)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'baseline',
              gap: 10,
            }}
          >
            <span>What to gather</span>
            {userId && inventoryItems.length > 0 && (
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontStyle: 'normal',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--accent)',
                  padding: '1px 7px',
                  background: 'oklch(0.94 0.04 168)',
                  border: '1px solid oklch(0.78 0.07 168)',
                  borderRadius: 999,
                  letterSpacing: 0,
                  textTransform: 'none',
                }}
              >
                {haveCount}/{recipe.ingredients.length} in your pantry
              </span>
            )}
          </div>
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '10px 14px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '4px 18px',
              boxShadow: '0 1px 0 var(--border-soft)',
            }}
          >
            {recipe.ingredients.map((ing, i) => {
              const scaledAmt = ing.amount ? scaleAmount(ing.amount, ratio) : '';
              const amountLabel = scaledAmt
                ? `${scaledAmt}${ing.unit ? ' ' + ing.unit : ''}`
                : '';
              const have = ingredientHave(ing.name, inventoryNames);
              const isLastTwo = i >= recipe.ingredients.length - 2;
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 8,
                    padding: '6px 0',
                    borderBottom: isLastTwo
                      ? 'none'
                      : '1px dashed var(--border)',
                  }}
                >
                  <span
                    style={{
                      flex: '0 0 64px',
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: 'var(--foreground)',
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {amountLabel ? <ScaledNum>{amountLabel}</ScaledNum> : ''}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontFamily: 'Fraunces, serif',
                      fontSize: 13.5,
                      color: 'var(--foreground)',
                      lineHeight: 1.3,
                    }}
                  >
                    {ing.name}
                    {ing.note && (
                      <span
                        style={{
                          color: 'var(--muted-foreground)',
                          fontStyle: 'italic',
                          fontSize: 12.5,
                        }}
                      >
                        , {ing.note}
                      </span>
                    )}
                  </span>
                  {userId && inventoryItems.length > 0 && <HaveTag have={have} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Steps — each step a conversational bubble with a numbered ink-stamp */}
      {recipe.steps.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          {recipe.steps.map((step, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: 36,
                  height: 36,
                  background: 'var(--primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Fraunces, serif',
                  fontWeight: 700,
                  fontSize: 17,
                  borderRadius: '50% 50% 50% 8px',
                  transform: 'rotate(-3deg)',
                  boxShadow:
                    'inset 0 -2px 0 color-mix(in oklch, var(--primary) 70%, black), 0 1px 0 color-mix(in oklch, var(--primary) 70%, black)',
                }}
              >
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--muted-foreground)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginBottom: 4,
                  }}
                >
                  Ah Mah · step {i + 1}
                </div>
                <div
                  style={{
                    fontFamily: 'Fraunces, serif',
                    fontWeight: 600,
                    fontSize: 16,
                    color: 'var(--foreground)',
                    marginBottom: 4,
                    letterSpacing: '-0.005em',
                  }}
                >
                  {step.title}
                </div>
                <div
                  style={{
                    fontFamily: 'Fraunces, serif',
                    fontStyle: 'italic',
                    fontSize: 16,
                    color: 'var(--foreground)',
                    lineHeight: 1.55,
                  }}
                >
                  {step.body}
                </div>
                {step.tip && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: '8px 12px',
                      background: 'oklch(0.96 0.05 88)',
                      border: '1px dashed oklch(0.75 0.08 88)',
                      borderRadius: 8,
                      fontFamily: 'Fraunces, serif',
                      fontStyle: 'italic',
                      fontSize: 13,
                      color: 'var(--foreground)',
                      lineHeight: 1.45,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontStyle: 'normal',
                        fontSize: 9.5,
                        fontWeight: 700,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        color: 'oklch(0.45 0.10 60)',
                        marginRight: 6,
                      }}
                    >
                      Tip
                    </span>
                    {step.tip}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action bar — only when onSave is provided */}
      {onSave && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            paddingTop: 12,
            marginTop: 18,
            borderTop: '1px dashed var(--border)',
          }}
        >
          {isSaved ? (
            <button
              disabled
              style={{
                padding: '6px 12px',
                fontFamily: 'Inter, sans-serif',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--accent)',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 7,
                cursor: 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                opacity: 0.8,
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3-7 3z" />
              </svg>
              Saved
            </button>
          ) : (
            <button
              onClick={() => onSave(recipe)}
              style={{
                padding: '6px 12px',
                fontFamily: 'Inter, sans-serif',
                fontSize: 12,
                fontWeight: 600,
                color: '#fff',
                background: 'var(--primary)',
                border: '1px solid color-mix(in oklch, var(--primary) 70%, black)',
                borderRadius: 7,
                cursor: 'pointer',
                boxShadow: '0 1px 0 color-mix(in oklch, var(--primary) 70%, black)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3-7 3z" />
              </svg>
              Save to cookbook
            </button>
          )}
        </div>
      )}
    </div>
  );
}
