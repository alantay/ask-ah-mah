/* Token spec card + shared style primitives */

const TOKENS = {
  // Outer page shell — a touch warmer/darker than current bg, like aged newsprint
  bg:       'oklch(0.945 0.024 75)',   // #efe4d2  ≈ "old paper"
  // Inventory tray and cookbook tray — distinctly darker so they read as a separate zone
  tray:     'oklch(0.905 0.030 70)',   // #e3d3b8  ≈ "kraft"
  // Cards inside the tray — lighter than tray (inverted contrast: card pops out)
  card:     'oklch(0.975 0.022 80)',   // #faf2e2  ≈ "cream paper"
  // Chat scroll area — the lightest surface, the "page" you write on
  chat:     'oklch(0.985 0.018 82)',   // #fdf6e8  ≈ "fresh paper"
  // Borders — stained-paper edge, never gray
  border:   'oklch(0.815 0.038 70)',   // #cfb990
  borderSoft:'oklch(0.870 0.030 72)',  // #ddc9a4
  // Foregrounds
  ink:      'oklch(0.265 0.040 48)',   // #3b2d20  ≈ "soy ink"
  inkSoft:  'oklch(0.460 0.038 52)',   // #6e5944  ≈ "pencil"
  inkFaint: 'oklch(0.605 0.030 60)',   // #978268
  // Accents (kept from system)
  primary:  'oklch(0.560 0.135 35)',   // terracotta
  primaryInk:'oklch(0.405 0.130 32)',  // darker terracotta for hover/text
  jade:     'oklch(0.500 0.095 168)',
  butter:   'oklch(0.860 0.100 88)',
};

/* Inline noise/grain texture as data URL — gives surfaces a paper feel */
const PAPER_NOISE_URL = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'>
    <filter id='n'>
      <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='3'/>
      <feColorMatrix values='0 0 0 0 0.18  0 0 0 0 0.13  0 0 0 0 0.08  0 0 0 0.06 0'/>
    </filter>
    <rect width='100%' height='100%' filter='url(#n)'/>
  </svg>`
)}")`;

const PAPER_FIBERS_URL = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'>
    <filter id='f'>
      <feTurbulence type='turbulence' baseFrequency='0.012 0.6' numOctaves='2' seed='7'/>
      <feColorMatrix values='0 0 0 0 0.32  0 0 0 0 0.22  0 0 0 0 0.12  0 0 0 0.10 0'/>
    </filter>
    <rect width='100%' height='100%' filter='url(#f)'/>
  </svg>`
)}")`;

const paperBg = (color) => ({
  background: color,
  backgroundImage: `${PAPER_NOISE_URL}, ${PAPER_FIBERS_URL}`,
  backgroundBlendMode: 'multiply, multiply',
});

/* Section label — small caps, stained */
function Eyebrow({ children, style }) {
  return (
    <div style={{
      fontFamily: 'Inter, sans-serif',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: TOKENS.inkSoft,
      ...style,
    }}>
      {children}
    </div>
  );
}

window.TOKENS = TOKENS;
window.paperBg = paperBg;
window.Eyebrow = Eyebrow;
window.PAPER_NOISE_URL = PAPER_NOISE_URL;
window.PAPER_FIBERS_URL = PAPER_FIBERS_URL;
