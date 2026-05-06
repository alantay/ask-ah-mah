/* Loading UX — Ah Mah is generating the recipe.
   Four minimal variations, all on-brand (paper, ink, warm).
   Variations:
     A · "Thinking" — typing-style indicator inside the chat thread.
     B · "Writing it out" — recipe card scaffolds in, Ah Mah's pen drawing.
     C · "Looking through her drawer" — status lines stream as she thinks.
     D · "Pen on paper" — single line of handwritten ink animating in.
*/

/* ──────────────────────────────────────────────────────────────
   Shared keyframes — injected once
   ────────────────────────────────────────────────────────────── */
if (typeof document !== 'undefined' && !document.getElementById('__loading-kf')) {
  const st = document.createElement('style');
  st.id = '__loading-kf';
  st.textContent = `
    @keyframes ahmah-dot {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
      40%           { transform: translateY(-3px); opacity: 1; }
    }
    @keyframes ahmah-shimmer {
      0%   { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes ahmah-pen {
      0%   { transform: translateX(0) rotate(-8deg); }
      50%  { transform: translateX(2px) rotate(-6deg); }
      100% { transform: translateX(0) rotate(-8deg); }
    }
    @keyframes ahmah-fade-up {
      0%   { opacity: 0; transform: translateY(4px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes ahmah-line-draw {
      0%   { stroke-dashoffset: 1000; }
      100% { stroke-dashoffset: 0; }
    }
    @keyframes ahmah-status-cycle {
      0%, 24%   { opacity: 0; transform: translateY(4px); }
      8%, 22%   { opacity: 1; transform: translateY(0); }
      28%       { opacity: 0; transform: translateY(-4px); }
    }
    @keyframes ahmah-pulse-soft {
      0%, 100% { opacity: 0.55; }
      50%      { opacity: 1; }
    }
  `;
  document.head.appendChild(st);
}

/* ──────────────────────────────────────────────────────────────
   A · Typing indicator — minimal, lives inline in the chat
   ────────────────────────────────────────────────────────────── */
