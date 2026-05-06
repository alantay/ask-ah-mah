/* Recipe detail page — shown when a recipe is opened from the cookbook
   or from a chat "Save to cookbook" card. Renders in a side sheet on desktop,
   full screen on mobile. This artboard shows the desktop version. */

function RecipeStatChip({ label, value, mono }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      padding: '8px 14px',
      background: TOKENS.card,
      border: `1px solid ${TOKENS.border}`,
      borderRadius: 8,
      minWidth: 78,
      boxShadow: `0 1px 0 ${TOKENS.borderSoft}`,
    }}>
      <span style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 9.5, fontWeight: 700,
        letterSpacing: '0.16em', textTransform: 'uppercase',
        color: TOKENS.inkFaint,
      }}>{label}</span>
      <span style={{
        fontFamily: mono ? 'ui-monospace, monospace' : 'Fraunces, serif',
        fontSize: 18, fontWeight: 600, color: TOKENS.ink,
        fontVariantNumeric: 'tabular-nums',
        marginTop: 2,
      }}>{value}</span>
    </div>
  );
}

function ServingsStepper({ servings = 2 }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      gap: 0,
      border: `1px solid ${TOKENS.border}`,
      borderRadius: 8,
      background: TOKENS.card,
      overflow: 'hidden',
      boxShadow: `0 1px 0 ${TOKENS.borderSoft}`,
    }}>
      <button style={{
        width: 32, height: 32, border: 'none',
        background: 'transparent', cursor: 'pointer',
        color: TOKENS.ink, fontSize: 16, fontWeight: 600,
        borderRight: `1px solid ${TOKENS.border}`,
      }}>−</button>
      <span style={{
        minWidth: 44, textAlign: 'center',
        fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 15,
        color: TOKENS.ink,
      }}>{servings}</span>
      <button style={{
        width: 32, height: 32, border: 'none',
        background: 'transparent', cursor: 'pointer',
        color: TOKENS.ink, fontSize: 16, fontWeight: 600,
        borderLeft: `1px solid ${TOKENS.border}`,
      }}>+</button>
    </div>
  );
}

function IngredientRow({ amount, unit, name, note, short, have }) {
  return (
    <li style={{
      display: 'flex', alignItems: 'baseline', gap: 12,
      padding: '10px 0',
      borderBottom: `1px dashed ${TOKENS.border}`,
    }}>
      <span style={{
        flex: '0 0 96px',
        fontFamily: 'ui-monospace, monospace',
        fontSize: 13, fontWeight: 600, color: TOKENS.ink,
        fontVariantNumeric: 'tabular-nums',
        textAlign: 'right',
      }}>
        {amount ? `${amount}${unit ? ' ' + unit : ''}` : '—'}
      </span>
      <span style={{
        flex: 1,
        fontFamily: 'Fraunces, serif',
        fontSize: 15, color: TOKENS.ink, lineHeight: 1.4,
      }}>
        {name}
        {note && <span style={{ color: TOKENS.inkFaint, fontStyle: 'italic', fontSize: 13.5 }}>, {note}</span>}
      </span>
      {have && (
        <span style={{
          fontFamily: 'Inter, sans-serif', fontSize: 10.5, fontWeight: 600,
          padding: '2px 7px',
          color: TOKENS.jade,
          background: 'oklch(0.94 0.04 168)',
          border: `1px solid oklch(0.78 0.07 168)`,
          borderRadius: 999,
          letterSpacing: '0.02em',
          flexShrink: 0,
        }}>in pantry</span>
      )}
      {short && (
        <span style={{
          fontFamily: 'Inter, sans-serif', fontSize: 10.5, fontWeight: 600,
          padding: '2px 7px',
          color: 'oklch(0.42 0.18 25)',
          background: 'oklch(0.94 0.05 25)',
          border: `1px solid oklch(0.78 0.13 25)`,
          borderRadius: 999,
          letterSpacing: '0.02em',
          flexShrink: 0,
        }}>short {short}</span>
      )}
    </li>
  );
}

