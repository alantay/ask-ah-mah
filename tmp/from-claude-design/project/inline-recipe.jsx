/* Inline recipe explorations — showing the WHOLE recipe inside the chat,
   not just a headline card. Four variations live here, each used by an artboard
   in the desktop section. */

/* ─────────────────────────────────────────────────────────────────
   Shared dataset — same recipe across every variation
   ───────────────────────────────────────────────────────────────── */

const GINGER_CHICKEN = {
  title: 'Ginger Chicken & Bok Choy',
  blurb: 'Velvety chicken thighs, ginger that bites a little, bok choy that still snaps. Soy, oyster, sesame — done.',
  time: '20 min',
  active: '15 min',
  servings: 2,
  heat: 'High',
  pan: 'Wok',
  ingredients: [
    { amount: '500', unit: 'g',     name: 'chicken thigh',  note: 'boneless, bite-size', have: true },
    { amount: '1',   unit: 'bunch', name: 'bok choy',       note: 'halved lengthwise',   have: true },
    { amount: '4',   unit: 'cm',    name: 'ginger',         note: 'julienned',           have: true },
    { amount: '4',   unit: 'cloves',name: 'garlic',         note: 'smashed',             have: true },
    { amount: '2',   unit: 'tbsp',  name: 'soy sauce',                                   have: true },
    { amount: '1',   unit: 'tbsp',  name: 'oyster sauce',                                have: true },
    { amount: '1',   unit: 'tsp',   name: 'sesame oil',                                  have: true },
    { amount: '1',   unit: 'tbsp',  name: 'shaoxing wine',                               short: true },
    { amount: '1',   unit: 'tsp',   name: 'cornstarch',     note: 'for marinade' },
    { amount: '2',   unit: 'stalks',name: 'spring onion',   note: 'whites + greens',     have: true },
  ],
  steps: [
    { title: 'Marinate the chicken', body: 'Toss chicken with 1 tbsp soy, the cornstarch, sesame oil and a pinch of white pepper. Leave 10 min — wash the bok choy in the meantime.', tip: "Cornstarch is the secret to that velvety texture. Don't skip it." },
    { title: 'Heat the wok smoking hot', body: 'High heat. 1½ tbsp neutral oil, swirl. When you see the first wisp of smoke, the wok is ready.' },
    { title: 'Sear chicken in two batches', body: "Single layer, don't move it for 60 seconds — let the bottom catch colour. Toss, 90 seconds more, tip onto a plate. Repeat.", tip: 'Crowding the wok steams the chicken instead of frying. Two batches takes one extra minute and is worth it.' },
    { title: 'Aromatics, then bok choy', body: 'Same wok, lower the heat. Garlic, ginger, spring-onion whites — 30 seconds, just till fragrant. Bok choy in, splash of shaoxing wine, lid on 90 seconds.' },
    { title: 'Bring it all together', body: 'Lid off. Chicken back in. Oyster sauce, the remaining soy, a splash of water. Toss for a minute till the sauce coats. Off the heat, scatter the spring-onion greens.' },
  ],
};

/* ─────────────────────────────────────────────────────────────────
   Common bits used by multiple variations
   ───────────────────────────────────────────────────────────────── */

function CornerTab() {
  return (
    <div style={{
      position: 'absolute', top: -1, right: 22,
      width: 28, height: 14,
      background: TOKENS.primary,
      borderRadius: '0 0 4px 4px',
      boxShadow: 'inset 0 -1px 0 oklch(0.45 0.12 32)',
    }}/>
  );
}

function RecipeEyebrow() {
  return (
    <div style={{
      fontFamily: 'Inter, sans-serif', fontSize: 10.5, fontWeight: 700,
      letterSpacing: '0.16em', textTransform: 'uppercase',
      color: TOKENS.primary, marginBottom: 4,
    }}>Recipe · written out</div>
  );
}

function RecipeTitle({ children, size = 22 }) {
  return (
    <div style={{
      fontFamily: 'Fraunces, serif', fontWeight: 600,
      fontSize: size, color: TOKENS.ink, lineHeight: 1.1,
      letterSpacing: '-0.01em',
    }}>{children}</div>
  );
}

function MetaRow({ extras }) {
  return (
    <div style={{
      display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap',
      paddingTop: 10, marginTop: 10,
      borderTop: `1px dashed ${TOKENS.border}`,
      fontFamily: 'ui-monospace, monospace', fontSize: 11.5,
      color: TOKENS.inkSoft,
    }}>
      <span>⏱ {GINGER_CHICKEN.time}</span>
      <span>· serves {GINGER_CHICKEN.servings}</span>
      <span>· {GINGER_CHICKEN.pan}</span>
      {extras}
    </div>
  );
}

