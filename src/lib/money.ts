// All money is integer sen (RM 1.00 = 100). Convert only at the edges: input parsing and display.

const rmFormatter = new Intl.NumberFormat('en-MY', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 4500 → "RM 45.00" */
export function formatRM(sen: number): string {
  const sign = sen < 0 ? '-' : '';
  return `${sign}RM ${rmFormatter.format(Math.abs(sen) / 100)}`;
}

/** "45", "45.5", "45.50" → 4500 / 4550. Returns null for anything that isn't a valid amount. */
export function parseRM(input: string): number | null {
  const cleaned = input.replace(/rm/i, '').replace(/,/g, '').trim();
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, fraction = ''] = cleaned.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

/** Percentage of an amount using basis points, rounded half-up to the nearest sen. */
export function applyBps(sen: number, bps: number): number {
  return Math.round((sen * bps) / 10_000);
}
