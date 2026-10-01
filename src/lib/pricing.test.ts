import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { allocateProportionally, priceTicket, PricingError } from './pricing';
import { formatRM, parseRM } from './money';

const line = (unitPriceSen: number, quantity = 1, commissionBps = 0) => ({ unitPriceSen, quantity, commissionBps });

describe('priceTicket', () => {
  test('no discount, no SST: total equals subtotal', () => {
    const t = priceTicket([line(2500), line(1200, 2)], null, 0);
    assert.equal(t.subtotalSen, 4900);
    assert.equal(t.discountSen, 0);
    assert.equal(t.sstSen, 0);
    assert.equal(t.totalSen, 4900);
  });

  test('percent discount rounds half-up to the sen', () => {
    // 10% of RM 33.33 = 333.3 sen → 333
    const t = priceTicket([line(3333)], { type: 'percent', value: 1000 }, 0);
    assert.equal(t.discountSen, 333);
    assert.equal(t.totalSen, 3000);
    assert.equal(t.discountBps, 999);
  });

  test('amount discount larger than the ticket is rejected', () => {
    assert.throws(() => priceTicket([line(1000)], { type: 'amount', value: 1001 }, 0), PricingError);
  });

  test('zero or over-100% discounts are rejected', () => {
    assert.throws(() => priceTicket([line(1000)], { type: 'percent', value: 0 }, 0), PricingError);
    assert.throws(() => priceTicket([line(1000)], { type: 'percent', value: 10_001 }, 0), PricingError);
    assert.throws(() => priceTicket([line(1000)], { type: 'amount', value: 0 }, 0), PricingError);
  });

  test('SST is charged on the discounted amount', () => {
    // RM 50 - RM 10 = RM 40; 8% SST = RM 3.20
    const t = priceTicket([line(5000)], { type: 'amount', value: 1000 }, 800);
    assert.equal(t.sstSen, 320);
    assert.equal(t.totalSen, 4320);
  });

  test('commission is paid on the discounted line value, not list price', () => {
    // Two RM 30 cuts at 50%, RM 10 discount → each line nets RM 25 → RM 12.50 commission each
    const t = priceTicket([line(3000, 1, 5000), line(3000, 1, 5000)], { type: 'amount', value: 1000 }, 0);
    assert.deepEqual(
      t.lines.map((l) => [l.discountShareSen, l.commissionSen]),
      [
        [500, 1250],
        [500, 1250],
      ]
    );
  });

  test('discount shares always add up to the discount exactly', () => {
    const t = priceTicket([line(2500), line(1200), line(3500), line(999)], { type: 'percent', value: 1500 }, 0);
    assert.equal(
      t.lines.reduce((sum, l) => sum + l.discountShareSen, 0),
      t.discountSen
    );
  });

  test('quantity multiplies the line', () => {
    const t = priceTicket([line(3500, 3, 1000)], null, 0);
    assert.equal(t.lines[0].lineTotalSen, 10_500);
    assert.equal(t.lines[0].commissionSen, 1050);
  });
});

describe('allocateProportionally', () => {
  test('leftover sen go to the largest remainders', () => {
    assert.deepEqual(allocateProportionally(100, [1, 1, 1]), [34, 33, 33]);
    assert.deepEqual(allocateProportionally(1, [100, 300]), [0, 1]);
  });

  test('zero amount or zero weights give zeros', () => {
    assert.deepEqual(allocateProportionally(0, [5, 5]), [0, 0]);
    assert.deepEqual(allocateProportionally(10, [0, 0]), [0, 0]);
  });
});

describe('money helpers', () => {
  test('parseRM accepts common inputs and rejects bad ones', () => {
    assert.equal(parseRM('45'), 4500);
    assert.equal(parseRM('45.5'), 4550);
    assert.equal(parseRM('RM 1,234.56'), 123456);
    assert.equal(parseRM('4.555'), null);
    assert.equal(parseRM(''), null);
    assert.equal(parseRM('-5'), null);
  });

  test('formatRM', () => {
    assert.equal(formatRM(4500), 'RM 45.00');
    assert.equal(formatRM(123456), 'RM 1,234.56');
    assert.equal(formatRM(-250), '-RM 2.50');
  });
});
