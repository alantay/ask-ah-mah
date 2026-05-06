/* The composed screens — desktop chat, desktop cookbook (filled + empty), mobile chat, token spec */

const W_DESKTOP = 1280;
const H_DESKTOP = 820;

function DesktopFrame({ children, label }) {
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
      {children}
    </div>
  );
}

/* ───────── Desktop · Chat ───────── */
function DesktopChat() {
  return (
    <DesktopFrame>
      <Header active="chat" width={W_DESKTOP} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Chat column */}
        <div style={{
          flex: '0 0 64%',
          display: 'flex', flexDirection: 'column',
          borderRight: `1px solid ${TOKENS.border}`,
          ...paperBg(TOKENS.chat),
        }}>
          {/* Conversation header — replaces "Chatting with Ah Mah" strip with a contextual session header */}
          <div style={{
            padding: '14px 28px 14px',
            borderBottom: `1px dashed ${TOKENS.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
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
              }}>3 messages · started 4:12 pm</div>
            </div>
            <button style={{
              fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 500,
              color: TOKENS.inkSoft, background: 'transparent',
              border: `1px solid ${TOKENS.border}`,
              borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
            }}>New conversation</button>
          </div>

          {/* Conversation scroll area */}
          <div style={{
            flex: 1, padding: '24px 28px',
            display: 'flex', flexDirection: 'column', gap: 22,
            overflow: 'hidden',
          }}>
            <AhMahMessage time="4:12 pm">
              Hello dear! Show Ah Mah what you have in the kitchen, then I can suggest something nice. With chicken and bok choy, we can do something simple — claypot? Stir-fry? Steamed?
            </AhMahMessage>

            <UserMessage time="4:13 pm">
              I have chicken, bok choy, ginger and a wok. Quick dinner for 2.
            </UserMessage>

            <AhMahMessage time="4:14 pm">
              <div>Ah, perfect for ginger chicken stir-fry. 20 minutes, one pan. Want me to write it out for you?</div>
              <RecipeCard
                title="Ginger Chicken & Bok Choy"
                summary="Velvety chicken thighs, ginger that bites a little, bok choy that still snaps. Soy, oyster, sesame — done."
                time="20 min"
                servings="2"
              />
            </AhMahMessage>
          </div>

          <Composer />
        </div>

        {/* Inventory column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <InventoryPanel filled />
        </div>
      </div>
    </DesktopFrame>
  );
}

/* ───────── Desktop · Cookbook (with content) ───────── */
function CookbookCard({ title, blurb, time, tags, dogeared }) {
  return (
    <article style={{
      ...paperBg(TOKENS.card),
      border: `1px solid ${TOKENS.border}`,
      borderRadius: 10,
      padding: '20px 22px 18px',
      position: 'relative',
      boxShadow: `0 1px 0 ${TOKENS.borderSoft}, 0 18px 28px -24px oklch(0.3 0.05 50 / 0.5)`,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {/* dog-ear corner */}
      {dogeared && (
        <div style={{
          position: 'absolute', top: -1, right: -1, width: 22, height: 22,
          background: `linear-gradient(225deg, ${TOKENS.tray} 50%, transparent 50%)`,
          borderTopRightRadius: 10,
          borderBottom: `1px solid ${TOKENS.border}`,
          borderLeft: `1px solid ${TOKENS.border}`,
        }}/>
      )}
      {/* placeholder image strip */}
      <div style={{
        height: 110, marginLeft: -22, marginRight: -22, marginTop: -20,
        background: `repeating-linear-gradient(135deg,
          oklch(0.84 0.05 60) 0 8px, oklch(0.80 0.05 60) 8px 16px)`,
        borderBottom: `1px solid ${TOKENS.border}`,
        position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'ui-monospace, monospace',
        fontSize: 10, color: 'oklch(0.4 0.05 50 / 0.5)',
        letterSpacing: '0.1em',
      }}>
        DISH PHOTO
      </div>
      <div style={{
        fontFamily: 'Fraunces, serif', fontWeight: 600,
        fontSize: 20, color: TOKENS.ink, lineHeight: 1.15,
        letterSpacing: '-0.01em',
      }}>{title}</div>
      <div style={{
        fontFamily: 'Fraunces, serif', fontStyle: 'italic',
        fontSize: 13.5, color: TOKENS.inkSoft, lineHeight: 1.45,
      }}>{blurb}</div>
      <div style={{
        marginTop: 'auto',
        paddingTop: 10,
        borderTop: `1px dashed ${TOKENS.border}`,
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      }}>
        <span style={{
          fontFamily: 'ui-monospace, monospace', fontSize: 11,
          color: TOKENS.inkFaint,
        }}>⏱ {time}</span>
        {tags.map(t => (
          <span key={t} style={{
            fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 500,
            padding: '2px 8px',
            color: TOKENS.inkSoft,
            background: 'transparent',
            border: `1px solid ${TOKENS.border}`,
            borderRadius: 999,
          }}>{t}</span>
        ))}
      </div>
    </article>
  );
}

function DesktopCookbook({ empty = false }) {
  const recipes = [
    { title: 'Hainanese Chicken Rice', blurb: 'Sunday lunch staple — rice cooked in chicken stock, ginger-scallion oil on top.', time: '1 h 10 m', tags: ['poultry', 'one-pot'], dogeared: true },
    { title: 'Sambal Kang Kong', blurb: 'Wok-blistered water spinach with belacan sambal, lime to finish.', time: '15 min', tags: ['vegetarian', 'spicy'] },
    { title: 'Claypot Chicken Rice', blurb: 'Smoky bottom crust, sweet soy, mushrooms and lap cheong on top.', time: '45 min', tags: ['poultry', 'rice'] },
    { title: 'Bak Kut Teh', blurb: 'Peppery pork rib soup — slow simmer until the meat falls off.', time: '2 h', tags: ['pork', 'soup'] },
    { title: 'Char Kway Teow', blurb: 'Smoky flat noodles, prawns, lap cheong, bean sprouts. Wok hei.', time: '20 min', tags: ['noodles'] },
    { title: 'Otah Otah', blurb: 'Spiced fish paste in banana leaf, charred over open flame.', time: '40 min', tags: ['seafood', 'spicy'] },
  ];

  return (
    <DesktopFrame>
      <Header active="cookbook" width={W_DESKTOP} />
      {/* The cookbook tray itself fills the page in tray color, with a content well */}
      <div style={{
        flex: 1, ...paperBg(TOKENS.tray),
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Title strip */}
        <div style={{
          padding: '24px 36px 18px',
          borderBottom: `1px solid ${TOKENS.border}`,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          gap: 24,
        }}>
          <div>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: TOKENS.inkSoft, marginBottom: 6,
            }}>Yours, kept</div>
            <h1 style={{
              fontFamily: 'Fraunces, serif',
              fontWeight: 600, fontSize: 40, lineHeight: 1,
              color: TOKENS.ink, margin: 0,
              letterSpacing: '-0.02em',
            }}>My Cookbook</h1>
            <div style={{
              fontFamily: 'Fraunces, serif', fontStyle: 'italic',
              fontSize: 15, color: TOKENS.inkSoft, marginTop: 8,
            }}>{empty ? '0 saved recipes — your shelf is waiting.' : `${recipes.length} saved recipes · last added Tuesday`}</div>
          </div>
          {!empty && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 12px',
                background: TOKENS.card,
                border: `1px solid ${TOKENS.border}`,
                borderRadius: 999,
                fontFamily: 'Inter, sans-serif', fontSize: 13,
                color: TOKENS.inkSoft, minWidth: 220,
              }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                Search your cookbook…
              </div>
            </div>
          )}
        </div>

        {/* Tag rail */}
        {!empty && (
          <div style={{
            padding: '14px 36px 0',
            display: 'flex', gap: 8, flexWrap: 'wrap',
            alignItems: 'center',
          }}>
            <Eyebrow style={{ marginRight: 6 }}>Filter</Eyebrow>
            <Chip on>All · 6</Chip>
            <Chip>poultry · 2</Chip>
            <Chip>noodles · 1</Chip>
            <Chip>vegetarian · 1</Chip>
            <Chip>seafood · 1</Chip>
            <Chip>soup · 1</Chip>
            <Chip>spicy · 2</Chip>
          </div>
        )}

        {/* Grid */}
        <div style={{
          padding: '20px 36px 36px',
          flex: 1, overflow: 'hidden',
        }}>
          {empty ? <CookbookEmpty /> : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 18,
            }}>
              {recipes.map((r, i) => <CookbookCard key={i} {...r} />)}
            </div>
          )}
        </div>
      </div>
    </DesktopFrame>
  );
}

/* Cookbook empty state — purposeful structure that previews what filled looks like */
function CookbookEmpty() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 18,
      maxWidth: 1100,
      margin: '0 auto',
    }}>
      {/* Live empty card — instructional */}
      <div style={{
        ...paperBg(TOKENS.card),
        border: `1.5px dashed ${TOKENS.border}`,
        borderRadius: 10,
        padding: '24px 22px',
        gridColumn: '1 / 2',
        gridRow: '1 / 3',
        display: 'flex', flexDirection: 'column', gap: 14,
        boxShadow: `0 1px 0 ${TOKENS.borderSoft}`,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: TOKENS.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3-7 3z"/>
          </svg>
        </div>
        <div>
          <div style={{
            fontFamily: 'Fraunces, serif', fontWeight: 600,
            fontSize: 22, color: TOKENS.ink, letterSpacing: '-0.01em',
            lineHeight: 1.15, marginBottom: 6,
          }}>Your cookbook is empty.</div>
          <div style={{
            fontFamily: 'Fraunces, serif', fontStyle: 'italic',
            fontSize: 14, color: TOKENS.inkSoft, lineHeight: 1.5,
          }}>
            When Ah Mah suggests a recipe you like, tap <em>Save to cookbook</em> and it lives here. Saved by you, ready when you need it.
          </div>
        </div>
        <button style={{
          alignSelf: 'flex-start',
          padding: '9px 14px',
          fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600,
          color: '#fff',
          background: TOKENS.primary,
          border: `1px solid ${TOKENS.primaryInk}`,
          borderRadius: 8, cursor: 'pointer',
          boxShadow: `0 1px 0 ${TOKENS.primaryInk}`,
        }}>Ask Ah Mah for a recipe →</button>
      </div>
      {/* Ghost cards — show what the page becomes */}
      {[0,1,2,3].map(i => (
        <div key={i} style={{
          height: i < 2 ? 230 : 230,
          background: 'transparent',
          border: `1.5px dashed ${TOKENS.border}`,
          borderRadius: 10,
          padding: 18,
          display: 'flex', flexDirection: 'column', gap: 8,
          opacity: 0.55,
        }}>
          <div style={{
            height: 60, background: TOKENS.muted, borderRadius: 6,
            backgroundImage: `repeating-linear-gradient(135deg,
              ${TOKENS.borderSoft} 0 6px, transparent 6px 12px)`,
            opacity: 0.6, marginLeft: -18, marginRight: -18, marginTop: -18,
            borderTopLeftRadius: 10, borderTopRightRadius: 10,
          }}/>
          <div style={{ height: 12, width: '70%', background: TOKENS.borderSoft, borderRadius: 4 }}/>
          <div style={{ height: 8, width: '90%', background: TOKENS.borderSoft, borderRadius: 4, opacity: 0.6 }}/>
          <div style={{ height: 8, width: '60%', background: TOKENS.borderSoft, borderRadius: 4, opacity: 0.6 }}/>
        </div>
      ))}
    </div>
  );
}

/* ───────── Mobile Chat ───────── */
function MobileChat() {
  return (
    <div style={{
      width: 390, height: 820,
      ...paperBg(TOKENS.bg),
      borderRadius: 28,
      border: `1px solid ${TOKENS.border}`,
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      boxShadow: `0 1px 0 oklch(1 0 0 / 0.5) inset, 0 30px 60px -40px oklch(0.3 0.05 50 / 0.4)`,
    }}>
      {/* status bar */}
      <div style={{
        height: 36, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 22px',
        fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600,
        color: TOKENS.ink,
      }}>
        <span>4:14</span>
        <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11 }}>●●●</span>
          <span style={{ fontSize: 11 }}>▾</span>
        </span>
      </div>
      {/* header */}
      <div style={{
        padding: '8px 18px 0', borderBottom: `1px solid ${TOKENS.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Logo size={17} mark="simple" />
          <button style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 11px',
            fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
            color: TOKENS.ink, background: TOKENS.card,
            border: `1px solid ${TOKENS.border}`, borderRadius: 8,
            cursor: 'pointer',
          }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M2 5h12M2 8h12M2 11h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            Pantry · 11
          </button>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['Chat', 'Cookbook'].map((t, i) => (
            <div key={t} style={{
              padding: '8px 14px 10px',
              fontFamily: 'Inter, sans-serif', fontSize: 13.5,
              fontWeight: i === 0 ? 700 : 500,
              color: i === 0 ? TOKENS.ink : TOKENS.inkFaint,
              background: i === 0 ? TOKENS.chat : 'transparent',
              border: `1px solid ${i === 0 ? TOKENS.border : 'transparent'}`,
              borderBottom: i === 0 ? `1px solid ${TOKENS.chat}` : 'none',
              borderRadius: '8px 8px 0 0', marginBottom: -1,
            }}>{t}</div>
          ))}
        </div>
      </div>
      {/* conversation */}
      <div style={{
        flex: 1, ...paperBg(TOKENS.chat),
        padding: '18px 18px 8px',
        display: 'flex', flexDirection: 'column', gap: 18,
        overflow: 'hidden',
      }}>
        <AhMahMessage time="4:12 pm">
          Hello dear! Show Ah Mah what you have — chicken, bok choy, ginger… I can think of three things.
        </AhMahMessage>
        <UserMessage>I have chicken, bok choy, ginger and a wok.</UserMessage>
        <AhMahMessage>
          <div>Stir-fry it. 20 minutes, one pan.</div>
          <RecipeCard
            title="Ginger Chicken & Bok Choy"
            summary="Velvety chicken, ginger that bites, bok choy that still snaps."
            time="20 min" servings="2"
          />
        </AhMahMessage>
      </div>
      {/* composer */}
      <div style={{
        padding: '10px 14px 18px',
        borderTop: `1px solid ${TOKENS.borderSoft}`,
        ...paperBg(TOKENS.chat),
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: TOKENS.card,
          border: `1.5px solid ${TOKENS.border}`,
          borderRadius: 14,
          padding: '6px 6px 6px 14px',
        }}>
          <input placeholder="Ask Ah Mah a question…" style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: 'Inter, sans-serif', fontSize: 14, color: TOKENS.ink,
          }}/>
          <SendButton size={32} />
        </div>
      </div>
    </div>
  );
}

