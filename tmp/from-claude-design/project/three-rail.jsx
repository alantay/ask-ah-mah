/* Three-rail layout exploration: how to fit Conversations + Chat + Pantry
   on one desktop page without crowding. Three options on one artboard. */

/* ── Mini building blocks (compact versions) ─────────────────────────── */

function MiniConvItem({ title, when, active, count }) {
  return (
    <div style={{
      ...paperBg(active ? TOKENS.chat : TOKENS.card),
      border: `1px solid ${active ? TOKENS.primary : TOKENS.border}`,
      borderLeft: active ? `3px solid ${TOKENS.primary}` : `1px solid ${TOKENS.border}`,
      borderRadius: 8,
      padding: '8px 10px',
      display: 'flex', flexDirection: 'column', gap: 2,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
        <span style={{
          fontFamily: 'Fraunces, serif', fontStyle: 'italic',
          fontSize: 13, color: TOKENS.ink, fontWeight: 500,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{title}</span>
        <span style={{
          fontFamily: 'ui-monospace, monospace', fontSize: 9.5,
          color: TOKENS.inkFaint, flexShrink: 0,
        }}>{when}</span>
      </div>
      <div style={{
        fontFamily: 'Inter, sans-serif', fontSize: 10,
        color: TOKENS.inkFaint,
      }}>{count} msg</div>
    </div>
  );
}

function MiniChat({ compact, title }) {
  return (
    <div style={{
      flex: 1, ...paperBg(TOKENS.chat),
      display: 'flex', flexDirection: 'column', minWidth: 0,
    }}>
      <div style={{
        padding: '10px 16px', borderBottom: `1px dashed ${TOKENS.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: 'Fraunces, serif', fontStyle: 'italic',
            fontSize: 14, color: TOKENS.ink, fontWeight: 500,
          }}>{title || "Tuesday's kitchen"}</div>
          <div style={{
            fontFamily: 'Inter, sans-serif', fontSize: 9.5,
            color: TOKENS.inkFaint, marginTop: 1,
          }}>3 messages · 4:12 pm</div>
        </div>
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: TOKENS.primary,
          boxShadow: `0 0 0 3px oklch(0.56 0.135 35 / 0.15)`,
        }}/>
      </div>
      <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: TOKENS.card, border: `1px solid ${TOKENS.border}`,
            overflow: 'hidden', flexShrink: 0,
          }}>
            <img src="granny-avatar.png" width="20" height="20" style={{ objectFit: 'contain' }} alt=""/>
          </div>
          <div style={{
            fontFamily: 'Fraunces, serif', fontStyle: 'italic',
            fontSize: 12, color: TOKENS.ink, lineHeight: 1.4,
          }}>Hello dear! Show Ah Mah what you have — we can do something nice.</div>
        </div>
        <div style={{
          alignSelf: 'flex-end',
          background: TOKENS.butter,
          border: `1px solid oklch(0.78 0.10 88)`,
          borderRadius: '10px 10px 3px 10px',
          padding: '6px 10px',
          fontSize: 11, fontFamily: 'Inter, sans-serif',
          color: TOKENS.ink, maxWidth: '75%',
        }}>I have chicken, bok choy, ginger and a wok.</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: TOKENS.card, border: `1px solid ${TOKENS.border}`,
            overflow: 'hidden', flexShrink: 0,
          }}>
            <img src="granny-avatar.png" width="20" height="20" style={{ objectFit: 'contain' }} alt=""/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'Fraunces, serif', fontStyle: 'italic',
              fontSize: 12, color: TOKENS.ink, lineHeight: 1.4, marginBottom: 6,
            }}>Stir-fry it. 20 minutes, one pan.</div>
            {!compact && (
              <div style={{
                ...paperBg(TOKENS.card),
                border: `1px solid ${TOKENS.border}`,
                borderRadius: 8, padding: '8px 10px',
                maxWidth: 220, fontSize: 11, position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', top: -1, right: 12,
                  width: 18, height: 8, background: TOKENS.primary,
                  borderRadius: '0 0 3px 3px',
                }}/>
                <div style={{
                  fontFamily: 'Inter, sans-serif', fontSize: 8.5, fontWeight: 700,
                  letterSpacing: '0.16em', textTransform: 'uppercase',
                  color: TOKENS.primary, marginBottom: 2,
                }}>Recipe</div>
                <div style={{
                  fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 13.5,
                  color: TOKENS.ink, lineHeight: 1.15,
                }}>Ginger Chicken &amp; Bok Choy</div>
                <div style={{
                  fontFamily: 'ui-monospace, monospace', fontSize: 9.5,
                  color: TOKENS.inkFaint, marginTop: 4, paddingTop: 4,
                  borderTop: `1px dashed ${TOKENS.border}`,
                }}>⏱ 20 min · serves 2</div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{
        padding: '10px 16px 14px',
        borderTop: `1px solid ${TOKENS.borderSoft}`,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: TOKENS.card,
          border: `1.5px solid ${TOKENS.border}`,
          borderRadius: 10, padding: '5px 5px 5px 11px',
          fontFamily: 'Inter, sans-serif', fontSize: 11,
          color: TOKENS.inkFaint,
        }}>
          <span style={{ flex: 1 }}>Ask Ah Mah a question…</span>
          <span style={{
            width: 22, height: 22, borderRadius: 6,
            background: TOKENS.primary,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 12 L21 4 L13 21 L11 13 Z"/>
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}

function MiniPantry({ collapsed, mode }) {
  if (collapsed) {
    /* Icon rail — 48px wide, items as colored dots */
    return (
      <div style={{
        flex: '0 0 48px',
        ...paperBg(TOKENS.tray),
        borderLeft: `1px solid ${TOKENS.border}`,
        padding: '14px 0', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 12,
      }}>
        <div style={{
          fontFamily: 'Inter, sans-serif', fontSize: 8.5, fontWeight: 700,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: TOKENS.inkFaint,
          writingMode: 'vertical-rl', transform: 'rotate(180deg)',
        }}>Pantry · 11</div>
        <div style={{ width: 24, height: 1, background: TOKENS.border }}/>
        {[
          { c: 'oklch(0.78 0.13 75)', l: 'C' },
          { c: 'oklch(0.55 0.13 168)', l: 'B' },
          { c: 'oklch(0.78 0.13 75)', l: 'G' },
          { c: 'oklch(0.55 0.13 168)', l: 'g' },
          { c: 'oklch(0.40 0.06 50)', l: 'S' },
          { c: 'oklch(0.40 0.06 50)', l: 'O' },
          { c: '#fff', l: 'R' },
          { c: 'oklch(0.92 0.10 90)', l: 'E' },
        ].map((it, i) => (
          <div key={i} style={{
            width: 24, height: 24, borderRadius: 6,
            background: it.c,
            border: `1px solid ${TOKENS.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'ui-monospace, monospace', fontSize: 10, fontWeight: 700,
            color: it.l === 'R' || it.l === 'E' ? TOKENS.ink : '#fff',
          }}>{it.l}</div>
        ))}
        <button style={{
          marginTop: 'auto', width: 26, height: 26, borderRadius: 6,
          background: TOKENS.card, border: `1px solid ${TOKENS.border}`,
          color: TOKENS.inkSoft, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
            <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    );
  }
  return (
    <div style={{
      flex: mode === 'narrow' ? '0 0 220px' : '0 0 280px',
      ...paperBg(TOKENS.tray),
      borderLeft: `1px solid ${TOKENS.border}`,
      padding: '14px 14px 16px',
      display: 'flex', flexDirection: 'column', gap: 10,
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <div style={{
          fontFamily: 'Fraunces, serif', fontStyle: 'italic',
          fontWeight: 500, fontSize: 16, color: TOKENS.ink,
        }}>Pantry</div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button title="Add to pantry" style={{
            height: 22, padding: '0 8px', borderRadius: 5,
            background: TOKENS.primary, border: `1px solid ${TOKENS.primaryInk}`,
            color: '#fff', cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', fontSize: 10.5, fontWeight: 700,
            letterSpacing: '0.04em',
            display: 'inline-flex', alignItems: 'center', gap: 4,
            boxShadow: `0 1px 0 ${TOKENS.primaryInk}`,
          }}>
            <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
              <path d="M8 2.5 V13.5 M2.5 8 H13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Add
          </button>
          <button style={{
            width: 22, height: 22, borderRadius: 5,
            background: 'transparent', border: `1px solid ${TOKENS.border}`,
            color: TOKENS.inkSoft, cursor: 'pointer', fontSize: 10,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>›</button>
        </div>
      </div>

      {/* Inline quick-add — pill input with type toggle (Ingredient / Equipment) */}
      <div style={{
        ...paperBg(TOKENS.card),
        border: `1.5px solid ${TOKENS.border}`,
        borderRadius: 8,
        padding: 6,
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <div style={{ display: 'flex', gap: 3 }}>
          {['Ingredient', 'Equipment'].map((t, i) => (
            <div key={t} style={{
              flex: 1, textAlign: 'center',
              padding: '3px 0',
              fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              color: i === 0 ? TOKENS.ink : TOKENS.inkFaint,
              background: i === 0 ? TOKENS.chat : 'transparent',
              border: `1px solid ${i === 0 ? TOKENS.border : 'transparent'}`,
              borderRadius: 5, cursor: 'pointer',
            }}>{t}</div>
          ))}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: TOKENS.chat,
          border: `1px solid ${TOKENS.border}`,
          borderRadius: 6, padding: '3px 4px 3px 8px',
        }}>
          <input placeholder="e.g. shaoxing wine" style={{
            flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: 'Inter, sans-serif', fontSize: 11.5, color: TOKENS.ink,
          }}/>
          <button style={{
            width: 22, height: 22, borderRadius: 4,
            background: TOKENS.primary, border: `1px solid ${TOKENS.primaryInk}`,
            color: '#fff', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
              <path d="M2 8h12M9 4l5 4-5 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div style={{
          fontFamily: 'Fraunces, serif', fontStyle: 'italic',
          fontSize: 10.5, color: TOKENS.inkFaint, lineHeight: 1.3,
          paddingLeft: 2,
        }}>or snap a photo of your pantry</div>
      </div>

      <div style={{
        ...paperBg(TOKENS.card),
        border: `1px solid ${TOKENS.border}`, borderRadius: 8,
        padding: '8px 10px',
      }}>
        <div style={{
          fontFamily: 'Inter, sans-serif', fontSize: 9, fontWeight: 700,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: TOKENS.inkFaint, marginBottom: 6,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>Ingredients</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <button title="Add ingredient" style={{
              width: 14, height: 14, borderRadius: 3,
              background: 'transparent', border: `1px solid ${TOKENS.border}`,
              color: TOKENS.inkSoft, cursor: 'pointer', padding: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="7" height="7" viewBox="0 0 16 16" fill="none">
                <path d="M8 2.5 V13.5 M2.5 8 H13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <span style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: 0 }}>11</span>
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {['chicken','bok choy','garlic','ginger','soy','sesame oil','rice','eggs','spring onion','shiitake','oyster sauce'].map(t => (
            <span key={t} style={{
              padding: '2px 6px', fontFamily: 'Inter, sans-serif',
              fontSize: 10, color: TOKENS.ink, background: TOKENS.card,
              border: `1px solid ${TOKENS.border}`, borderRadius: 4,
            }}>{t}</span>
          ))}
        </div>
      </div>

      <div style={{
        ...paperBg(TOKENS.card),
        border: `1px solid ${TOKENS.border}`, borderRadius: 8,
        padding: '8px 10px',
      }}>
        <div style={{
          fontFamily: 'Inter, sans-serif', fontSize: 9, fontWeight: 700,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: TOKENS.inkFaint, marginBottom: 6,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>Kitchenware</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <button title="Add equipment" style={{
              width: 14, height: 14, borderRadius: 3,
              background: 'transparent', border: `1px solid ${TOKENS.border}`,
              color: TOKENS.inkSoft, cursor: 'pointer', padding: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="7" height="7" viewBox="0 0 16 16" fill="none">
                <path d="M8 2.5 V13.5 M2.5 8 H13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <span style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: 0 }}>4</span>
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {['wok','rice cooker','cleaver','steamer'].map(t => (
            <span key={t} style={{
              padding: '2px 6px', fontFamily: 'Inter, sans-serif',
              fontSize: 10, color: TOKENS.ink, background: TOKENS.card,
              border: `1px solid ${TOKENS.border}`, borderRadius: 4,
            }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniConvRail({ collapsed }) {
  if (collapsed) {
    return (
      <div style={{
        flex: '0 0 56px',
        ...paperBg(TOKENS.tray),
        borderRight: `1px solid ${TOKENS.border}`,
        padding: '14px 0', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 10,
      }}>
        <button style={{
          width: 32, height: 32, borderRadius: 8,
          background: TOKENS.primary, color: '#fff',
          border: `1px solid ${TOKENS.primaryInk}`, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 1px 0 ${TOKENS.primaryInk}`,
        }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5 V14.5 M1.5 8 H14.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
          </svg>
        </button>
        <div style={{ width: 24, height: 1, background: TOKENS.border, margin: '4px 0' }}/>
        {[1,2,3,4,5,6,7].map(i => (
          <div key={i} style={{
            width: 32, height: 32, borderRadius: 8,
            background: i === 1 ? TOKENS.chat : TOKENS.card,
            border: `1px solid ${i === 1 ? TOKENS.primary : TOKENS.border}`,
            borderLeft: i === 1 ? `3px solid ${TOKENS.primary}` : `1px solid ${TOKENS.border}`,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Fraunces, serif', fontStyle: 'italic',
            fontWeight: 600, fontSize: 12, color: TOKENS.inkSoft,
          }}>{['T','L','S','R','C','B','P'][i-1]}</div>
        ))}
      </div>
    );
  }
  return (
    <aside style={{
      flex: '0 0 240px',
      ...paperBg(TOKENS.tray),
      borderRight: `1px solid ${TOKENS.border}`,
      padding: '14px 12px',
      display: 'flex', flexDirection: 'column', gap: 10,
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          fontFamily: 'Fraunces, serif', fontStyle: 'italic',
          fontWeight: 500, fontSize: 16, color: TOKENS.ink,
        }}>Conversations</div>
        <button style={{
          width: 24, height: 24, borderRadius: 6,
          background: TOKENS.primary, color: '#fff',
          border: `1px solid ${TOKENS.primaryInk}`, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5 V14.5 M1.5 8 H14.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      <Eyebrow style={{ fontSize: 9 }}>Today</Eyebrow>
      <MiniConvItem title="Tuesday's kitchen" when="4:12pm" count="3" active />
      <MiniConvItem title="Lunchbox ideas" when="12:40" count="8" />
      <Eyebrow style={{ fontSize: 9, marginTop: 2 }}>Yesterday</Eyebrow>
      <MiniConvItem title="Sunday roast" when="Mon" count="14" />
      <MiniConvItem title="Leftover rice" when="Mon" count="5" />
      <Eyebrow style={{ fontSize: 9, marginTop: 2 }}>Earlier</Eyebrow>
      <MiniConvItem title="Spicy without burning" when="Apr 27" count="11" />
    </aside>
  );
}

/* ── A scaled "phone" desktop frame — three columns ──────────────────── */

function ThreeColFrame({ children, label, recommended }) {
  return (
    <div style={{
      width: 760, display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <div style={{
          fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 18,
          color: TOKENS.ink, letterSpacing: '-0.01em',
        }}>{label}</div>
        {recommended && (
          <span style={{
            padding: '2px 8px',
            fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: '#fff', background: TOKENS.jade,
            borderRadius: 999,
          }}>Recommended</span>
        )}
      </div>
      <div style={{
        height: 460,
        ...paperBg(TOKENS.bg),
        borderRadius: 12,
        border: `1px solid ${TOKENS.border}`,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: `0 20px 40px -28px oklch(0.3 0.05 50 / 0.4)`,
      }}>
        {/* tiny header strip */}
        <div style={{
          padding: '8px 14px',
          borderBottom: `1px solid ${TOKENS.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Logo size={13} mark="simple" />
          <div style={{ display: 'flex', gap: 3 }}>
            {['Chat','Cookbook'].map((t, i) => (
              <div key={t} style={{
                padding: '4px 9px',
                fontFamily: 'Inter, sans-serif', fontSize: 10.5,
                fontWeight: i === 0 ? 700 : 500,
                color: i === 0 ? TOKENS.ink : TOKENS.inkFaint,
                background: i === 0 ? TOKENS.chat : 'transparent',
                border: `1px solid ${i === 0 ? TOKENS.border : 'transparent'}`,
                borderBottom: i === 0 ? `1px solid ${TOKENS.chat}` : 'none',
                borderRadius: '5px 5px 0 0', marginBottom: -1,
              }}>{t}</div>
            ))}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Annotation block ────────────────────────────────────────────────── */

function Pros({ items, kind }) {
  const color = kind === 'pro' ? TOKENS.jade : 'oklch(0.55 0.18 25)';
  const bg = kind === 'pro' ? 'oklch(0.96 0.04 168)' : 'oklch(0.96 0.04 25)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {items.map((t, i) => (
        <div key={i} style={{
          display: 'flex', gap: 6, alignItems: 'flex-start',
          fontFamily: 'Fraunces, serif', fontStyle: 'italic',
          fontSize: 12, color: TOKENS.ink, lineHeight: 1.4,
        }}>
          <span style={{
            flexShrink: 0, marginTop: 1,
            width: 14, height: 14, borderRadius: 4,
            background: bg, color: color,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Inter, sans-serif', fontStyle: 'normal',
            fontWeight: 700, fontSize: 9,
          }}>{kind === 'pro' ? '+' : '−'}</span>
          {t}
        </div>
      ))}
    </div>
  );
}

function OptionMeta({ pros, cons, when }) {
  return (
    <div style={{
      ...paperBg(TOKENS.card),
      border: `1px solid ${TOKENS.border}`,
      borderRadius: 10,
      padding: '12px 14px',
      display: 'flex', flexDirection: 'column', gap: 10,
      width: 760,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Pros items={pros} kind="pro" />
        <Pros items={cons} kind="con" />
      </div>
      <div style={{
        paddingTop: 10, borderTop: `1px dashed ${TOKENS.border}`,
        fontFamily: 'Inter, sans-serif', fontSize: 11.5,
        color: TOKENS.inkSoft, lineHeight: 1.5,
      }}>
        <span style={{
          fontFamily: 'Inter, sans-serif', fontSize: 9.5, fontWeight: 700,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: TOKENS.inkFaint, marginRight: 8,
        }}>When to use</span>
        {when}
      </div>
    </div>
  );
}

/* ── The page ─────────────────────────────────────────────────────────── */

function ThreeRailExploration() {
  return (
    <div style={{
      width: 1640, padding: '32px 36px',
      ...paperBg(TOKENS.bg),
      border: `1px solid ${TOKENS.border}`,
      borderRadius: 14,
      display: 'flex', flexDirection: 'column', gap: 28,
    }}>
      <div>
        <Eyebrow>Layout problem</Eyebrow>
        <h1 style={{
          fontFamily: 'Fraunces, serif', fontWeight: 600,
          fontSize: 38, color: TOKENS.ink, letterSpacing: '-0.02em',
          margin: '6px 0 8px', lineHeight: 1.05,
        }}>How do Conversations + Pantry both fit?</h1>
        <p style={{
          fontFamily: 'Fraunces, serif', fontStyle: 'italic',
          fontSize: 16, color: TOKENS.inkSoft, margin: 0,
          lineHeight: 1.5, maxWidth: 780,
        }}>
          The chat needs to reach a session history (left) AND a live pantry (right). Three ways
          to lay that out — same content, different defaults. Each has a “when to use.”
        </p>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 36,
      }}>
        {/* OPTION A: PANTRY-AS-DRAWER (recommended) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ThreeColFrame label="A · Conversations rail · Pantry drawer" recommended>
            <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
              <MiniConvRail />
              <MiniChat />
              {/* drawer peeking in */}
              <div style={{
                flex: '0 0 36px',
                ...paperBg(TOKENS.tray),
                borderLeft: `1px solid ${TOKENS.border}`,
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                paddingTop: 14,
                position: 'relative',
              }}>
                <div style={{
                  fontFamily: 'Inter, sans-serif', fontSize: 9.5, fontWeight: 700,
                  letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: TOKENS.inkFaint,
                  writingMode: 'vertical-rl', transform: 'rotate(180deg)',
                }}>Pantry · 11 ›</div>
                <div style={{
                  position: 'absolute', top: 8, right: 8, width: 18, height: 18,
                  borderRadius: 4, background: TOKENS.primary, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700,
                }}>‹</div>
              </div>
            </div>
          </ThreeColFrame>
          <OptionMeta
            pros={[
              'Conversations always visible — the new model is reinforced every session.',
              'Pantry one click away, slides in over the chat as a 320px overlay.',
              "Pantry edits don't compete with chat for attention.",
            ]}
            cons={[
              'Pantry not glanceable — need to remember to open it.',
              'Adds one click to the "what do I have?" mental model.',
            ]}
            when="Default. Most sessions are about chatting; pantry is reference, not constant interaction."
          />
        </div>

        {/* OPTION B: TRIPLE COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ThreeColFrame label="B · Three rails, all on">
            <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
              <MiniConvRail />
              <MiniChat compact />
              <MiniPantry mode="narrow" />
            </div>
          </ThreeColFrame>
          <OptionMeta
            pros={[
              'Everything visible at once — no clicks to switch context.',
              'Pantry chips stay in peripheral vision while chatting.',
            ]}
            cons={[
              'Chat column shrinks to ~340px — recipe cards get cramped.',
              'Below 1280px, layout breaks. Users on 13" laptops suffer.',
              'Three zones competing for attention is loud.',
            ]}
            when="Power users on 27&quot;+ monitors, or as an opt-in 'expand both rails' mode."
          />
        </div>

        {/* OPTION C: COLLAPSING CONVERSATIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ThreeColFrame label="C · Conversations collapse · Pantry stays">
            <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
              <MiniConvRail collapsed />
              <MiniChat />
              <MiniPantry />
            </div>
          </ThreeColFrame>
          <OptionMeta
            pros={[
              'Pantry stays glanceable (its highest-value position).',
              'Conversation rail still discoverable as 56px icon strip.',
              'Active conversation marker stays visible.',
            ]}
            cons={[
              "New conversation model isn't reinforced — sidebar is too small to read titles.",
              'Returning user might not realize the rail expands.',
            ]}
            when="If user testing shows pantry-glance is a primary value driver."
          />
        </div>

        {/* OPTION D: TABBED RAIL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ThreeColFrame label="D · One left rail · tabbed (chats / pantry)">
            <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
              <aside style={{
                flex: '0 0 240px',
                ...paperBg(TOKENS.tray),
                borderRight: `1px solid ${TOKENS.border}`,
                padding: '12px 12px',
                display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <div style={{
                  display: 'flex', gap: 0, padding: 2,
                  background: TOKENS.card, border: `1px solid ${TOKENS.border}`,
                  borderRadius: 8,
                }}>
                  {['Chats', 'Pantry'].map((t, i) => (
                    <div key={t} style={{
                      flex: 1, padding: '5px 0', textAlign: 'center',
                      fontFamily: 'Inter, sans-serif', fontSize: 10.5,
                      fontWeight: i === 0 ? 700 : 500,
                      color: i === 0 ? '#fff' : TOKENS.inkSoft,
                      background: i === 0 ? TOKENS.ink : 'transparent',
                      borderRadius: 6,
                    }}>{t}</div>
                  ))}
                </div>
                <Eyebrow style={{ fontSize: 9 }}>Today</Eyebrow>
                <MiniConvItem title="Tuesday's kitchen" when="4:12" count="3" active />
                <MiniConvItem title="Lunchbox ideas" when="12:40" count="8" />
                <Eyebrow style={{ fontSize: 9 }}>Yesterday</Eyebrow>
                <MiniConvItem title="Sunday roast" when="Mon" count="14" />
              </aside>
              <MiniChat />
            </div>
          </ThreeColFrame>
          <OptionMeta
            pros={[
              'Maximum chat width (~580px) — recipe cards breathe.',
              'Single rail = simpler mental model.',
              'Mobile pattern works as-is on desktop.',
            ]}
            cons={[
              "Pantry hidden behind a tab — users forget what's in it.",
              "Awkward when an Ah Mah recipe references a pantry item — can't see both at once.",
              'Lost the spatial metaphor (cookbook on right shelf, chat in middle).',
            ]}
            when="Smaller laptops or when chat fidelity is paramount over pantry awareness."
          />
        </div>
      </div>

      {/* Recommendation */}
      <div style={{
        ...paperBg(TOKENS.tray),
        border: `1px solid ${TOKENS.border}`,
        borderRadius: 12,
        padding: '20px 24px',
        display: 'flex', gap: 18, alignItems: 'flex-start',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: TOKENS.primary, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 22,
          flexShrink: 0,
        }}>A</div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 22,
            color: TOKENS.ink, letterSpacing: '-0.01em', marginBottom: 6,
          }}>Recommendation: Option A — pantry as a drawer</div>
          <div style={{
            fontFamily: 'Fraunces, serif', fontStyle: 'italic',
            fontSize: 14.5, color: TOKENS.inkSoft, lineHeight: 1.55,
          }}>
            Conversations earn the permanent rail because the new model needs reinforcement
            (users have to learn that sessions are saved). Pantry earns a drawer because it's
            high-value but low-frequency interaction — you check it before asking and add to it
            after, but you don't stare at it. The drawer's collapsed state is a 36px paper-tab
            on the right edge with a vertical "Pantry · 11 ›" label, so it stays discoverable
            without crowding. Tapping it slides in a 320px panel over the chat.
          </div>
        </div>
      </div>
    </div>
  );
}

window.ThreeRailExploration = ThreeRailExploration;