function HaveTag({ have, short }) {
  if (have) {
    return (
      <span style={{
        fontFamily: 'Inter, sans-serif', fontSize: 9.5, fontWeight: 700,
        padding: '1px 6px',
        color: TOKENS.jade,
        background: 'oklch(0.94 0.04 168)',
        border: `1px solid oklch(0.78 0.07 168)`,
        borderRadius: 999,
        letterSpacing: '0.04em',
        flexShrink: 0,
      }}>HAVE</span>
    );
  }
  if (short) {
    return (
      <span style={{
        fontFamily: 'Inter, sans-serif', fontSize: 9.5, fontWeight: 700,
        padding: '1px 6px',
        color: 'oklch(0.42 0.18 25)',
        background: 'oklch(0.94 0.05 25)',
        border: `1px solid oklch(0.78 0.13 25)`,
        borderRadius: 999,
        letterSpacing: '0.04em',
        flexShrink: 0,
      }}>SHORT</span>
    );
  }
  return (
    <span style={{
      fontFamily: 'Inter, sans-serif', fontSize: 9.5, fontWeight: 700,
      padding: '1px 6px',
      color: TOKENS.inkFaint,
      background: 'transparent',
      border: `1px solid ${TOKENS.border}`,
      borderRadius: 999,
      letterSpacing: '0.04em',
      flexShrink: 0,
    }}>NEED</span>
  );
}