/* ───────── Token spec card ───────── */
function Swatch({ label, value, color, role }) {
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 14, padding: '12px 0', borderBottom: `1px dashed ${TOKENS.border}` }}>
      <div style={{
        width: 64, height: 64,
        background: color,
        backgroundImage: `${PAPER_NOISE_URL}, ${PAPER_FIBERS_URL}`,
        backgroundBlendMode: 'multiply, multiply',
        borderRadius: 8,
        border: `1px solid ${TOKENS.border}`,
        flexShrink: 0,
      }}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'ui-monospace, monospace', fontSize: 12,
          color: TOKENS.ink, fontWeight: 700,
          marginBottom: 2,
        }}>{label}</div>
        <div style={{
          fontFamily: 'ui-monospace, monospace', fontSize: 10.5,
          color: TOKENS.inkSoft, marginBottom: 6, wordBreak: 'break-all',
        }}>{value}</div>
        <div style={{
          fontFamily: 'Fraunces, serif', fontStyle: 'italic',
          fontSize: 12, color: TOKENS.inkSoft, lineHeight: 1.4,
        }}>{role}</div>
      </div>
    </div>
  );
}

function TokenSpec() {
  const tokens = [
    { label: '--background', value: 'oklch(0.945 0.024 75)', color: TOKENS.bg,
      role: 'Outer page shell. Pulled darker from #f5ede0 so the inventory tray can sit lighter or darker against it without going invisible. Reads as warm aged paper.' },
    { label: '--card  /  card surfaces',  value: 'oklch(0.975 0.022 80)', color: TOKENS.card,
      role: 'Inverted from typical: cards inside the tray are LIGHTER than the tray (the tray is the deeper recess; the card is the note pinned to it). Used for ingredient chips, recipe cards, message composer.' },
    { label: '— chat surface (new)', value: 'oklch(0.985 0.018 82)', color: TOKENS.chat,
      role: 'Lightest surface — the “page” you write on. Anchors the conversation column so the chat area has visible ground. Active tab also uses this so the tab bar reads as connected to the page below.' },
    { label: '— tray (new, replaces muted/50)', value: 'oklch(0.905 0.030 70)', color: TOKENS.tray,
      role: 'Inventory sidebar AND cookbook background. ~6 L-points darker than --background — clearly a separate zone, not invisible. Doubles as the kraft-paper backdrop for cookbook.' },
    { label: '--muted', value: 'oklch(0.870 0.030 72)', color: TOKENS.borderSoft,
      role: 'Soft tan for tertiary surfaces (dashed-card backgrounds, hover fills). Stops being interchangeable with --background.' },
    { label: '--border', value: 'oklch(0.815 0.038 70)', color: TOKENS.border,
      role: 'Browned, never gray. Use everywhere a line is needed. Dashed variant for paper-stitched feel.' },
    { label: '--foreground', value: 'oklch(0.265 0.040 48)', color: TOKENS.ink,
      role: 'Soy-ink brown-black. Less harsh than pure black on cream, still WCAG AA on every surface.' },
    { label: '--muted-foreground', value: 'oklch(0.460 0.038 52)', color: TOKENS.inkSoft,
      role: 'Pencil. For eyebrows, metadata, dashed labels — readable but stays second.' },
  ];
  return (
    <div style={{
      width: 700, height: H_DESKTOP,
      ...paperBg(TOKENS.chat),
      border: `1px solid ${TOKENS.border}`,
      borderRadius: 14,
      padding: '32px 36px',
      display: 'flex', flexDirection: 'column',
      boxShadow: `0 30px 60px -40px oklch(0.3 0.05 50 / 0.4)`,
      overflow: 'hidden',
    }}>
      <Eyebrow>Surface tokens · OKLCH</Eyebrow>
      <h2 style={{
        fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 600,
        margin: '6px 0 6px', color: TOKENS.ink, letterSpacing: '-0.02em',
      }}>Six surfaces, one rule</h2>
      <p style={{
        fontFamily: 'Fraunces, serif', fontStyle: 'italic',
        fontSize: 14, color: TOKENS.inkSoft, margin: '0 0 14px',
        lineHeight: 1.5,
      }}>
        Page → tray → card. Each step changes lightness by ~4 OKLCH points so zones are unmistakable, but no surface ever stops feeling like cream paper.
      </p>
      <div style={{ flex: 1, overflow: 'auto', paddingRight: 4 }}>
        {tokens.map(t => <Swatch key={t.label} {...t} />)}
      </div>
    </div>
  );
}

