/* Chat surface — message bubbles, scroll area, composer */

function AhMahMessage({ children, time }) {
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
          marginBottom: 4,
        }}>
          <span>Ah Mah</span>
          {time && <span style={{ fontWeight: 400, color: TOKENS.inkFaint, letterSpacing: '0.02em', textTransform: 'none' }}>· {time}</span>}
        </div>
        <div style={{
          fontFamily: 'Fraunces, serif',
          fontStyle: 'italic',
          fontSize: 17,
          lineHeight: 1.55,
          color: TOKENS.ink,
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function UserMessage({ children, time }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'flex-end', maxWidth: 560, marginLeft: 'auto',
    }}>
      <div style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 14.5,
        lineHeight: 1.5,
        color: TOKENS.ink,
        background: TOKENS.butter,
        border: `1px solid oklch(0.78 0.10 88)`,
        borderRadius: '14px 14px 4px 14px',
        padding: '10px 14px',
        boxShadow: `0 1px 0 oklch(0.78 0.10 88), 0 4px 10px -8px oklch(0.4 0.1 80 / 0.3)`,
      }}>
        {children}
        {time && (
          <div style={{
            fontSize: 10, color: TOKENS.inkFaint, marginTop: 2, textAlign: 'right',
            letterSpacing: '0.04em',
          }}>{time}</div>
        )}
      </div>
    </div>
  );
}

function RecipeCard({ title, summary, time, servings, saved }) {
  return (
    <div style={{
      ...paperBg(TOKENS.card),
      border: `1px solid ${TOKENS.border}`,
      borderRadius: 12,
      padding: '14px 16px 14px',
      maxWidth: 380,
      marginTop: 8,
      position: 'relative',
      boxShadow: `0 1px 0 ${TOKENS.borderSoft}, 0 14px 24px -22px oklch(0.3 0.05 50 / 0.5)`,
    }}>
      {/* corner tab */}
      <div style={{
        position: 'absolute', top: -1, right: 18,
        width: 28, height: 14,
        background: TOKENS.primary,
        borderRadius: '0 0 4px 4px',
        boxShadow: 'inset 0 -1px 0 oklch(0.45 0.12 32)',
      }}/>
      <div style={{
        fontFamily: 'Inter, sans-serif', fontSize: 10.5, fontWeight: 700,
        letterSpacing: '0.16em', textTransform: 'uppercase',
        color: TOKENS.primary, marginBottom: 4,
      }}>Recipe</div>
      <div style={{
        fontFamily: 'Fraunces, serif',
        fontWeight: 600,
        fontSize: 22,
        color: TOKENS.ink, lineHeight: 1.15,
        letterSpacing: '-0.01em',
        marginBottom: 6,
      }}>{title}</div>
      <div style={{
        fontFamily: 'Inter, sans-serif', fontSize: 13, color: TOKENS.inkSoft,
        lineHeight: 1.45, marginBottom: 12,
      }}>{summary}</div>
      <div style={{
        display: 'flex', gap: 14, alignItems: 'center',
        paddingTop: 10, borderTop: `1px dashed ${TOKENS.border}`,
        fontFamily: 'ui-monospace, monospace', fontSize: 11.5,
        color: TOKENS.inkSoft,
      }}>
        <span>⏱ {time}</span>
        <span>· serves {servings}</span>
        <button style={{
          marginLeft: 'auto',
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '5px 10px',
          fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
          color: saved ? TOKENS.jade : TOKENS.ink,
          background: 'transparent',
          border: `1px solid ${saved ? TOKENS.jade : TOKENS.border}`,
          borderRadius: 6,
          cursor: 'pointer',
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3-7 3z"/>
          </svg>
          {saved ? 'Saved' : 'Save to cookbook'}
        </button>
      </div>
    </div>
  );
}

function Composer() {
  return (
    <div style={{
      padding: '12px 20px 20px',
      borderTop: `1px solid ${TOKENS.borderSoft}`,
      ...paperBg(TOKENS.chat),
    }}>
      {/* suggestion chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        {['What can I cook tonight?', 'I have eggs and rice', 'Something for one'].map(s => (
          <button key={s} style={{
            padding: '5px 11px',
            fontFamily: 'Inter, sans-serif', fontSize: 12.5,
            color: TOKENS.inkSoft,
            background: 'transparent',
            border: `1px solid ${TOKENS.border}`,
            borderRadius: 999,
            cursor: 'pointer',
          }}>{s}</button>
        ))}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: TOKENS.card,
        border: `1.5px solid ${TOKENS.border}`,
        borderRadius: 14,
        padding: '8px 8px 8px 16px',
        boxShadow: `inset 0 1px 0 oklch(1 0 0 / 0.4), 0 1px 0 ${TOKENS.borderSoft}`,
      }}>
        <input placeholder="Ask Ah Mah a question…" style={{
          flex: 1, border: 'none', outline: 'none',
          background: 'transparent',
          fontFamily: 'Inter, sans-serif', fontSize: 14.5,
          color: TOKENS.ink,
        }}/>
        <SendButton />
      </div>
    </div>
  );
}

window.AhMahMessage = AhMahMessage;
window.UserMessage = UserMessage;
window.RecipeCard = RecipeCard;
window.Composer = Composer;
