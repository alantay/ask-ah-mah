/* Shared chrome: header, tab bar, send button, etc. */

function Logo({ size = 22, mark = 'full' }) {
  const markSize = size * 1.55;
  const src = mark === 'simple' ? 'granny-avatar.png' : 'granny-icon.png';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <img
        src={src}
        alt=""
        width={markSize}
        height={markSize}
        style={{
          width: markSize, height: markSize,
          objectFit: 'contain',
          filter: 'drop-shadow(0 1px 0 oklch(1 0 0 / 0.5))',
        }}
      />
      <span style={{
        fontFamily: 'Fraunces, serif',
        fontStyle: 'italic',
        fontWeight: 600,
        fontSize: size,
        color: TOKENS.primaryInk,
        letterSpacing: '-0.015em',
        lineHeight: 1,
      }}>Ask Ah Mah</span>
    </div>
  );
}

function Header({ active, onTab, width }) {
  return (
    <div style={{
      ...paperBg(TOKENS.bg),
      borderBottom: `1px solid ${TOKENS.border}`,
      position: 'relative',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px 0', width,
      }}>
        <Logo />
        <button style={{
          width: 28, height: 28, borderRadius: 999,
          border: `1px solid ${TOKENS.border}`,
          background: 'transparent', color: TOKENS.inkSoft,
          fontFamily: 'serif', fontStyle: 'italic', fontSize: 14, cursor: 'pointer',
        }}>?</button>
      </div>
      <TabBar active={active} onTab={onTab} />
    </div>
  );
}

function TabBar({ active, onTab }) {
  const tabs = [
    { id: 'chat', label: 'Chat' },
    { id: 'cookbook', label: 'Cookbook' },
  ];
  return (
    <div style={{
      display: 'flex', gap: 4, padding: '6px 20px 0',
      marginTop: 10,
    }}>
      {tabs.map(t => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onTab && onTab(t.id)}
            style={{
              position: 'relative',
              padding: '10px 18px 12px',
              fontFamily: 'Inter, sans-serif',
              fontSize: 14,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? TOKENS.ink : TOKENS.inkFaint,
              background: isActive ? TOKENS.chat : 'transparent',
              border: `1px solid ${isActive ? TOKENS.border : 'transparent'}`,
              borderBottom: isActive ? `1px solid ${TOKENS.chat}` : '1px solid transparent',
              borderRadius: '10px 10px 0 0',
              marginBottom: -1,
              cursor: 'pointer',
              letterSpacing: '0.01em',
            }}>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function SendButton({ size = 36 }) {
  return (
    <button style={{
      width: size, height: size, borderRadius: 10,
      background: TOKENS.primary,
      border: `1px solid ${TOKENS.primaryInk}`,
      boxShadow: `0 1px 0 ${TOKENS.primaryInk}, inset 0 1px 0 oklch(0.65 0.13 38)`,
      color: '#fff', cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M3 12 L21 4 L13 21 L11 13 Z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

function Chip({ children, on, mono }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px',
      fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 500,
      color: on ? '#fff' : TOKENS.ink,
      background: on ? TOKENS.ink : TOKENS.card,
      border: `1px solid ${on ? TOKENS.ink : TOKENS.border}`,
      borderRadius: 999,
      letterSpacing: mono ? '0.02em' : 0,
    }}>
      {children}
    </span>
  );
}

window.Logo = Logo;
window.Header = Header;
window.TabBar = TabBar;
window.SendButton = SendButton;
window.Chip = Chip;