/* ───────── Annotated fixes panel ───────── */
function FixesList() {
  const items = [
    { n: '1', t: 'Surface differentiation', body: 'Inventory tray uses --tray (oklch 0.905), six L-points below --background. Cards inside use --card (0.975) — inverted contrast: the card pops out of the recess, instead of disappearing into it.' },
    { n: '2', t: 'Chat has ground', body: 'Conversation column gets its own --chat surface (lightest, oklch 0.985), separated from the inventory tray by a 1px brown border. The bottom composer sits on the same chat surface; suggestion chips give it weight without filler text.' },
    { n: '3', t: 'Pantry feels like a workspace', body: 'Each section is a real card on the tray (paper-on-kraft), not just a label. Section headers pair an icon with the eyebrow and a tabular count — depth + utility in one row.' },
    { n: '4', t: 'Cookbook is a destination', body: 'Tray-color background, masthead with eyebrow + serif title + status line, search rail, tag chips. Empty state previews the grid with one live "explainer card" + ghost cards so the structure is legible before content exists.' },
    { n: '5', t: 'Tabs read as paper folders', body: 'Active tab = same color as the page below it (--chat or --tray), with the bottom border erased so it visually merges with the content. Inactive tabs sit on the darker --background and read as "behind."' },
    { n: '6', t: 'Cut the "Chatting with Ah Mah" strip', body: 'Replaced with a session header: serif italic title ("Tuesday\'s kitchen"), subtitle with message count + start time, "New conversation" action. Same vertical real estate, real information.' },
  ];
  return (
    <div style={{
      width: 700, height: H_DESKTOP,
      ...paperBg(TOKENS.tray),
      border: `1px solid ${TOKENS.border}`,
      borderRadius: 14,
      padding: '32px 36px',
      display: 'flex', flexDirection: 'column',
      boxShadow: `0 30px 60px -40px oklch(0.3 0.05 50 / 0.4)`,
      overflow: 'hidden',
    }}>
      <Eyebrow>Fixes by problem</Eyebrow>
      <h2 style={{
        fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 600,
        margin: '6px 0 18px', color: TOKENS.ink, letterSpacing: '-0.02em',
      }}>Six things, six answers</h2>
      <div style={{
        flex: 1, overflow: 'auto', paddingRight: 4,
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        {items.map(it => (
          <div key={it.n} style={{
            ...paperBg(TOKENS.card),
            border: `1px solid ${TOKENS.border}`,
            borderRadius: 10,
            padding: '14px 16px',
            display: 'flex', gap: 14,
            boxShadow: `0 1px 0 ${TOKENS.borderSoft}`,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: TOKENS.primary, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 16,
              flexShrink: 0,
            }}>{it.n}</div>
            <div>
              <div style={{
                fontFamily: 'Inter, sans-serif', fontWeight: 700,
                fontSize: 14, color: TOKENS.ink, marginBottom: 4,
                letterSpacing: '-0.005em',
              }}>{it.t}</div>
              <div style={{
                fontFamily: 'Fraunces, serif', fontStyle: 'italic',
                fontSize: 13.5, color: TOKENS.inkSoft, lineHeight: 1.5,
              }}>{it.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.DesktopChat = DesktopChat;
window.DesktopCookbook = DesktopCookbook;
window.MobileChat = MobileChat;
window.TokenSpec = TokenSpec;
window.FixesList = FixesList;
window.W_DESKTOP = W_DESKTOP;
window.H_DESKTOP = H_DESKTOP;