function TypingIndicator() {
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
          textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 6,
        }}>
          <span>Ah Mah</span>
          <span style={{
            fontWeight: 400, color: TOKENS.inkFaint,
            letterSpacing: '0.02em', textTransform: 'none',
            fontStyle: 'italic',
            animation: 'ahmah-pulse-soft 1.6s ease-in-out infinite',
          }}>· thinking of something nice…</span>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '12px 16px',
          background: TOKENS.card,
          border: `1px solid ${TOKENS.border}`,
          borderRadius: '14px 14px 14px 4px',
          boxShadow: `0 1px 0 ${TOKENS.borderSoft}`,
        }}>
          {[0, 1, 2].map(i => (
            <span key={i} style={{
              width: 7, height: 7, borderRadius: 999,
              background: TOKENS.primary,
              display: 'inline-block',
              animation: `ahmah-dot 1.4s ease-in-out ${i * 0.16}s infinite`,
            }}/>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   B · Skeleton recipe card — the card scaffolds in as she writes
   ────────────────────────────────────────────────────────────── */
function ShimmerLine({ width = '100%', height = 12, delay = 0 }) {
  return (
    <div style={{
      width, height, borderRadius: 4,
      background: `linear-gradient(90deg,
        oklch(0.92 0.025 75) 0%,
        oklch(0.97 0.020 80) 50%,
        oklch(0.92 0.025 75) 100%)`,
      backgroundSize: '200% 100%',
      animation: `ahmah-shimmer 1.8s ease-in-out ${delay}s infinite`,
    }}/>
  );
}

function SkeletonRecipeCard() {
  return (
    <div style={{
      ...paperBg(TOKENS.card),
      border: `1px solid ${TOKENS.border}`,
      borderRadius: 12,
      padding: '18px 20px 18px',
      maxWidth: 540,
      marginTop: 10,
      position: 'relative',
      boxShadow: `0 1px 0 ${TOKENS.borderSoft}, 0 14px 24px -22px oklch(0.3 0.05 50 / 0.5)`,
    }}>
      {/* corner tab */}
      <div style={{
        position: 'absolute', top: -1, right: 22,
        width: 28, height: 14,
        background: TOKENS.primary,
        borderRadius: '0 0 4px 4px',
        boxShadow: 'inset 0 -1px 0 oklch(0.45 0.12 32)',
      }}/>

      {/* eyebrow + animated pen */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 12,
      }}>
        <div style={{
          fontFamily: 'Inter, sans-serif', fontSize: 10.5, fontWeight: 700,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: TOKENS.primary,
        }}>Ah Mah is writing it out</div>
        {/* tiny pen glyph */}
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none"
          style={{
            transformOrigin: '14px 14px',
            animation: 'ahmah-pen 1.2s ease-in-out infinite',
          }}>
          <path d="M1.5 14.5 L4 12 L12 4 L14 6 L6 14 L3.5 14.5 Z"
            fill={TOKENS.butter}
            stroke={TOKENS.ink} strokeWidth="1" strokeLinejoin="round"/>
          <path d="M11 5 L13 7" stroke={TOKENS.primaryInk} strokeWidth="1"/>
        </svg>
      </div>

      {/* title skeleton */}
      <ShimmerLine width="78%" height={22} />
      <div style={{ height: 8 }}/>
      <ShimmerLine width="58%" height={14} delay={0.1} />

      {/* meta strip */}
      <div style={{
        display: 'flex', gap: 10, marginTop: 16, marginBottom: 16,
        padding: '10px 12px',
        background: TOKENS.chat,
        border: `1px solid ${TOKENS.borderSoft}`,
        borderRadius: 8,
      }}>
        <ShimmerLine width={60} height={10} delay={0.15} />
        <ShimmerLine width={60} height={10} delay={0.20} />
        <ShimmerLine width={60} height={10} delay={0.25} />
      </div>

      {/* ingredient lines — two columns */}
      <div style={{
        fontFamily: 'Inter, sans-serif', fontSize: 10.5, fontWeight: 700,
        letterSpacing: '0.16em', textTransform: 'uppercase',
        color: TOKENS.inkSoft, marginBottom: 10,
      }}>Ingredients</div>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '10px 24px', marginBottom: 18,
      }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShimmerLine width={48} height={11} delay={i * 0.05} />
            <ShimmerLine width={`${60 + (i % 3) * 12}%`} height={11} delay={i * 0.05 + 0.05} />
          </div>
        ))}
      </div>

      {/* method lines */}
      <div style={{
        fontFamily: 'Inter, sans-serif', fontSize: 10.5, fontWeight: 700,
        letterSpacing: '0.16em', textTransform: 'uppercase',
        color: TOKENS.inkSoft, marginBottom: 10,
      }}>Method</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              flexShrink: 0, width: 26, height: 26,
              background: 'oklch(0.92 0.025 75)',
              borderRadius: '50% 50% 50% 6px',
              animation: `ahmah-shimmer 1.8s ease-in-out ${i * 0.1}s infinite`,
              backgroundImage: `linear-gradient(90deg,
                oklch(0.92 0.025 75) 0%,
                oklch(0.97 0.020 80) 50%,
                oklch(0.92 0.025 75) 100%)`,
              backgroundSize: '200% 100%',
            }}/>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <ShimmerLine width="90%" height={11} delay={i * 0.1} />
              <ShimmerLine width="70%" height={11} delay={i * 0.1 + 0.05} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WritingItOut() {
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-start',
      maxWidth: 600,
    }}>
      <GrannyAvatar size={36} />
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600,
          color: TOKENS.inkSoft, letterSpacing: '0.06em',
          textTransform: 'uppercase', marginBottom: 4,
        }}>Ah Mah · just a moment</div>
        <div style={{
          fontFamily: 'Fraunces, serif', fontStyle: 'italic',
          fontSize: 16, color: TOKENS.ink, lineHeight: 1.5,
          marginBottom: 4,
        }}>
          Let me write the whole thing out for you —
        </div>
        <SkeletonRecipeCard />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   C · Status stream — what Ah Mah is doing right now
   ────────────────────────────────────────────────────────────── */
