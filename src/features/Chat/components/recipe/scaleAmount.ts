/**
 * Scale a numeric amount string by a ratio.
 * Handles integers, decimals, simple fractions ("1/2"), and mixed numbers ("1 1/2").
 * Returns the original string if parsing fails.
 */
export function scaleAmount(amount: string | undefined, ratio: number): string {
  if (!amount || ratio === 1) return amount ?? '';
  const s = String(amount).trim();

  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  const frac  = s.match(/^(\d+)\/(\d+)$/);
  const num   = s.match(/^(\d+(?:\.\d+)?)$/);

  let val: number | null = null;
  if (mixed) val = parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3]);
  else if (frac) val = parseInt(frac[1]) / parseInt(frac[2]);
  else if (num)  val = parseFloat(num[1]);
  if (val === null) return amount;

  const scaled = val * ratio;
  const whole = Math.floor(scaled);
  const remainder = scaled - whole;

  const fractions = [
    { v: 0,    g: ''  },
    { v: 0.25, g: '¼' },
    { v: 0.33, g: '⅓' },
    { v: 0.5,  g: '½' },
    { v: 0.66, g: '⅔' },
    { v: 0.75, g: '¾' },
    { v: 1,    g: ''  },
  ];
  const closest = fractions.reduce((a, b) =>
    Math.abs(b.v - remainder) < Math.abs(a.v - remainder) ? b : a
  );

  if (Math.abs(closest.v - remainder) < 0.06) {
    if (closest.v === 1) return String(whole + 1);
    if (closest.v === 0) return String(whole);
    return whole > 0 ? `${whole} ${closest.g}` : closest.g;
  }
  return scaled >= 10 ? String(Math.round(scaled)) : scaled.toFixed(1).replace(/\.0$/, '');
}
