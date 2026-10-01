// Pure ticket maths shared by the terminal (live preview) and the server (the numbers that get saved).
// No database, no UI — just integers in, integers out. All amounts are sen, all rates basis points.

import { applyBps } from './money';

export type DiscountInput = { type: 'percent'; value: number } | { type: 'amount'; value: number };

export type PricingLine = {
  unitPriceSen: number;
  quantity: number;
  /** Already resolved for this line (item override, else barber rate, else 0). */
  commissionBps: number;
};

export type PricedLine = {
  lineTotalSen: number;
  /** This line's share of the ticket discount. */
  discountShareSen: number;
  /** Commission on what was actually charged for this line (after discount, before SST). */
  commissionSen: number;
};

export type TicketTotals = {
  lines: PricedLine[];
  subtotalSen: number;
  discountSen: number;
  sstSen: number;
  totalSen: number;
  /** Discount as a share of the subtotal, for the owner-approval threshold. */
  discountBps: number;
};

export class PricingError extends Error {}

export function priceTicket(lines: PricingLine[], discount: DiscountInput | null, sstRateBps: number): TicketTotals {
  const lineTotals = lines.map((line) => line.unitPriceSen * line.quantity);
  const subtotalSen = lineTotals.reduce((sum, total) => sum + total, 0);

  let discountSen = 0;
  if (discount) {
    if (discount.type === 'percent') {
      if (discount.value <= 0 || discount.value > 10_000) throw new PricingError('Discount must be between 0% and 100%.');
      discountSen = applyBps(subtotalSen, discount.value);
    } else {
      if (discount.value <= 0) throw new PricingError('Discount amount must be more than zero.');
      if (discount.value > subtotalSen) throw new PricingError('Discount is larger than the ticket.');
      discountSen = discount.value;
    }
  }

  const shares = allocateProportionally(discountSen, lineTotals);
  const pricedLines = lines.map((line, i) => ({
    lineTotalSen: lineTotals[i],
    discountShareSen: shares[i],
    commissionSen: applyBps(lineTotals[i] - shares[i], line.commissionBps),
  }));

  const taxableSen = subtotalSen - discountSen;
  const sstSen = sstRateBps > 0 ? applyBps(taxableSen, sstRateBps) : 0;

  return {
    lines: pricedLines,
    subtotalSen,
    discountSen,
    sstSen,
    totalSen: taxableSen + sstSen,
    discountBps: subtotalSen === 0 ? 0 : Math.round((discountSen * 10_000) / subtotalSen),
  };
}

/**
 * Splits `amount` across `weights` in proportion, in whole sen, so the parts always add up exactly.
 * Each part is rounded down, then the leftover sen go to the lines with the largest remainders.
 */
export function allocateProportionally(amount: number, weights: number[]): number[] {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (amount === 0 || totalWeight === 0) return weights.map(() => 0);

  const exact = weights.map((w) => (amount * w) / totalWeight);
  const parts = exact.map(Math.floor);
  let leftover = amount - parts.reduce((sum, p) => sum + p, 0);

  const byRemainder = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || weights[b.index] - weights[a.index]);
  for (const { index } of byRemainder) {
    if (leftover === 0) break;
    parts[index] += 1;
    leftover -= 1;
  }
  return parts;
}