function StepRow({ n, title, body, tip }) {
  return (
    <div style={{
      display: 'flex', gap: 16, paddingBottom: 22,
      borderBottom: `1px solid ${TOKENS.borderSoft}`,
      marginBottom: 22,
    }}>
      {/* Step number — looks like a hand-stamped ink mark */}
      <div style={{
        flexShrink: 0,
        width: 38, height: 38,
        background: TOKENS.primary,
        color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Fraunces, serif',
        fontWeight: 700, fontSize: 18,
        borderRadius: '50% 50% 50% 8px',
        boxShadow: `inset 0 -2px 0 ${TOKENS.primaryInk}, 0 1px 0 ${TOKENS.primaryInk}`,
        transform: 'rotate(-3deg)',
      }}>{n}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'Fraunces, serif', fontWeight: 600,
          fontSize: 17, color: TOKENS.ink,
          letterSpacing: '-0.005em',
          marginBottom: 6, marginTop: 6,
        }}>{title}</div>
        <div style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 14.5, color: TOKENS.ink,
          lineHeight: 1.6,
        }}>{body}</div>
        {tip && (
          <div style={{
            marginTop: 12,
            padding: '10px 14px',
            background: 'oklch(0.96 0.05 88)',
            border: `1px dashed oklch(0.75 0.08 88)`,
            borderRadius: 8,
            fontFamily: 'Fraunces, serif', fontStyle: 'italic',
            fontSize: 13.5, color: TOKENS.ink, lineHeight: 1.5,
            display: 'flex', gap: 10,
          }}>
            <span style={{
              fontFamily: 'Inter, sans-serif', fontStyle: 'normal',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: 'oklch(0.45 0.10 60)',
              flexShrink: 0, paddingTop: 2,
            }}>Ah Mah says</span>
            <span style={{ flex: 1 }}>{tip}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function RecipePage() {
  const ingredients = [
    { amount: '500', unit: 'g', name: 'chicken thigh', note: 'boneless, cut bite-size', have: true },
    { amount: '1', unit: 'bunch', name: 'bok choy', note: 'halved lengthwise', have: true },
    { amount: '4', unit: 'cm', name: 'ginger', note: 'julienned', have: true },
    { amount: '4', unit: 'cloves', name: 'garlic', note: 'smashed', have: true },
    { amount: '2', unit: 'tbsp', name: 'soy sauce', have: true },
    { amount: '1', unit: 'tbsp', name: 'oyster sauce', have: true },
    { amount: '1', unit: 'tsp', name: 'sesame oil', have: true },
    { amount: '1', unit: 'tbsp', name: 'shaoxing wine', short: '1 tbsp' },
    { amount: '1', unit: 'tsp', name: 'cornstarch', note: 'for marinade' },
    { amount: '2', unit: 'stalks', name: 'spring onion', note: 'whites and greens separated', have: true },
  ];

  return (
    <div style={{
      width: W_DESKTOP, height: H_DESKTOP,
      ...paperBg(TOKENS.bg),
      borderRadius: 14,
      border: `1px solid ${TOKENS.border}`,
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      boxShadow: `0 30px 60px -40px oklch(0.3 0.05 50 / 0.4)`,
    }}>
      <Header active="cookbook" width={W_DESKTOP} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Faded cookbook in the background — shows we're in a sheet */}
        <div style={{
          flex: '0 0 30%',
          ...paperBg(TOKENS.tray),
          borderRight: `1px solid ${TOKENS.border}`,
          padding: '24px 28px',
          opacity: 0.55,
          pointerEvents: 'none',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <Eyebrow>Yours, kept</Eyebrow>
          <div style={{
            fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 30,
            color: TOKENS.ink, letterSpacing: '-0.02em', lineHeight: 1,
          }}>My Cookbook</div>
          <div style={{
            fontFamily: 'Fraunces, serif', fontStyle: 'italic',
            fontSize: 13, color: TOKENS.inkSoft,
          }}>6 saved · last added Tuesday</div>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10,
          }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{
                height: 110, background: TOKENS.card,
                border: `1px solid ${TOKENS.border}`,
                borderRadius: 8,
              }}/>
            ))}
          </div>
        </div>

        {/* Recipe sheet — slides over from the right, shadow on its left edge */}
        <div style={{
          flex: 1, minWidth: 0,
          ...paperBg(TOKENS.chat),
          display: 'flex', flexDirection: 'column',
          boxShadow: `-20px 0 40px -20px oklch(0.3 0.05 50 / 0.3)`,
          position: 'relative',
        }}>
          {/* Sheet drag handle / close */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 24px',
            borderBottom: `1px dashed ${TOKENS.border}`,
          }}>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 11.5, fontWeight: 600,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: TOKENS.inkFaint,
            }}>← Back to cookbook</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{
                padding: '6px 12px',
                fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
                color: TOKENS.inkSoft,
                background: 'transparent', border: `1px solid ${TOKENS.border}`,
                borderRadius: 8, cursor: 'pointer',
              }}>Print</button>
              <button style={{
                padding: '6px 12px',
                fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
                color: TOKENS.inkSoft,
                background: 'transparent', border: `1px solid ${TOKENS.border}`,
                borderRadius: 8, cursor: 'pointer',
              }}>Copy</button>
              <button style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'transparent', border: `1px solid ${TOKENS.border}`,
                color: TOKENS.inkSoft, cursor: 'pointer',
                fontSize: 14,
              }}>✕</button>
            </div>
          </div>

          <div style={{
            flex: 1, overflow: 'auto', padding: '0',
          }}>
            {/* Hero strip — placeholder dish photo */}
            <div style={{
              height: 220,
              background: `linear-gradient(135deg,
                oklch(0.55 0.13 35) 0%,
                oklch(0.42 0.10 30) 100%)`,
              position: 'relative',
              display: 'flex', alignItems: 'flex-end',
              borderBottom: `1px solid ${TOKENS.border}`,
            }}>
              {/* repeating "wok hei" diagonal pattern */}
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `repeating-linear-gradient(135deg,
                  oklch(1 0 0 / 0.04) 0 12px, transparent 12px 24px)`,
              }}/>
              <div style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: 10, color: 'oklch(1 0 0 / 0.5)',
                letterSpacing: '0.2em',
                position: 'absolute', top: 12, right: 16,
              }}>DISH PHOTO</div>
              <div style={{
                position: 'relative',
                padding: '24px 36px 22px',
                color: '#fff',
                width: '100%',
                background: `linear-gradient(to top, oklch(0 0 0 / 0.3), transparent)`,
              }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <span style={{
                    fontFamily: 'Inter, sans-serif', fontSize: 10.5, fontWeight: 600,
                    padding: '3px 9px',
                    color: '#fff',
                    background: 'oklch(1 0 0 / 0.18)',
                    border: `1px solid oklch(1 0 0 / 0.35)`,
                    borderRadius: 999,
                    backdropFilter: 'blur(4px)',
                    letterSpacing: '0.04em',
                  }}>poultry</span>
                  <span style={{
                    fontFamily: 'Inter, sans-serif', fontSize: 10.5, fontWeight: 600,
                    padding: '3px 9px',
                    color: '#fff',
                    background: 'oklch(1 0 0 / 0.18)',
                    border: `1px solid oklch(1 0 0 / 0.35)`,
                    borderRadius: 999,
                    letterSpacing: '0.04em',
                  }}>one-pan</span>
                  <span style={{
                    fontFamily: 'Inter, sans-serif', fontSize: 10.5, fontWeight: 600,
                    padding: '3px 9px',
                    color: '#fff',
                    background: 'oklch(1 0 0 / 0.18)',
                    border: `1px solid oklch(1 0 0 / 0.35)`,
                    borderRadius: 999,
                    letterSpacing: '0.04em',
                  }}>20-min</span>
                </div>
                <h1 style={{
                  fontFamily: 'Fraunces, serif', fontWeight: 600,
                  fontSize: 38, lineHeight: 1, margin: 0,
                  letterSpacing: '-0.02em',
                  textShadow: `0 2px 8px oklch(0 0 0 / 0.3)`,
                }}>Ginger Chicken &amp; Bok Choy</h1>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '24px 36px 48px' }}>
              {/* Ah Mah's note */}
              <div style={{
                display: 'flex', gap: 14, alignItems: 'flex-start',
                marginBottom: 24,
                paddingBottom: 22, borderBottom: `1px dashed ${TOKENS.border}`,
              }}>
                <GrannyAvatar size={42} />
                <div>
                  <div style={{
                    fontFamily: 'Inter, sans-serif', fontSize: 10.5, fontWeight: 700,
                    letterSpacing: '0.16em', textTransform: 'uppercase',
                    color: TOKENS.inkFaint, marginBottom: 5,
                  }}>From Ah Mah</div>
                  <div style={{
                    fontFamily: 'Fraunces, serif', fontStyle: 'italic',
                    fontSize: 16, color: TOKENS.ink, lineHeight: 1.5,
                    maxWidth: 560,
                  }}>
                    Velvety chicken thighs, ginger that bites a little, bok choy that still
                    snaps. The trick is to cook the chicken hot and fast, then let the ginger
                    and garlic finish in the same pan — keeps everything talking to each other.
                  </div>
                </div>
              </div>

              {/* Stat row */}
              <div style={{
                display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap',
              }}>
                <RecipeStatChip label="Total time" value="20 min" />
                <RecipeStatChip label="Active" value="15 min" />
                <RecipeStatChip label="Heat" value="High" />
                <RecipeStatChip label="Pan" value="Wok" />
                <div style={{ flex: 1 }}/>
                <div style={{
                  display: 'flex', flexDirection: 'column', justifyContent: 'center',
                  alignItems: 'flex-end', gap: 6,
                }}>
                  <span style={{
                    fontFamily: 'Inter, sans-serif', fontSize: 10.5, fontWeight: 700,
                    letterSpacing: '0.16em', textTransform: 'uppercase',
                    color: TOKENS.inkFaint,
                  }}>Servings</span>
                  <ServingsStepper servings={2} />
                </div>
              </div>

              {/* Ingredients */}
              <section style={{ marginBottom: 36 }}>
                <div style={{
                  display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                  marginBottom: 4,
                }}>
                  <h2 style={{
                    fontFamily: 'Fraunces, serif', fontWeight: 600,
                    fontSize: 26, color: TOKENS.ink, letterSpacing: '-0.015em',
                    margin: 0,
                  }}>Ingredients</h2>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    fontFamily: 'Inter, sans-serif', fontSize: 12,
                    color: TOKENS.inkSoft,
                  }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: TOKENS.jade }}/>
                      8 in pantry
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'oklch(0.6 0.18 25)' }}/>
                      1 short, 1 missing
                    </span>
                  </div>
                </div>
                <ul style={{
                  listStyle: 'none', padding: 0, margin: '8px 0 0',
                  borderTop: `1px solid ${TOKENS.border}`,
                }}>
                  {ingredients.map((ing, i) => <IngredientRow key={i} {...ing} />)}
                </ul>
                <button style={{
                  marginTop: 14,
                  padding: '8px 14px',
                  fontFamily: 'Inter, sans-serif', fontSize: 12.5, fontWeight: 600,
                  color: TOKENS.ink,
                  background: TOKENS.card,
                  border: `1px solid ${TOKENS.border}`,
                  borderRadius: 8, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  boxShadow: `0 1px 0 ${TOKENS.borderSoft}`,
                }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1.5 V14.5 M1.5 8 H14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Add 2 missing items to pantry list
                </button>
              </section>

              {/* Method */}
              <section>
                <h2 style={{
                  fontFamily: 'Fraunces, serif', fontWeight: 600,
                  fontSize: 26, color: TOKENS.ink, letterSpacing: '-0.015em',
                  margin: '0 0 18px',
                }}>Method</h2>

                <StepRow
                  n="1"
                  title="Marinate the chicken"
                  body="Toss the chicken with 1 tbsp soy sauce, the cornstarch, sesame oil and a pinch of white pepper. Leave it 10 minutes — go wash the bok choy in the meantime."
                  tip="Cornstarch is the secret to that velvety texture. Don't skip it, even if you're in a rush."
                />
                <StepRow
                  n="2"
                  title="Heat the wok smoking hot"
                  body="High heat. Add 1½ tbsp neutral oil and swirl. When the oil shimmers and you see the first wisp of smoke, the wok is ready."
                />
                <StepRow
                  n="3"
                  title="Sear chicken in two batches"
                  body="Lay chicken pieces in a single layer. Don't move them for 60 seconds — let the bottom catch colour. Toss, cook 90 seconds more, then tip out onto a plate. Repeat with the second half."
                  tip="If you crowd the wok, the chicken steams instead of frying. Two batches takes one extra minute and is worth it."
                />
                <StepRow
                  n="4"
                  title="Aromatics, then bok choy"
                  body="Same wok, lower heat slightly. Garlic, ginger, spring onion whites — 30 seconds, just till fragrant. Add bok choy, splash of shaoxing wine, lid on for 90 seconds."
                />
                <StepRow
                  n="5"
                  title="Bring it all together"
                  body="Lid off. Chicken back in. Oyster sauce, remaining soy, a splash of water. Toss everything for a minute until the sauce coats. Off the heat, scatter the spring onion greens."
                />
              </section>

              <div style={{
                marginTop: 8, padding: '20px 0 0',
                borderTop: `1px solid ${TOKENS.borderSoft}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{
                  fontFamily: 'Fraunces, serif', fontStyle: 'italic',
                  fontSize: 14, color: TOKENS.inkFaint,
                }}>Saved Tuesday from your chat with Ah Mah</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button style={{
                    padding: '8px 14px',
                    fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600,
                    color: TOKENS.ink,
                    background: 'transparent', border: `1px solid ${TOKENS.border}`,
                    borderRadius: 8, cursor: 'pointer',
                  }}>Ask a follow-up</button>
                  <button style={{
                    padding: '8px 14px',
                    fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600,
                    color: '#fff',
                    background: TOKENS.primary,
                    border: `1px solid ${TOKENS.primaryInk}`,
                    borderRadius: 8, cursor: 'pointer',
                    boxShadow: `0 1px 0 ${TOKENS.primaryInk}`,
                  }}>Cook it now →</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.RecipePage = RecipePage;
