/* Conversations drawer — explains the "Tuesday's kitchen" header
   by showing the full sidebar list of past cooking sessions. */

function ConversationItem({ title, snippet, when, count, active, recipes, tags }) {
  return (
    <div style={{
      ...paperBg(active ? TOKENS.chat : TOKENS.card),
      border: `1px solid ${active ? TOKENS.primary : TOKENS.border}`,
      borderLeft: active ? `3px solid ${TOKENS.primary}` : `1px solid ${TOKENS.border}`,
      borderRadius: 10,
      padding: '12px 14px',
      display: 'flex', flexDirection: 'column', gap: 6,
      boxShadow: active
        ? `0 1px 0 ${TOKENS.borderSoft}, 0 8px 18px -16px oklch(0.3 0.05 50 / 0.5)`
        : `0 1px 0 ${TOKENS.borderSoft}`,
      cursor: 'pointer', position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
        <div style={{
          fontFamily: 'Fraunces, serif', fontStyle: 'italic',
          fontWeight: 500, fontSize: 16,
          color: TOKENS.ink, letterSpacing: '-0.01em', lineHeight: 1.15,
        }}>{title}</div>
        <div style={{
          fontFamily: 'ui-monospace, monospace', fontSize: 10.5,
          color: TOKENS.inkFaint, fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        }}>{when}</div>
      </div>
      <div style={{
        fontFamily: 'Inter, sans-serif', fontSize: 12.5,
        color: TOKENS.inkSoft, lineHeight: 1.4,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>{snippet}</div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginTop: 2,
        fontFamily: 'Inter, sans-serif', fontSize: 11,
        color: TOKENS.inkFaint,
      }}>
        <span>{count} msg</span>
        {recipes > 0 && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            color: TOKENS.jade, fontWeight: 600,
          }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3-7 3z"/>
            </svg>
            {recipes} saved
          </span>
        )}
        {tags && tags.map(t => (
          <span key={t} style={{
            padding: '1px 7px',
            border: `1px solid ${TOKENS.borderSoft}`,
            borderRadius: 999,
            fontSize: 10,
          }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function ConversationsDrawer() {
  const today = [
    {
      title: "Tuesday's kitchen",
      snippet: "Ah, perfect for ginger chicken stir-fry. 20 minutes, one pan. Want me to write it out for you?",
      when: '4:14 pm', count: 3, recipes: 1, tags: ['poultry'], active: true,
    },
    {
      title: 'Lunchbox ideas for the kids',
      snippet: "If they like eggs, try the rolled tamago — slice it thin so it fits next to rice…",
      when: '12:40 pm', count: 8, recipes: 2, tags: ['kids'],
    },
  ];
  const yesterday = [
    {
      title: 'Sunday roast — first try',
      snippet: "Don't worry about the pink in the middle, that's how it should be. Rest it 15 minutes…",
      when: 'Mon · 7:02 pm', count: 14, recipes: 1, tags: ['oven'],
    },
    {
      title: 'What to do with leftover rice',
      snippet: "Day-old rice is best for fried rice — drier, the grains stay separate.",
      when: 'Mon · 9:15 am', count: 5, recipes: 2,
    },
  ];
  const earlier = [
    {
      title: 'Spicy without burning my tongue',
      snippet: "Use the seeds for heat, the flesh for flavour. Take out the seeds, keep the chili.",
      when: 'Apr 27', count: 11, recipes: 0, tags: ['technique'],
    },
    {
      title: 'Birthday dinner for Ma',
      snippet: 'She likes things simple — fish, ginger, scallion. Steamed, not fried.',
      when: 'Apr 22', count: 22, recipes: 3, tags: ['celebration'],
    },
    {
      title: 'Pantry restock list',
      snippet: 'Soy sauce, sesame oil, dried shiitake, rice. The basics that run out first.',
      when: 'Apr 18', count: 4, recipes: 0,
    },
  ];

  return (
    <div style={{
      width: W_DESKTOP, height: H_DESKTOP,
      ...paperBg(TOKENS.bg),
      borderRadius: 14, border: `1px solid ${TOKENS.border}`,
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      boxShadow: `0 30px 60px -40px oklch(0.3 0.05 50 / 0.4)`,
    }}>
      <Header active="chat" width={W_DESKTOP} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Conversations rail */}
        <aside style={{
          flex: '0 0 320px',
          ...paperBg(TOKENS.tray),
          borderRight: `1px solid ${TOKENS.border}`,
          padding: '20px 16px 16px',
          display: 'flex', flexDirection: 'column', gap: 14,
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{
                fontFamily: 'Fraunces, serif', fontStyle: 'italic',
                fontWeight: 500, fontSize: 22, color: TOKENS.ink,
                letterSpacing: '-0.01em', lineHeight: 1,
              }}>Conversations</div>
              <div style={{
                fontFamily: 'Inter, sans-serif', fontSize: 11.5,
                color: TOKENS.inkFaint, marginTop: 4,
              }}>Each kitchen session, kept</div>
            </div>
            <button style={{
              width: 32, height: 32, borderRadius: 8,
              background: TOKENS.primary, color: '#fff',
              border: `1px solid ${TOKENS.primaryInk}`,
              cursor: 'pointer',
              boxShadow: `0 1px 0 ${TOKENS.primaryInk}`,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5 V14.5 M1.5 8 H14.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 11px',
            background: TOKENS.card,
            border: `1px solid ${TOKENS.border}`,
            borderRadius: 8,
            fontFamily: 'Inter, sans-serif', fontSize: 12.5,
            color: TOKENS.inkFaint,
          }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <span>Search conversations…</span>
          </div>

          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingRight: 2 }}>
            <div>
              <Eyebrow style={{ marginBottom: 8 }}>Today</Eyebrow>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {today.map((c, i) => <ConversationItem key={i} {...c} />)}
              </div>
            </div>
            <div>
              <Eyebrow style={{ marginBottom: 8 }}>Yesterday</Eyebrow>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {yesterday.map((c, i) => <ConversationItem key={i} {...c} />)}
              </div>
            </div>
            <div>
              <Eyebrow style={{ marginBottom: 8 }}>Earlier</Eyebrow>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {earlier.map((c, i) => <ConversationItem key={i} {...c} />)}
              </div>
            </div>
          </div>
        </aside>

        {/* Conversation pane — same as the main chat artboard, but
            now the "Tuesday's kitchen" header makes obvious sense:
            it's the title of THIS conversation in the rail. */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          ...paperBg(TOKENS.chat),
        }}>
          {/* Active conversation header */}
          <div style={{
            padding: '14px 28px',
            borderBottom: `1px dashed ${TOKENS.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: TOKENS.primary,
                boxShadow: `0 0 0 4px oklch(0.56 0.135 35 / 0.18)`,
              }}/>
              <div>
                <div style={{
                  fontFamily: 'Fraunces, serif', fontStyle: 'italic',
                  fontWeight: 500, fontSize: 19, color: TOKENS.ink,
                  letterSpacing: '-0.01em',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  Tuesday's kitchen
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ color: TOKENS.inkFaint }}>
                    <path d="M2 11l9-9 3 3-9 9H2v-3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{
                  fontFamily: 'Inter, sans-serif', fontSize: 11.5,
                  color: TOKENS.inkFaint, marginTop: 1,
                  letterSpacing: '0.02em',
                }}>3 messages · started 4:12 pm · 1 recipe saved</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{
                fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 500,
                color: TOKENS.inkSoft, background: 'transparent',
                border: `1px solid ${TOKENS.border}`,
                borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
              }}>Archive</button>
              <button style={{
                fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 500,
                color: '#fff', background: TOKENS.primary,
                border: `1px solid ${TOKENS.primaryInk}`,
                borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
                boxShadow: `0 1px 0 ${TOKENS.primaryInk}`,
              }}>+ New conversation</button>
            </div>
          </div>

          {/* messages — abbreviated */}
          <div style={{
            flex: 1, padding: '24px 28px',
            display: 'flex', flexDirection: 'column', gap: 22,
            overflow: 'hidden',
          }}>
            <AhMahMessage time="4:12 pm">
              Hello dear! Show Ah Mah what you have in the kitchen, then I can suggest something nice.
            </AhMahMessage>
            <UserMessage time="4:13 pm">
              I have chicken, bok choy, ginger and a wok. Quick dinner for 2.
            </UserMessage>
            <AhMahMessage time="4:14 pm">
              <div>Ah, perfect for ginger chicken stir-fry. 20 minutes, one pan.</div>
              <RecipeCard
                title="Ginger Chicken & Bok Choy"
                summary="Velvety chicken thighs, ginger that bites a little, bok choy that still snaps."
                time="20 min" servings="2" saved
              />
            </AhMahMessage>
          </div>

          {/* annotation pointing at why this exists */}
          <div style={{
            margin: '0 28px 14px',
            padding: '12px 16px',
            background: 'oklch(0.96 0.05 88)',
            border: `1px dashed oklch(0.75 0.08 88)`,
            borderRadius: 10,
            display: 'flex', gap: 12, alignItems: 'flex-start',
          }}>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'oklch(0.45 0.10 60)', flexShrink: 0, paddingTop: 2,
              minWidth: 80,
            }}>What this is</div>
            <div style={{
              fontFamily: 'Fraunces, serif', fontStyle: 'italic',
              fontSize: 13.5, color: TOKENS.ink, lineHeight: 1.5,
            }}>
              Each cooking session is a separate, named conversation — auto-titled by Ah Mah after the first reply (rename anytime by clicking the title). Saved recipes link back to the chat that produced them, so when you cook it again next month, you can re-read the full back-and-forth: the substitutions, the why, the notes.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.ConversationsDrawer = ConversationsDrawer;