function ActionBar({ saved }) {
  return (
    <div style={{
      display: 'flex', gap: 8, alignItems: 'center',
      paddingTop: 12, marginTop: 14,
      borderTop: `1px dashed ${TOKENS.border}`,
    }}>
      <button style={{
        padding: '6px 12px',
        fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
        color: '#fff',
        background: TOKENS.primary,
        border: `1px solid ${TOKENS.primaryInk}`,
        borderRadius: 7, cursor: 'pointer',
        boxShadow: `0 1px 0 ${TOKENS.primaryInk}`,
      }}>Cook it now →</button>
      <button style={{
        padding: '6px 11px',
        fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
        color: TOKENS.ink, background: 'transparent',
        border: `1px solid ${TOKENS.border}`,
        borderRadius: 7, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 5,
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3-7 3z"/>
        </svg>
        Save to cookbook
      </button>
      <div style={{ flex: 1 }}/>
      <button style={{
        padding: '6px 11px',
        fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 500,
        color: TOKENS.inkFaint, background: 'transparent',
        border: 'none', cursor: 'pointer',
      }}>Print</button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   VARIATION A — Expanded recipe card
   The same dog-eared note from the original concept, but opened up
   to show ingredients (two columns) + numbered steps inside.
   ───────────────────────────────────────────────────────────────── */

function InlineRecipeExpanded() {
  const half = Math.ceil(GINGER_CHICKEN.ingredients.length / 2);
  const colA = GINGER_CHICKEN.ingredients.slice(0, half);
  const colB = GINGER_CHICKEN.ingredients.slice(half);
  return (
    <div style={{
      ...paperBg(TOKENS.card),
      border: `1px solid ${TOKENS.border}`,
      borderRadius: 12,
      padding: '18px 20px 16px',
      maxWidth: 540,
      marginTop: 10,
      position: 'relative',
      boxShadow: `0 1px 0 ${TOKENS.borderSoft}, 0 14px 24px -22px oklch(0.3 0.05 50 / 0.5)`,
    }}>
      <CornerTab />
      <RecipeEyebrow />
      <RecipeTitle size={24}>{GINGER_CHICKEN.title}</RecipeTitle>
      <div style={{
        fontFamily: 'Fraunces, serif', fontStyle: 'italic',
        fontSize: 13.5, color: TOKENS.inkSoft, lineHeight: 1.45,
        marginTop: 6,
      }}>{GINGER_CHICKEN.blurb}</div>

      {/* Stat strip */}
      <div style={{
        display: 'flex', gap: 16, marginTop: 14, marginBottom: 16,
        padding: '10px 12px',
        background: TOKENS.chat,
        border: `1px solid ${TOKENS.borderSoft}`,
        borderRadius: 8,
        fontFamily: 'ui-monospace, monospace', fontSize: 11,
        color: TOKENS.inkSoft,
      }}>
        <span><b style={{ color: TOKENS.ink }}>20</b> min</span>
        <span><b style={{ color: TOKENS.ink }}>15</b> active</span>
        <span><b style={{ color: TOKENS.ink }}>2</b> servings</span>
        <span style={{ marginLeft: 'auto', color: TOKENS.jade, fontWeight: 600 }}>8/10 in pantry</span>
      </div>

      {/* Ingredients in two columns */}
      <div style={{
        fontFamily: 'Inter, sans-serif', fontSize: 10.5, fontWeight: 700,
        letterSpacing: '0.16em', textTransform: 'uppercase',
        color: TOKENS.inkSoft, marginBottom: 8,
      }}>Ingredients</div>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '0 24px',
        borderTop: `1px solid ${TOKENS.border}`,
        marginBottom: 16,
      }}>
        {[colA, colB].map((col, ci) => (
          <ul key={ci} style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {col.map((ing, i) => (
              <li key={i} style={{
                display: 'flex', alignItems: 'baseline', gap: 8,
                padding: '7px 0',
                borderBottom: `1px dashed ${TOKENS.border}`,
              }}>
                <span style={{
                  flex: '0 0 64px',
                  fontFamily: 'ui-monospace, monospace', fontSize: 11.5,
                  fontWeight: 600, color: TOKENS.ink,
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                }}>{ing.amount}{ing.unit ? ' ' + ing.unit : ''}</span>
                <span style={{
                  flex: 1,
                  fontFamily: 'Fraunces, serif', fontSize: 13.5,
                  color: TOKENS.ink, lineHeight: 1.3,
                }}>
                  {ing.name}
                  {ing.note && <span style={{ color: TOKENS.inkFaint, fontStyle: 'italic', fontSize: 12 }}>, {ing.note}</span>}
                </span>
                <HaveTag have={ing.have} short={ing.short} />
              </li>
            ))}
          </ul>
        ))}
      </div>

      {/* Method */}
      <div style={{
        fontFamily: 'Inter, sans-serif', fontSize: 10.5, fontWeight: 700,
        letterSpacing: '0.16em', textTransform: 'uppercase',
        color: TOKENS.inkSoft, marginBottom: 10,
      }}>Method</div>
      <ol style={{
        listStyle: 'none', padding: 0, margin: 0,
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {GINGER_CHICKEN.steps.map((s, i) => (
          <li key={i} style={{ display: 'flex', gap: 12 }}>
            <div style={{
              flexShrink: 0, width: 26, height: 26,
              background: TOKENS.primary, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 13,
              borderRadius: '50% 50% 50% 6px',
              transform: 'rotate(-3deg)',
              boxShadow: `inset 0 -2px 0 ${TOKENS.primaryInk}`,
              marginTop: 2,
            }}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: 'Fraunces, serif', fontWeight: 600,
                fontSize: 14, color: TOKENS.ink, marginBottom: 2,
              }}>{s.title}</div>
              <div style={{
                fontFamily: 'Inter, sans-serif', fontSize: 13,
                color: TOKENS.ink, lineHeight: 1.5,
              }}>{s.body}</div>
            </div>
          </li>
        ))}
      </ol>

      <ActionBar />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   VARIATION B — Letter from Ah Mah
   The whole recipe rendered as a long handwritten-feeling note,
   in serif italic, no card chrome around it. Like a recipe she
   wrote out for you on the back of an envelope.
   ───────────────────────────────────────────────────────────────── */

/* Scale a numeric amount string by a ratio. Handles ints, decimals,
   simple fractions ('1/2'), and mixed numbers ('1 1/2'). Falls back
   to the original string if it can't parse. Rounds to nice fractions. */
function scaleAmount(amount, ratio) {
  if (!amount || ratio === 1) return amount;
  const s = String(amount).trim();
  // mixed number: "1 1/2"
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  // simple fraction: "1/2"
  const frac = s.match(/^(\d+)\/(\d+)$/);
  // plain number: "500" or "1.5"
  const num = s.match(/^(\d+(?:\.\d+)?)$/);
  let val = null;
  if (mixed) val = parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3]);
  else if (frac) val = parseInt(frac[1]) / parseInt(frac[2]);
  else if (num) val = parseFloat(num[1]);
  if (val == null) return amount;
  const scaled = val * ratio;
  // Format: integers stay int; halves/quarters get fraction glyphs; else 1 decimal
  const whole = Math.floor(scaled);
  const remainder = scaled - whole;
  const closest = [
    { v: 0,    g: ''   },
    { v: 0.25, g: '¼'  },
    { v: 0.33, g: '⅓'  },
    { v: 0.5,  g: '½'  },
    { v: 0.66, g: '⅔'  },
    { v: 0.75, g: '¾'  },
    { v: 1,    g: ''   },
  ].reduce((a, b) => Math.abs(b.v - remainder) < Math.abs(a.v - remainder) ? b : a);
  if (Math.abs(closest.v - remainder) < 0.06) {
    if (closest.v === 1) return String(whole + 1);
    if (closest.v === 0) return String(whole);
    return whole > 0 ? `${whole} ${closest.g}` : closest.g;
  }
  // Fall back to one decimal, trimmed
  return scaled >= 10 ? String(Math.round(scaled)) : scaled.toFixed(1).replace(/\.0$/, '');
}

/* Inline highlight for scaled amounts — pulses subtly when value changes
   so the user can see what just updated. Use a key on the value to retrigger. */
function ScaledNum({ children }) {
  const [pulse, setPulse] = React.useState(0);
  const prev = React.useRef(children);
  React.useEffect(() => {
    if (prev.current !== children) {
      setPulse(p => p + 1);
      prev.current = children;
    }
  }, [children]);
  return (
    <span
      key={pulse}
      style={{
        fontFamily: 'ui-monospace, monospace',
        fontStyle: 'normal',
        fontSize: 13.5,
        fontWeight: 600,
        color: TOKENS.ink,
        background: 'oklch(0.95 0.05 88 / 0.5)',
        padding: '0 4px',
        borderRadius: 3,
        animation: 'scaledPulse 0.5s ease-out',
      }}>{children}</span>
  );
}

/* Inject the pulse keyframes once */
if (typeof document !== 'undefined' && !document.getElementById('__scaled-pulse-kf')) {
  const st = document.createElement('style');
  st.id = '__scaled-pulse-kf';
  st.textContent = `@keyframes scaledPulse { 0% { background: oklch(0.86 0.14 60 / 0.7); } 100% { background: oklch(0.95 0.05 88 / 0.5); } }`;
  document.head.appendChild(st);
}

function LetterServingsStepper({ servings, setServings }) {  const baseline = GINGER_CHICKEN.servings;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'stretch',
      border: `1px solid ${TOKENS.border}`,
      borderRadius: 8,
      background: TOKENS.card,
      overflow: 'hidden',
      boxShadow: `0 1px 0 ${TOKENS.borderSoft}`,
      height: 30,
    }}>
      <button
        onClick={() => setServings(Math.max(1, servings - 1))}
        disabled={servings <= 1}
        style={{
          width: 28, border: 'none', background: 'transparent',
          cursor: servings <= 1 ? 'not-allowed' : 'pointer',
          color: servings <= 1 ? TOKENS.inkFaint : TOKENS.ink,
          fontSize: 16, fontWeight: 600,
          borderRight: `1px solid ${TOKENS.border}`,
          opacity: servings <= 1 ? 0.5 : 1,
        }}>−</button>
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'center', minWidth: 64, padding: '0 8px',
        lineHeight: 1,
      }}>
        <span style={{
          fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 14,
          color: TOKENS.ink, fontVariantNumeric: 'tabular-nums',
        }}>
          {servings} {servings === 1 ? 'serving' : 'servings'}
        </span>
        {servings !== baseline && (
          <span style={{
            fontFamily: 'ui-monospace, monospace', fontSize: 9,
            color: TOKENS.inkFaint, marginTop: 2,
            letterSpacing: '0.04em',
          }}>×{(servings / baseline).toFixed(2).replace(/\.?0+$/, '')} from {baseline}</span>
        )}
      </div>
      <button
        onClick={() => setServings(Math.min(12, servings + 1))}
        disabled={servings >= 12}
        style={{
          width: 28, border: 'none', background: 'transparent',
          cursor: servings >= 12 ? 'not-allowed' : 'pointer',
          color: servings >= 12 ? TOKENS.inkFaint : TOKENS.ink,
          fontSize: 16, fontWeight: 600,
          borderLeft: `1px solid ${TOKENS.border}`,
        }}>+</button>
    </div>
  );
}

