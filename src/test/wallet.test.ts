import { describe, expect, it } from 'vitest';
import { ALLOWANCE_MAX, ALLOWANCE_MIN, INITIAL_BALANCE, INITIAL_PERMISSIONS, decideRequest, spendSnack } from '../lib/wallet';
describe('KIDO PAY rules', () => {
  it('allows an allowance from €10 to €150', () => { expect(ALLOWANCE_MIN).toBe(10); expect(ALLOWANCE_MAX).toBe(150); });
  it('starts with €35', () => { expect(INITIAL_BALANCE).toBe(3500); });
  it('starts with only games blocked', () => { expect(INITIAL_PERMISSIONS).toEqual({ food: true, games: false, shopping: true, transport: true, subscriptions: true }); });
  it('deducts exactly €8.50 for a snack', () => { expect(spendSnack(3500, INITIAL_PERMISSIONS)).toEqual({ success: true, balance: 2650 }); });
  it('does not allow a blocked snack purchase', () => { expect(spendSnack(3500, { ...INITIAL_PERMISSIONS, food: false })).toEqual({ success: false, balance: 3500 }); });
  it('does not allow overdrafts', () => { expect(spendSnack(800, INITIAL_PERMISSIONS)).toEqual({ success: false, balance: 800 }); });
  it('unlocks the requested category on approval', () => { expect(decideRequest(INITIAL_PERMISSIONS, 'games', true).games).toBe(true); });
  it('keeps the category locked on refusal', () => { expect(decideRequest(INITIAL_PERMISSIONS, 'games', false).games).toBe(false); });
});