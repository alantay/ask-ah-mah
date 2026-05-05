'use client';

import { useState } from 'react';
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

export function RecipeLetter({ recipe, onSave, isSaved }: RecipeLetterProps) {
  const [servings, setServings] = useState(recipe.baseServings);
  const ratio = servings / recipe.baseServings;

  const ingredientParts = recipe.ingredients.map((ing, i) => {
    const scaledAmt = ing.amount ? scaleAmount(ing.amount, ratio) : '';
    const unit = ing.unit ? ` ${ing.unit}` : '';
    const note = ing.note ? `, ${ing.note}` : '';
    const isLast = i === recipe.ingredients.length - 1;
    const suffix = isLast ? '.' : ', ';

    return (
      <span key={i}>
        {scaledAmt ? (
          <>
            <ScaledNum>{`${scaledAmt}${unit}`}</ScaledNum>{' '}
          </>
        ) : null}
        {ing.name}
        {note}
        {suffix}
      </span>
    );
  });

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
        {/* Bookmark icon */}
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
          marginBottom: 14,
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
            marginBottom: 14,
          }}
        >
          {recipe.description}
        </div>
      )}

      {/* Ingredient prose */}
      {recipe.ingredients.length > 0 && (
        <div
          style={{
            fontFamily: 'Fraunces, serif',
            fontStyle: 'italic',
            fontSize: 15,
            color: 'var(--muted-foreground)',
            lineHeight: 1.6,
            marginBottom: 18,
          }}
        >
          <b style={{ fontStyle: 'normal', color: 'var(--foreground)', fontWeight: 600 }}>
            You&apos;ll need —
          </b>{' '}
          {ingredientParts}
          {recipe.tags && recipe.tags.length > 0 && (
            <span
              style={{
                marginLeft: 6,
                fontFamily: 'Inter, sans-serif',
                fontStyle: 'normal',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--accent)',
                padding: '1px 7px',
                background: 'oklch(0.94 0.04 168)',
                border: '1px solid oklch(0.78 0.07 168)',
                borderRadius: 999,
              }}
            >
              {recipe.tags.length}/{recipe.ingredients.length} in your pantry
            </span>
          )}
        </div>
      )}

      {/* Steps */}
      {recipe.steps.length > 0 && (
        <div
          style={{
            fontFamily: 'Fraunces, serif',
            fontSize: 16,
            color: 'var(--foreground)',
            lineHeight: 1.65,
          }}
        >
          {recipe.steps.map((step, i) => (
            <p key={i} style={{ margin: '0 0 14px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 22,
                  height: 22,
                  background: 'var(--primary)',
                  color: '#fff',
                  fontFamily: 'Fraunces, serif',
                  fontWeight: 700,
                  fontSize: 12,
                  borderRadius: '50% 50% 50% 6px',
                  transform: 'rotate(-3deg) translateY(-2px)',
                  marginRight: 8,
                  verticalAlign: 'middle',
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <span style={{ fontWeight: 600 }}>{step.title}.</span>{' '}
              <span style={{ fontFamily: 'Inter, sans-serif', fontStyle: 'normal', color: 'var(--foreground)' }}>{step.body}</span>
              {step.tip && (
                <span
                  style={{
                    display: 'block',
                    marginTop: 6,
                    marginLeft: 30,
                    fontSize: 13.5,
                    color: 'var(--muted-foreground)',
                    fontStyle: 'italic',
                    borderLeft: '2px solid var(--primary)',
                    paddingLeft: 10,
                  }}
                >
                  — {step.tip}
                </span>
              )}
            </p>
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
            marginTop: 14,
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