const STATUS_LINES = [
  'looking at what you have…',
  'thinking of something quick…',
  'checking the pantry…',
  'writing the steps…',
];

function StatusStream() {
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % STATUS_LINES.length), 1600);
    return () => clearInterval(t);
  }, []);
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
          textTransform: 'uppercase', marginBottom: 6,
        }}>Ah Mah</div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px',
          background: TOKENS.card,
          border: `1px solid ${TOKENS.border}`,
          borderRadius: '14px 14px 14px 4px',
          boxShadow: `0 1px 0 ${TOKENS.borderSoft}`,
          minWidth: 280,
        }}>
          {/* spinning ring — but as a tiny pot */}
          <div style={{
            position: 'relative', width: 22, height: 22, flexShrink: 0,
          }}>
            <svg width="22" height="22" viewBox="0 0 22 22"
              style={{ animation: 'ahmah-pulse-soft 1.6s ease-in-out infinite' }}>
              <circle cx="11" cy="11" r="8" fill="none"
                stroke={TOKENS.borderSoft} strokeWidth="2"/>
              <circle cx="11" cy="11" r="8" fill="none"
                stroke={TOKENS.primary} strokeWidth="2"
                strokeDasharray="14 36" strokeLinecap="round"
                style={{
                  transformOrigin: '11px 11px',
                  animation: 'spin 1.2s linear infinite',
                }}/>
            </svg>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>

          <div style={{ flex: 1, position: 'relative', minHeight: 22 }}>
            {STATUS_LINES.map((line, i) => (
              <div key={i} style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center',
                fontFamily: 'Fraunces, serif', fontStyle: 'italic',
                fontSize: 15, color: TOKENS.ink,
                opacity: i === idx ? 1 : 0,
                transform: i === idx ? 'translateY(0)' : 'translateY(4px)',
                transition: 'opacity 0.4s ease, transform 0.4s ease',
              }}>{line}</div>
            ))}
          </div>
        </div>

        {/* progress dots, one per phase */}
        <div style={{
          display: 'flex', gap: 6, marginTop: 10, marginLeft: 4,
        }}>
          {STATUS_LINES.map((_, i) => (
            <div key={i} style={{
              width: 22, height: 3, borderRadius: 2,
              background: i <= idx ? TOKENS.primary : TOKENS.borderSoft,
              transition: 'background 0.4s ease',
            }}/>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   D · Pen-on-paper — single handwritten line drawing in
   ────────────────────────────────────────────────────────────── */
function PenOnPaper() {
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
          textTransform: 'uppercase', marginBottom: 6,
        }}>Ah Mah</div>

        <div style={{
          padding: '14px 18px',
          background: TOKENS.chat,
          border: `1px dashed ${TOKENS.border}`,
          borderRadius: 10,
          position: 'relative',
          minHeight: 56,
          display: 'flex', alignItems: 'center',
          overflow: 'hidden',
        }}>
          {/* drawn ink line */}
          <svg width="100%" height="32" viewBox="0 0 360 32"
            style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)' }}>
            <path
              d="M2 22 C 18 8, 30 8, 46 18 S 78 30, 96 18 S 132 6, 152 16 S 196 28, 218 18 S 256 6, 280 18 S 316 28, 342 16"
              fill="none"
              stroke={TOKENS.ink}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeDasharray="900"
              style={{ animation: 'ahmah-line-draw 2.6s ease-in-out infinite' }}
            />
          </svg>
          {/* nib */}
          <svg width="14" height="14" viewBox="0 0 16 16"
            style={{
              position: 'absolute', right: 16, top: '50%',
              transform: 'translateY(-50%) rotate(-8deg)',
              animation: 'ahmah-pen 1.2s ease-in-out infinite',
            }}>
            <path d="M1.5 14.5 L4 12 L12 4 L14 6 L6 14 L3.5 14.5 Z"
              fill={TOKENS.butter}
              stroke={TOKENS.ink} strokeWidth="1" strokeLinejoin="round"/>
          </svg>
        </div>

        <div style={{
          fontFamily: 'Fraunces, serif', fontStyle: 'italic',
          fontSize: 13.5, color: TOKENS.inkFaint, lineHeight: 1.45,
          marginTop: 8, paddingLeft: 2,
          animation: 'ahmah-pulse-soft 2s ease-in-out infinite',
        }}>
          Writing the recipe…
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Frame — drops a chosen variation into the chat layout
   ────────────────────────────────────────────────────────────── */
function LoadingFrame({ variant, label }) {
  let body;
  if (variant === 'typing')   body = <TypingIndicator />;
  if (variant === 'writing')  body = <WritingItOut />;
  if (variant === 'status')   body = <StatusStream />;
  if (variant === 'pen')      body = <PenOnPaper />;

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
              }}>2 messages · started 4:12 pm</div>
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
            <AhMahMessage time="4:12 pm">
              Hello dear! Show Ah Mah what you have in the kitchen, then I can suggest something nice.
            </AhMahMessage>
            <UserMessage time="4:13 pm">
              I have chicken, bok choy, ginger and a wok. Quick dinner for 2.
            </UserMessage>
            {body}
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

