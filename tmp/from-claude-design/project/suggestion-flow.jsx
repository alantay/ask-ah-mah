/* Suggestion flow + ingredient gate
   Two new artboards exploring the moment BEFORE the full recipe:
     1. SuggestionList   — Ah Mah replies with N recipe headlines,
                           each with a "Cook this" CTA.
     2. IngredientGate   — after picking, a check-in: "I have all" /
                           "Missing some" before committing.

   These compose the conversation around the recipe — a soft funnel
   from "what can I cook" → "this one" → "let's go". */

const RECIPE_SUGGESTIONS = [
  {
    id: 'ginger',
    title: 'Ginger Chicken & Bok Choy',
    blurb: 'Velvety chicken, ginger that bites a little. Wok job.',
    time: '20 min', heat: 'High',
    pantry: { have: 8, total: 10 },
    note: 'My usual when I want something fast.',
    tags: ['stir-fry', 'one-pan'],
  },
  {
    id: 'congee',
    title: 'Chicken Ginger Congee',
    blurb: 'Slow-cooked rice porridge, soft and warming. Hands-off.',
    time: '1 h', heat: 'Low',
    pantry: { have: 6, total: 7 },
    note: 'For when you want comfort, not speed.',
    tags: ['simmer', 'comfort'],
    short: ['white pepper'],
  },
  {
    id: 'lemon',
    title: 'Steamed Chicken with Lemon & Soy',
    blurb: 'Light, clean, no oil splatter. Plate of greens on the side.',
    time: '25 min', heat: 'Medium',
    pantry: { have: 5, total: 8 },
    note: "Good if you've eaten heavy this week.",
    tags: ['steam', 'light'],
    short: ['lemon', 'cilantro', 'rice wine'],
  },
];

/* ─────────────────────────────────────────────────────────────────
   Suggestion card — recipe headline + "Cook this" + pantry status
   ───────────────────────────────────────────────────────────────── */

function SuggestionCard({ recipe, selected, onSelect, dim }) {
  const haveAll = recipe.pantry.have === recipe.pantry.total;
  const missing = recipe.pantry.total - recipe.pantry.have;
  return (
    <div style={{
      ...paperBg(TOKENS.card),
      border: `1px solid ${selected ? TOKENS.primary : TOKENS.border}`,
      borderRadius: 10,
      padding: '14px 16px 14px',
      position: 'relative',
      boxShadow: selected
        ? `0 0 0 2px oklch(0.56 0.135 35 / 0.18), 0 1px 0 ${TOKENS.borderSoft}`
        : `0 1px 0 ${TOKENS.borderSoft}, 0 14px 24px -22px oklch(0.3 0.05 50 / 0.4)`,
      opacity: dim ? 0.5 : 1,
      transition: 'all 180ms ease',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      {/* Tiny corner tab — same vocab as the saved-recipe card */}
      <div style={{
        position: 'absolute', top: -1, right: 18,
        width: 22, height: 11,
        background: TOKENS.primary,
        borderRadius: '0 0 3px 3px',
        boxShadow: 'inset 0 -1px 0 oklch(0.45 0.12 32)',
      }}/>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 0,
      }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {recipe.tags.map(t => (
            <span key={t} style={{
              fontFamily: 'Inter, sans-serif', fontSize: 9.5, fontWeight: 600,
              padding: '1px 6px',
              color: TOKENS.inkSoft,
              background: 'transparent',
              border: `1px solid ${TOKENS.border}`,
              borderRadius: 999,
              letterSpacing: '0.04em', textTransform: 'lowercase',
            }}>{t}</span>
          ))}
        </div>
        <span style={{
          fontFamily: 'ui-monospace, monospace', fontSize: 10.5,
          color: TOKENS.inkFaint,
        }}>⏱ {recipe.time}</span>
      </div>

      <div style={{
        fontFamily: 'Fraunces, serif', fontWeight: 600,
        fontSize: 19, color: TOKENS.ink, lineHeight: 1.15,
        letterSpacing: '-0.01em',
      }}>{recipe.title}</div>
      <div style={{
        fontFamily: 'Fraunces, serif', fontStyle: 'italic',
        fontSize: 13, color: TOKENS.inkSoft, lineHeight: 1.4,
      }}>{recipe.blurb}</div>

      {/* Ah Mah inline note */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        marginTop: 2,
        fontFamily: 'Fraunces, serif', fontStyle: 'italic',
        fontSize: 12, color: TOKENS.inkFaint,
      }}>
        <span style={{
          fontFamily: 'Inter, sans-serif', fontStyle: 'normal',
          fontSize: 9, fontWeight: 700, letterSpacing: '0.16em',
          textTransform: 'uppercase', color: 'oklch(0.45 0.10 60)',
          padding: '1px 5px',
          background: 'oklch(0.96 0.05 88)',
          border: `1px dashed oklch(0.75 0.08 88)`,
          borderRadius: 4,
        }}>Ah Mah</span>
        <span style={{ flex: 1 }}>{recipe.note}</span>
      </div>

      {/* Footer row — pantry status + CTA */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginTop: 10, paddingTop: 10,
        borderTop: `1px dashed ${TOKENS.border}`,
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600,
          color: haveAll ? TOKENS.jade : 'oklch(0.42 0.18 25)',
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: haveAll ? TOKENS.jade : 'oklch(0.6 0.18 25)',
          }}/>
          {haveAll
            ? `All ${recipe.pantry.total} in pantry`
            : `${recipe.pantry.have}/${recipe.pantry.total} in pantry · short ${missing}`}
        </span>
        <div style={{ flex: 1 }}/>
        <button
          onClick={onSelect}
          style={{
            padding: '6px 12px',
            fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
            color: selected ? TOKENS.primaryInk : '#fff',
            background: selected ? 'oklch(0.94 0.06 35)' : TOKENS.primary,
            border: `1px solid ${TOKENS.primaryInk}`,
            borderRadius: 7, cursor: 'pointer',
            boxShadow: selected ? 'none' : `0 1px 0 ${TOKENS.primaryInk}`,
            display: 'inline-flex', alignItems: 'center', gap: 5,
          }}>
          {selected ? '✓ Picked' : 'I want to cook this →'}
        </button>
      </div>
    </div>
  );
}

