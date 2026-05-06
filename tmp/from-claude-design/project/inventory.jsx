/* Inventory tray + sub-components */

function GrannyAvatar({ size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: TOKENS.card,
      border: `1.5px solid ${TOKENS.border}`,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      overflow: 'hidden',
      boxShadow: `inset 0 1px 0 oklch(1 0 0 / 0.5)`,
    }}>
      <img
        src="granny-avatar.png"
        alt=""
        width={size * 0.92}
        height={size * 0.92}
        style={{ objectFit: 'contain', display: 'block' }}
      />
    </div>
  );
}

function IngredientTag({ name, qty, removable = true }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 4px 5px 10px',
      fontFamily: 'Inter, sans-serif', fontSize: 13,
      color: TOKENS.ink,
      background: TOKENS.card,
      border: `1px solid ${TOKENS.border}`,
      borderRadius: 6,
      boxShadow: '0 1px 0 oklch(0.82 0.04 70)',
    }}>
      <span>{name}</span>
      {qty && <span style={{ color: TOKENS.inkFaint, fontVariantNumeric: 'tabular-nums', fontSize: 11 }}>{qty}</span>}
      {removable && (
        <button style={{
          width: 16, height: 16, borderRadius: 4,
          border: 'none', background: 'transparent',
          color: TOKENS.inkFaint, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          padding: 0,
        }}>
          <svg width="10" height="10" viewBox="0 0 12 12">
            <path d="M2 2 L10 10 M10 2 L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </span>
  );
}

function PantryHeader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      gap: 12, marginBottom: 16,
    }}>
      <div>
        <div style={{
          fontFamily: 'Fraunces, serif',
          fontStyle: 'italic',
          fontWeight: 500,
          fontSize: 22,
          color: TOKENS.ink,
          letterSpacing: '-0.01em',
          lineHeight: 1.1,
        }}>Pantry</div>
        <div style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 12, color: TOKENS.inkFaint, marginTop: 2,
        }}>What's on Ah Mah's shelves today</div>
      </div>
      <button style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 10px',
        fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
        color: TOKENS.ink,
        background: TOKENS.card,
        border: `1px solid ${TOKENS.border}`,
        borderRadius: 8,
        cursor: 'pointer',
        boxShadow: '0 1px 0 oklch(0.82 0.04 70)',
      }}>
        <svg width="11" height="11" viewBox="0 0 12 12">
          <path d="M6 1.5 V10.5 M1.5 6 H10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
        Add
      </button>
    </div>
  );
}

function InventorySection({ icon, label, count, items, empty }) {
  return (
    <section style={{
      ...paperBg(TOKENS.card),
      border: `1px solid ${TOKENS.border}`,
      borderRadius: 12,
      padding: '14px 14px 16px',
      boxShadow: `0 1px 0 ${TOKENS.borderSoft}, 0 8px 18px -16px oklch(0.3 0.05 50 / 0.4)`,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
        paddingBottom: 10,
        borderBottom: `1px dashed ${TOKENS.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon}
          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: TOKENS.inkSoft,
          }}>{label}</span>
        </div>
        <span style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: 11, color: TOKENS.inkFaint,
          fontVariantNumeric: 'tabular-nums',
        }}>{count}</span>
      </div>
      {items && items.length ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {items.map((it, i) => <IngredientTag key={i} {...it} />)}
        </div>
      ) : (
        <div style={{
          fontFamily: 'Fraunces, serif',
          fontStyle: 'italic',
          fontSize: 13,
          color: TOKENS.inkFaint,
        }}>{empty}</div>
      )}
    </section>
  );
}

const ICON_HERB = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M8 14 V8 M8 8 q-4 -1 -5 -5 q4 0 5 5 Z M8 8 q4 -1 5 -5 q-4 0 -5 5 Z"
          stroke={TOKENS.inkSoft} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ICON_WOK = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M2 7 Q8 12 14 7 L13 9 Q8 13 3 9 Z" stroke={TOKENS.inkSoft} strokeWidth="1.1" strokeLinejoin="round"/>
    <line x1="14" y1="7" x2="15.5" y2="6" stroke={TOKENS.inkSoft} strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
);

function InventoryPanel({ filled = true }) {
  const ingredients = filled ? [
    { name: 'chicken thigh', qty: '500g' },
    { name: 'bok choy', qty: '1 bunch' },
    { name: 'garlic' },
    { name: 'ginger' },
    { name: 'soy sauce' },
    { name: 'sesame oil' },
    { name: 'rice', qty: '2 cups' },
    { name: 'eggs', qty: '6' },
    { name: 'spring onion' },
    { name: 'shiitake', qty: 'dried' },
    { name: 'oyster sauce' },
  ] : [];
  const kitchenware = filled ? [
    { name: 'wok' },
    { name: 'rice cooker' },
    { name: 'cleaver' },
    { name: 'steamer' },
  ] : [];

  return (
    <div style={{
      ...paperBg(TOKENS.tray),
      borderLeft: `1px solid ${TOKENS.border}`,
      height: '100%',
      padding: '20px 18px 24px',
      display: 'flex', flexDirection: 'column', gap: 14,
      position: 'relative',
    }}>
      {/* faint stitched-edge accent on the left */}
      <div style={{
        position: 'absolute', left: -1, top: 16, bottom: 16, width: 2,
        backgroundImage: `repeating-linear-gradient(to bottom, ${TOKENS.border} 0 4px, transparent 4px 8px)`,
        opacity: 0.7,
      }}/>
      <PantryHeader />
      <InventorySection
        icon={ICON_HERB}
        label="Ingredients"
        count={`${ingredients.length}`}
        items={ingredients}
        empty="Add what's in your fridge — be loose, Ah Mah understands “a bit of ginger”."
      />
      <InventorySection
        icon={ICON_WOK}
        label="Kitchenware"
        count={`${kitchenware.length}`}
        items={kitchenware}
        empty="Got a wok? A steamer? Tell Ah Mah what you cook with."
      />
      {/* Footer note: lived-in detail */}
      <div style={{
        marginTop: 'auto',
        paddingTop: 14,
        borderTop: `1px dashed ${TOKENS.border}`,
        fontFamily: 'Fraunces, serif',
        fontStyle: 'italic',
        fontSize: 12,
        color: TOKENS.inkFaint,
        lineHeight: 1.4,
      }}>
        Last seen at the wet market — Tuesday morning.
      </div>
    </div>
  );
}

window.GrannyAvatar = GrannyAvatar;
window.InventoryPanel = InventoryPanel;
window.IngredientTag = IngredientTag;