/* ──────────────────────────────────────────────────────────────
   Compact comparison — all four states stacked, no chrome.
   Useful for picking a direction at a glance.
   ────────────────────────────────────────────────────────────── */
function LoadingComparison() {
  const items = [
    { id: 'typing',  label: 'A · Typing',          desc: 'Tiniest signal. Three dots in a chat bubble. Use when latency is short (<2s).', body: <TypingIndicator /> },
    { id: 'writing', label: 'B · Writing it out',  desc: 'Recipe card scaffolds in. Use when the reply is long-form and we want users to anticipate the shape.', body: <WritingItOut /> },
    { id: 'status',  label: 'C · Status stream',   desc: 'Tells the user WHAT is happening. Best when latency is >5s and we want to reassure.', body: <StatusStream /> },
    { id: 'pen',     label: 'D · Pen on paper',    desc: 'Decorative — a moving ink line. Use sparingly; the most "Ah Mah" of the four.', body: <PenOnPaper /> },
  ];
  return (
    <div style={{
      ...paperBg(TOKENS.chat),
      padding: '32px 36px',
      width: 760, minHeight: 1180,
      display: 'flex', flexDirection: 'column', gap: 28,
    }}>
      <div>
        <div style={{
          fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: TOKENS.inkSoft, marginBottom: 6,
        }}>Loading UX</div>
        <div style={{
          fontFamily: 'Fraunces, serif', fontWeight: 600,
          fontSize: 28, color: TOKENS.ink, lineHeight: 1.1,
          letterSpacing: '-0.015em', marginBottom: 8,
        }}>While Ah Mah is generating the recipe</div>
        <div style={{
          fontFamily: 'Fraunces, serif', fontStyle: 'italic',
          fontSize: 14.5, color: TOKENS.inkSoft, lineHeight: 1.5,
          maxWidth: 560,
        }}>
          Four minimal states. Each lives where the next message would appear,
          so the user's eye doesn't have to travel. Pick one as default; keep
          B around for long-form replies.
        </div>
      </div>

      {items.map(it => (
        <div key={it.id} style={{
          display: 'grid',
          gridTemplateColumns: '180px 1fr',
          gap: 28,
          paddingTop: 24,
          borderTop: `1px solid ${TOKENS.borderSoft}`,
        }}>
          <div>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 10.5, fontWeight: 700,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: TOKENS.primary, marginBottom: 6,
            }}>{it.label}</div>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 12,
              color: TOKENS.inkSoft, lineHeight: 1.5,
            }}>{it.desc}</div>
          </div>
          <div>{it.body}</div>
        </div>
      ))}
    </div>
  );
}

window.LoadingFrame = LoadingFrame;
window.LoadingComparison = LoadingComparison;
window.TypingIndicator = TypingIndicator;
window.WritingItOut = WritingItOut;
window.StatusStream = StatusStream;
window.PenOnPaper = PenOnPaper;