/* The grouped Ah Mah message that holds the suggestion list */
function SuggestionsBlock({ selected, onSelect, time }) {
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-start', maxWidth: 580,
    }}>
      <GrannyAvatar size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600,
          color: TOKENS.inkSoft, letterSpacing: '0.06em',
          textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
        }}>
          <span>Ah Mah</span>
          {time && <span style={{ fontWeight: 400, color: TOKENS.inkFaint, letterSpacing: '0.02em', textTransform: 'none' }}>· {time}</span>}
        </div>
        <div style={{
          fontFamily: 'Fraunces, serif', fontStyle: 'italic',
          fontSize: 17, lineHeight: 1.5, color: TOKENS.ink,
          marginBottom: 12,
        }}>
          Chicken breast, hmm — three good directions. Pick whichever
          mood you're in:
        </div>
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {RECIPE_SUGGESTIONS.map(r => (
            <SuggestionCard
              key={r.id}
              recipe={r}
              selected={selected === r.id}
              dim={selected && selected !== r.id}
              onSelect={() => onSelect(r.id)}
            />
          ))}
        </div>
        <div style={{
          marginTop: 10,
          fontFamily: 'Fraunces, serif', fontStyle: 'italic',
          fontSize: 13, color: TOKENS.inkFaint, lineHeight: 1.5,
        }}>
          Or tell me what you're in the mood for and I'll think of others.
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Ingredient gate — appears after the user picks a recipe.
   Two big choices: "I have everything" / "I'm missing some".
   ───────────────────────────────────────────────────────────────── */