function InlineRecipeLetter() {
  const [servings, setServings] = React.useState(GINGER_CHICKEN.servings);
  const ratio = servings / GINGER_CHICKEN.servings;
  const ing = GINGER_CHICKEN.ingredients;
  // Build the inline ingredient prose with scaled amounts
  const phrase = (i) => {
    const a = scaleAmount(ing[i].amount, ratio);
    const u = ing[i].unit ? ' ' + ing[i].unit : '';
    return `${a}${u}`;
  };
  return (
    <div style={{
      ...paperBg(TOKENS.chat),
      borderTop: `1px solid ${TOKENS.borderSoft}`,
      borderBottom: `1px solid ${TOKENS.borderSoft}`,
      padding: '20px 26px 22px',
      maxWidth: 560,
      marginTop: 10,
      position: 'relative',
      // top + bottom torn-paper edges via gradient stitching
      backgroundImage: `${PAPER_NOISE_URL}, ${PAPER_FIBERS_URL}`,
    }}>
      {/* ribbon header — shows we're inside a recipe, but not a heavy card */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 14, paddingBottom: 10,
        borderBottom: `1px dashed ${TOKENS.border}`,
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: 999,
          background: TOKENS.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff',
        }}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <path d="M3 2v12l5-3 5 3V2z" stroke="currentColor" strokeWidth="1.4" fill="currentColor"/>
          </svg>
        </div>
        <div style={{
          fontFamily: 'Inter, sans-serif', fontSize: 10.5, fontWeight: 700,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: TOKENS.inkSoft,
        }}>The way I make it</div>
        <div style={{ flex: 1 }}/>
        <div style={{
          fontFamily: 'ui-monospace, monospace', fontSize: 10.5,
          color: TOKENS.inkFaint,
        }}>20 min · wok</div>
        <LetterServingsStepper servings={servings} setServings={setServings} />
      </div>

      <div style={{
        fontFamily: 'Fraunces, serif',
        fontSize: 28, fontWeight: 600,
        color: TOKENS.ink, lineHeight: 1.05,
        letterSpacing: '-0.015em',
        marginBottom: 14,
      }}>{GINGER_CHICKEN.title}</div>

      {/* What you need — inline-flowing list, no table */}
      <div style={{
        fontFamily: 'Fraunces, serif', fontStyle: 'italic',
        fontSize: 15, color: TOKENS.inkSoft, lineHeight: 1.6,
        marginBottom: 18,
      }}>
        <b style={{ fontStyle: 'normal', color: TOKENS.ink, fontWeight: 600 }}>You'll need —</b>{' '}
        <ScaledNum>{phrase(0)}</ScaledNum> chicken thigh (boneless, bite-size),{' '}
        <ScaledNum>{servings === GINGER_CHICKEN.servings ? 'a bunch of' : `${scaleAmount('1', ratio)} bunch${ratio > 1.4 ? 'es' : ''} of`}</ScaledNum> bok choy,{' '}
        <ScaledNum>{phrase(2)}</ScaledNum> ginger,{' '}
        <ScaledNum>{phrase(3)}</ScaledNum> garlic,{' '}
        <ScaledNum>{phrase(4)}</ScaledNum> soy sauce,{' '}
        <ScaledNum>{phrase(5)}</ScaledNum> oyster sauce,{' '}
        <ScaledNum>{phrase(6)}</ScaledNum> sesame oil,{' '}
        <ScaledNum>{phrase(7)}</ScaledNum> shaoxing if you have it,{' '}
        <ScaledNum>{phrase(8)}</ScaledNum> cornstarch,{' '}
        <ScaledNum>{phrase(9)}</ScaledNum> spring onion.
        <span style={{
          marginLeft: 6,
          fontFamily: 'Inter, sans-serif', fontStyle: 'normal',
          fontSize: 11, fontWeight: 600,
          color: TOKENS.jade,
          padding: '1px 7px',
          background: 'oklch(0.94 0.04 168)',
          border: `1px solid oklch(0.78 0.07 168)`,
          borderRadius: 999,
        }}>8/10 in your pantry</span>
      </div>

      {/* Method — flowing prose with inline numbers as tiny ink stamps */}
      <div style={{
        fontFamily: 'Fraunces, serif',
        fontSize: 16, color: TOKENS.ink, lineHeight: 1.65,
        textWrap: 'pretty',
      }}>
        {GINGER_CHICKEN.steps.map((s, i) => (
          <p key={i} style={{ margin: '0 0 14px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 22, height: 22,
              background: TOKENS.primary, color: '#fff',
              fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 12,
              borderRadius: '50% 50% 50% 5px',
              transform: 'rotate(-3deg) translateY(-2px)',
              marginRight: 8,
              boxShadow: `inset 0 -1px 0 ${TOKENS.primaryInk}`,
              verticalAlign: 'middle',
            }}>{i + 1}</span>
            <span style={{ fontWeight: 600 }}>{s.title}.</span>{' '}
            <span style={{ fontStyle: 'italic', color: TOKENS.ink }}>{s.body}</span>
            {s.tip && (
              <span style={{ display: 'block', marginTop: 6, marginLeft: 30,
                fontSize: 13.5, color: TOKENS.inkSoft, fontStyle: 'italic',
                borderLeft: `2px solid ${TOKENS.primary}`,
                paddingLeft: 10,
              }}>— {s.tip}</span>
            )}
          </p>
        ))}
      </div>

      <ActionBar />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   VARIATION C — Tabbed recipe card
   Compact card, header stays the same, but Ingredients / Method / Tips
   live behind tabs. Body is fully visible by default (Method open).
   ───────────────────────────────────────────────────────────────── */

function InlineRecipeTabbed() {
  const [tab, setTab] = React.useState('method');
  const tabs = [
    { id: 'ingredients', label: 'Ingredients', count: 10 },
    { id: 'method',      label: 'Method',      count: 5  },
    { id: 'tips',        label: 'Ah Mah\u2019s tips', count: 2 },
  ];
  return (
    <div style={{
      ...paperBg(TOKENS.card),
      border: `1px solid ${TOKENS.border}`,
      borderRadius: 12,
      padding: '16px 20px 16px',
      maxWidth: 540,
      marginTop: 10,
      position: 'relative',
      boxShadow: `0 1px 0 ${TOKENS.borderSoft}, 0 14px 24px -22px oklch(0.3 0.05 50 / 0.5)`,
    }}>
      <CornerTab />
      <RecipeEyebrow />
      <RecipeTitle size={22}>{GINGER_CHICKEN.title}</RecipeTitle>
      <div style={{
        fontFamily: 'Fraunces, serif', fontStyle: 'italic',
        fontSize: 13, color: TOKENS.inkSoft, lineHeight: 1.4,
        marginTop: 4, marginBottom: 12,
      }}>{GINGER_CHICKEN.blurb}</div>

      <MetaRow extras={
        <span style={{ marginLeft: 'auto', color: TOKENS.jade, fontWeight: 600 }}>
          ✓ 8/10 in pantry
        </span>
      }/>

      {/* Tab strip — paper folder tabs */}
      <div style={{
        display: 'flex', gap: 2, marginTop: 18, marginBottom: -1,
        position: 'relative', zIndex: 1,
      }}>
        {tabs.map(t => {
          const on = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '7px 14px 8px',
              fontFamily: 'Inter, sans-serif', fontSize: 12,
              fontWeight: on ? 700 : 500,
              color: on ? TOKENS.ink : TOKENS.inkFaint,
              background: on ? TOKENS.chat : 'transparent',
              border: `1px solid ${on ? TOKENS.border : 'transparent'}`,
              borderBottom: on ? `1px solid ${TOKENS.chat}` : `1px solid ${TOKENS.border}`,
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              {t.label}
              <span style={{
                fontFamily: 'ui-monospace, monospace', fontSize: 10,
                color: TOKENS.inkFaint, fontWeight: 500,
              }}>{t.count}</span>
            </button>
          );
        })}
        <div style={{ flex: 1, borderBottom: `1px solid ${TOKENS.border}` }}/>
      </div>

      {/* Panel */}
      <div style={{
        ...paperBg(TOKENS.chat),
        border: `1px solid ${TOKENS.border}`,
        borderTop: 'none',
        borderRadius: '0 8px 8px 8px',
        padding: '14px 16px 14px',
        minHeight: 240,
      }}>
        {tab === 'ingredients' && (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {GINGER_CHICKEN.ingredients.map((ing, i) => (
              <li key={i} style={{
                display: 'flex', alignItems: 'baseline', gap: 10,
                padding: '6px 0',
                borderBottom: i === GINGER_CHICKEN.ingredients.length - 1 ? 'none' : `1px dashed ${TOKENS.border}`,
              }}>
                <span style={{
                  flex: '0 0 78px',
                  fontFamily: 'ui-monospace, monospace', fontSize: 11.5,
                  fontWeight: 600, color: TOKENS.ink,
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                }}>{ing.amount} {ing.unit}</span>
                <span style={{
                  flex: 1,
                  fontFamily: 'Fraunces, serif', fontSize: 14,
                  color: TOKENS.ink,
                }}>
                  {ing.name}
                  {ing.note && <span style={{ color: TOKENS.inkFaint, fontStyle: 'italic', fontSize: 12.5 }}>, {ing.note}</span>}
                </span>
                <HaveTag have={ing.have} short={ing.short} />
              </li>
            ))}
          </ul>
        )}

        {tab === 'method' && (
          <ol style={{
            listStyle: 'none', padding: 0, margin: 0,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {GINGER_CHICKEN.steps.map((s, i) => (
              <li key={i} style={{ display: 'flex', gap: 12 }}>
                <div style={{
                  flexShrink: 0, width: 24, height: 24,
                  background: TOKENS.primary, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 12,
                  borderRadius: '50% 50% 50% 5px',
                  transform: 'rotate(-3deg)',
                  marginTop: 2,
                }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: 'Fraunces, serif', fontWeight: 600,
                    fontSize: 13.5, color: TOKENS.ink, marginBottom: 1,
                  }}>{s.title}</div>
                  <div style={{
                    fontFamily: 'Inter, sans-serif', fontSize: 12.5,
                    color: TOKENS.ink, lineHeight: 1.5,
                  }}>{s.body}</div>
                </div>
              </li>
            ))}
          </ol>
        )}

        {tab === 'tips' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {GINGER_CHICKEN.steps.filter(s => s.tip).map((s, i) => (
              <div key={i} style={{
                padding: '10px 14px',
                background: 'oklch(0.96 0.05 88)',
                border: `1px dashed oklch(0.75 0.08 88)`,
                borderRadius: 8,
                display: 'flex', gap: 12,
              }}>
                <div style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em',
                  textTransform: 'uppercase', color: 'oklch(0.45 0.10 60)',
                  flexShrink: 0, paddingTop: 3, width: 70,
                }}>Step {GINGER_CHICKEN.steps.indexOf(s) + 1}</div>
                <div>
                  <div style={{
                    fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 12,
                    color: TOKENS.ink, marginBottom: 3,
                  }}>{s.title}</div>
                  <div style={{
                    fontFamily: 'Fraunces, serif', fontStyle: 'italic',
                    fontSize: 13, color: TOKENS.ink, lineHeight: 1.5,
                  }}>{s.tip}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ActionBar />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   VARIATION D — Conversational steps
   Ah Mah dictates the recipe as a sequence of message bubbles —
   the recipe IS the conversation. A small "pin" sticks the recipe
   header to the top so the user can save it without scrolling back.
   ───────────────────────────────────────────────────────────────── */

function PinnedHeader() {
  return (
    <div style={{
      ...paperBg(TOKENS.card),
      border: `1px solid ${TOKENS.border}`,
      borderRadius: 10,
      padding: '10px 14px',
      maxWidth: 540, marginTop: 4, marginBottom: 6,
      position: 'relative',
      boxShadow: `0 1px 0 ${TOKENS.borderSoft}, 0 14px 24px -22px oklch(0.3 0.05 50 / 0.5)`,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      {/* push-pin */}
      <div style={{
        position: 'absolute', top: -7, left: 16,
        width: 12, height: 12, borderRadius: 999,
        background: TOKENS.primary,
        boxShadow: `inset 0 -2px 0 ${TOKENS.primaryInk}, 0 1px 2px oklch(0 0 0 / 0.25)`,
      }}/>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'Inter, sans-serif', fontSize: 9.5, fontWeight: 700,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: TOKENS.primary, marginBottom: 1,
        }}>Pinned recipe</div>
        <div style={{
          fontFamily: 'Fraunces, serif', fontWeight: 600,
          fontSize: 17, color: TOKENS.ink, lineHeight: 1.1,
          letterSpacing: '-0.01em',
        }}>{GINGER_CHICKEN.title}</div>
        <div style={{
          fontFamily: 'ui-monospace, monospace', fontSize: 10.5,
          color: TOKENS.inkFaint, marginTop: 2,
        }}>20 min · serves 2 · 8/10 in pantry</div>
      </div>
      <button style={{
        padding: '5px 10px',
        fontFamily: 'Inter, sans-serif', fontSize: 11.5, fontWeight: 600,
        color: TOKENS.ink, background: 'transparent',
        border: `1px solid ${TOKENS.border}`,
        borderRadius: 7, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 5,
      }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3-7 3z"/>
        </svg>
        Save
      </button>
      <button style={{
        padding: '5px 10px',
        fontFamily: 'Inter, sans-serif', fontSize: 11.5, fontWeight: 600,
        color: '#fff',
        background: TOKENS.primary,
        border: `1px solid ${TOKENS.primaryInk}`,
        borderRadius: 7, cursor: 'pointer',
      }}>Cook →</button>
    </div>
  );
}

function StepBubble({ n, title, body, tip }) {
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-start',
      maxWidth: 560,
    }}>
      <div style={{
        flexShrink: 0, width: 36, height: 36,
        background: TOKENS.primary, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 17,
        borderRadius: '50% 50% 50% 8px',
        transform: 'rotate(-3deg)',
        boxShadow: `inset 0 -2px 0 ${TOKENS.primaryInk}, 0 1px 0 ${TOKENS.primaryInk}`,
      }}>{n}</div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600,
          color: TOKENS.inkSoft, letterSpacing: '0.06em',
          textTransform: 'uppercase', marginBottom: 4,
        }}>
          Ah Mah · step {n}
        </div>
        <div style={{
          fontFamily: 'Fraunces, serif', fontWeight: 600,
          fontSize: 16, color: TOKENS.ink, marginBottom: 4,
          letterSpacing: '-0.005em',
        }}>{title}</div>
        <div style={{
          fontFamily: 'Fraunces, serif', fontStyle: 'italic',
          fontSize: 16, color: TOKENS.ink, lineHeight: 1.55,
        }}>{body}</div>
        {tip && (
          <div style={{
            marginTop: 8,
            padding: '8px 12px',
            background: 'oklch(0.96 0.05 88)',
            border: `1px dashed oklch(0.75 0.08 88)`,
            borderRadius: 8,
            fontFamily: 'Fraunces, serif', fontStyle: 'italic',
            fontSize: 13, color: TOKENS.ink, lineHeight: 1.45,
          }}>
            <span style={{
              fontFamily: 'Inter, sans-serif', fontStyle: 'normal',
              fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em',
              textTransform: 'uppercase', color: 'oklch(0.45 0.10 60)',
              marginRight: 6,
            }}>Tip</span>
            {tip}
          </div>
        )}
      </div>
    </div>
  );
}

function IngredientsBubble() {
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-start',
      maxWidth: 560,
    }}>
      <GrannyAvatar size={36} />
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600,
          color: TOKENS.inkSoft, letterSpacing: '0.06em',
          textTransform: 'uppercase', marginBottom: 4,
        }}>Ah Mah · what to gather</div>
        <div style={{
          fontFamily: 'Fraunces, serif', fontStyle: 'italic',
          fontSize: 16, color: TOKENS.ink, lineHeight: 1.5, marginBottom: 10,
        }}>
          Pull these out first, then we won't be running around mid-cook —
        </div>
        <div style={{
          ...paperBg(TOKENS.card),
          border: `1px solid ${TOKENS.border}`,
          borderRadius: 10,
          padding: '10px 14px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4px 18px',
          boxShadow: `0 1px 0 ${TOKENS.borderSoft}`,
        }}>
          {GINGER_CHICKEN.ingredients.map((ing, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'baseline', gap: 8,
              padding: '5px 0',
              borderBottom: i < GINGER_CHICKEN.ingredients.length - 2 ? `1px dashed ${TOKENS.border}` : 'none',
            }}>
              <span style={{
                flex: '0 0 56px',
                fontFamily: 'ui-monospace, monospace', fontSize: 11,
                fontWeight: 600, color: TOKENS.ink,
                textAlign: 'right',
              }}>{ing.amount}{ing.unit ? ' ' + ing.unit : ''}</span>
              <span style={{
                flex: 1,
                fontFamily: 'Fraunces, serif', fontSize: 13,
                color: TOKENS.ink,
              }}>{ing.name}</span>
              <HaveTag have={ing.have} short={ing.short} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConversationalRecipe() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PinnedHeader />
      <IngredientsBubble />
      {GINGER_CHICKEN.steps.map((s, i) => (
        <StepBubble key={i} n={i + 1} {...s} />
      ))}
      {/* closing message */}
      <AhMahMessage time="4:18 pm">
        That's it dear. If your wok's smoking too much, lower it a notch —
        smoke is good, fire alarm is not. Tell me how it goes.
      </AhMahMessage>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Frame — reuses DesktopChat layout but swaps the AhMah message
   payload with a chosen variation.
   ───────────────────────────────────────────────────────────────── */

function InlineRecipeFrame({ variant, label }) {
  let body;
  if (variant === 'expanded')      body = <InlineRecipeExpanded />;
  else if (variant === 'letter')   body = <InlineRecipeLetter />;
  else if (variant === 'tabbed')   body = <InlineRecipeTabbed />;
  else                              body = null; // conversational handled differently

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
        {/* Chat column */}
        <div style={{
          flex: '0 0 64%',
          display: 'flex', flexDirection: 'column',
          borderRight: `1px solid ${TOKENS.border}`,
          ...paperBg(TOKENS.chat),
          minHeight: 0,
        }}>
          {/* Conversation header */}
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
              }}>{variant === 'conversational' ? '9 messages' : '3 messages'} · started 4:12 pm</div>
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

          {/* Conversation scroll area */}
          <div style={{
            flex: 1, padding: '20px 28px',
            display: 'flex', flexDirection: 'column', gap: 18,
            overflow: 'auto',
            minHeight: 0,
          }}>
            <AhMahMessage time="4:12 pm">
              Hello dear! Show Ah Mah what you have in the kitchen, then I can suggest something nice.
            </AhMahMessage>

            <UserMessage time="4:13 pm">
              I have chicken, bok choy, ginger and a wok. Quick dinner for 2.
            </UserMessage>

            {variant === 'conversational' ? (
              <ConversationalRecipe />
            ) : (
              <div>
                <AhMahMessage time="4:14 pm">
                  Ah, perfect for ginger chicken stir-fry. 20 minutes, one pan.
                  Let me write the whole thing out for you —
                </AhMahMessage>
                <div style={{ marginLeft: 48 }}>
                  {body}
                </div>
              </div>
            )}
          </div>

          <Composer />
        </div>

        {/* Inventory column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <InventoryPanel filled />
        </div>
      </div>
    </div>
  );
}

window.InlineRecipeFrame = InlineRecipeFrame;
window.InlineRecipeExpanded = InlineRecipeExpanded;
window.InlineRecipeLetter = InlineRecipeLetter;
window.InlineRecipeTabbed = InlineRecipeTabbed;
window.ConversationalRecipe = ConversationalRecipe;