function GateButton({ icon, title, sub, primary, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: 1,
      textAlign: 'left',
      padding: '14px 16px',
      background: primary ? TOKENS.primary : TOKENS.card,
      border: `1px solid ${primary ? TOKENS.primaryInk : TOKENS.border}`,
      borderRadius: 10,
      cursor: 'pointer',
      boxShadow: primary
        ? `0 1px 0 ${TOKENS.primaryInk}, 0 14px 24px -22px oklch(0.3 0.05 50 / 0.4)`
        : `0 1px 0 ${TOKENS.borderSoft}`,
      display: 'flex', gap: 12, alignItems: 'flex-start',
      color: primary ? '#fff' : TOKENS.ink,
      transition: 'transform 100ms ease',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: primary ? 'oklch(1 0 0 / 0.18)' : TOKENS.chat,
        border: `1px solid ${primary ? 'oklch(1 0 0 / 0.3)' : TOKENS.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: primary ? '#fff' : TOKENS.primary,
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'Fraunces, serif', fontWeight: 600,
          fontSize: 15, lineHeight: 1.2,
          letterSpacing: '-0.005em',
          marginBottom: 3,
        }}>{title}</div>
        <div style={{
          fontFamily: 'Inter, sans-serif', fontSize: 12,
          color: primary ? 'oklch(1 0 0 / 0.85)' : TOKENS.inkSoft,
          lineHeight: 1.4,
        }}>{sub}</div>
      </div>
    </button>
  );
}

function IngredientGate({ recipe, time, onChoose }) {
  if (!recipe) return null;
  const missing = recipe.pantry.total - recipe.pantry.have;
  const haveAll = missing === 0;
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-start', maxWidth: 580,
    }}>
      <GrannyAvatar size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600,
          color: TOKENS.inkSoft, letterSpacing: '0.06em',
          textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
        }}>
          <span>Ah Mah</span>
          {time && <span style={{ fontWeight: 400, color: TOKENS.inkFaint, letterSpacing: '0.02em', textTransform: 'none' }}>· {time}</span>}
        </div>
        <div style={{
          fontFamily: 'Fraunces, serif', fontStyle: 'italic',
          fontSize: 17, lineHeight: 1.5, color: TOKENS.ink,
          marginBottom: 14,
        }}>
          {haveAll
            ? <>Good choice — <b style={{ fontStyle: 'normal', fontWeight: 600 }}>{recipe.title}</b>. Looks like you have everything. Shall I write it out, or are you missing anything?</>
            : <>Lovely — <b style={{ fontStyle: 'normal', fontWeight: 600 }}>{recipe.title}</b>. Quick check before I write it out — are you missing anything?</>
          }
        </div>

        {/* Pantry summary strip */}
        <div style={{
          ...paperBg(TOKENS.chat),
          border: `1px solid ${TOKENS.border}`,
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 14,
          fontFamily: 'Inter, sans-serif', fontSize: 12.5,
        }}>
          <div style={{
            width: 36, height: 36, flexShrink: 0,
            borderRadius: 8,
            background: haveAll ? 'oklch(0.94 0.04 168)' : 'oklch(0.96 0.05 88)',
            border: `1px solid ${haveAll ? 'oklch(0.78 0.07 168)' : 'oklch(0.75 0.08 88)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 14,
            color: haveAll ? TOKENS.jade : 'oklch(0.45 0.10 60)',
            fontVariantNumeric: 'tabular-nums',
          }}>{recipe.pantry.have}/{recipe.pantry.total}</div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontWeight: 600,
              fontSize: 12.5, color: TOKENS.ink, marginBottom: 2,
            }}>Pantry check</div>
            <div style={{ color: TOKENS.inkSoft, fontSize: 11.5 }}>
              {haveAll
                ? 'Everything looks accounted for, dear.'
                : <>Looks like you're short on <b style={{ color: TOKENS.ink }}>
                    {recipe.short && recipe.short.join(', ')}
                  </b></>
              }
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <GateButton
            primary
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12l5 5 9-9"/></svg>}
            title="I have everything"
            sub="Write me the full recipe."
            onClick={() => onChoose('have')}
          />
          <GateButton
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>}
            title="I'm missing some"
            sub="Suggest swaps, or send me to the shop."
            onClick={() => onChoose('missing')}
          />
        </div>

        {/* Tertiary action */}
        <div style={{ display: 'flex', gap: 14, marginTop: 10, paddingLeft: 4 }}>
          <button style={{
            padding: 0, background: 'transparent', border: 'none',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', fontSize: 11.5, fontWeight: 500,
            color: TOKENS.inkFaint, textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}>← Show me other recipes</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Frame — desktop chat with the suggestion flow playing out.
   We expose an internal state machine: user message → suggestions
   → optional pick → optional gate → recipe.
   The artboard takes a `stage` prop so the design canvas can show
   different points in the flow side-by-side.
   ───────────────────────────────────────────────────────────────── */

function SuggestionFlowFrame({ stage = 'pick', label }) {
  // stages: 'browse' (no selection), 'pick' (one selected, gate visible),
  //         'cooking' (gate answered, recipe expanded inline)
  const [selected, setSelected]     = React.useState(stage === 'browse' ? null : 'ginger');
  const [gateChoice, setGateChoice] = React.useState(stage === 'cooking' ? 'have' : null);

  // When the user clicks a card, advance to gate. When they answer
  // the gate "I have everything", advance to recipe. (Live demo.)
  const handleSelect = (id) => {
    setSelected(id);
    setGateChoice(null);
  };
  const handleChoose = (kind) => {
    setGateChoice(kind);
  };

  const pickedRecipe = RECIPE_SUGGESTIONS.find(r => r.id === selected);

  return (
    <div style={{
      width: W_DESKTOP, height: H_DESKTOP,
      ...paperBg(TOKENS.bg),
      borderRadius: 14,
      border: `1px solid ${TOKENS.border}`,
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      boxShadow: `0 1px 0 oklch(1 0 0 / 0.5) inset, 0 30px 60px -40px oklch(0.3 0.05 50 / 0.4)`,
    }}>
      <Header active="chat" width={W_DESKTOP} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={{
          flex: '0 0 64%',
          display: 'flex', flexDirection: 'column',
          borderRight: `1px solid ${TOKENS.border}`,
          ...paperBg(TOKENS.chat),
          minHeight: 0,
        }}>
          <div style={{
            padding: '14px 28px 14px',
            borderBottom: `1px dashed ${TOKENS.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div>
              <div style={{
                fontFamily: 'Fraunces, serif', fontStyle: 'italic',
                fontWeight: 500, fontSize: 19, color: TOKENS.ink,
                letterSpacing: '-0.01em',
              }}>Tuesday's kitchen</div>
              <div style={{
                fontFamily: 'Inter, sans-serif', fontSize: 11.5,
                color: TOKENS.inkFaint, marginTop: 1,
                letterSpacing: '0.02em',
              }}>4 messages · started 4:12 pm</div>
            </div>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 10.5, fontWeight: 700,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: TOKENS.primary,
              padding: '4px 10px',
              border: `1px solid ${TOKENS.primary}`,
              borderRadius: 6,
            }}>{label}</div>
          </div>

          <div style={{
            flex: 1, padding: '20px 28px',
            display: 'flex', flexDirection: 'column', gap: 18,
            overflow: 'auto', minHeight: 0,
          }}>
            <UserMessage time="4:12 pm">
              I have chicken breast in the fridge — what can I cook tonight?
            </UserMessage>

            <SuggestionsBlock
              time="4:13 pm"
              selected={selected}
              onSelect={handleSelect}
            />

            {selected && (
              <UserMessage time="4:14 pm">
                {pickedRecipe.title} — let's go.
              </UserMessage>
            )}

            {selected && !gateChoice && (
              <IngredientGate
                recipe={pickedRecipe}
                time="4:14 pm"
                onChoose={handleChoose}
              />
            )}

            {selected && gateChoice === 'have' && (
              <div>
                <AhMahMessage time="4:15 pm">
                  Wonderful — here it is, the way I make it.
                </AhMahMessage>
                <div style={{ marginLeft: 48 }}>
                  <InlineRecipeLetter />
                </div>
              </div>
            )}

            {selected && gateChoice === 'missing' && (
              <MissingFlow recipe={pickedRecipe} />
            )}
          </div>

          <Composer />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <InventoryPanel filled />
        </div>
      </div>
    </div>
  );
}

/* When user says "I'm missing some" — Ah Mah offers swaps + a shop list.
   Conversational, not a form. */
function MissingFlow({ recipe }) {
  const shorts = recipe.short || ['shaoxing wine'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <AhMahMessage time="4:15 pm">
        No worries dear. Here's what we can do —
      </AhMahMessage>
      <div style={{ marginLeft: 48 }}>
        <div style={{
          ...paperBg(TOKENS.card),
          border: `1px solid ${TOKENS.border}`,
          borderRadius: 10,
          padding: '14px 16px',
          maxWidth: 480,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{
            fontFamily: 'Inter, sans-serif', fontSize: 10.5, fontWeight: 700,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: TOKENS.primary,
          }}>Substitutions</div>
          {shorts.map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'baseline', gap: 10,
              paddingBottom: 8,
              borderBottom: i === shorts.length - 1 ? 'none' : `1px dashed ${TOKENS.border}`,
            }}>
              <span style={{
                fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 14,
                color: TOKENS.ink, flex: '0 0 110px',
              }}>{s}</span>
              <span style={{
                fontFamily: 'Fraunces, serif', fontStyle: 'italic',
                fontSize: 13, color: TOKENS.inkSoft, lineHeight: 1.4,
                flex: 1,
              }}>
                → {s === 'shaoxing wine' ? 'a splash of dry sherry, or just skip it'
                   : s === 'lemon' ? 'lime, or a splash of rice vinegar'
                   : s === 'cilantro' ? 'spring onion greens, more of them'
                   : s === 'rice wine' ? 'mirin, or skip — won\'t miss it'
                   : s === 'white pepper' ? 'black pepper, less of it'
                   : 'I\'ll think of something'}
              </span>
            </div>
          ))}
          <div style={{
            display: 'flex', gap: 8, marginTop: 4, paddingTop: 10,
            borderTop: `1px solid ${TOKENS.borderSoft}`,
          }}>
            <button style={{
              padding: '6px 12px',
              fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
              color: '#fff', background: TOKENS.primary,
              border: `1px solid ${TOKENS.primaryInk}`,
              borderRadius: 7, cursor: 'pointer',
              boxShadow: `0 1px 0 ${TOKENS.primaryInk}`,
            }}>Use the swaps →</button>
            <button style={{
              padding: '6px 11px',
              fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
              color: TOKENS.ink, background: 'transparent',
              border: `1px solid ${TOKENS.border}`,
              borderRadius: 7, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M6 6l1 14h10l1-14M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
              Add {shorts.length} to shopping list
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.SuggestionFlowFrame = SuggestionFlowFrame;
window.SuggestionsBlock = SuggestionsBlock;
window.IngredientGate = IngredientGate;
