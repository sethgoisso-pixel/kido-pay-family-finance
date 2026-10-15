export const INITIAL_BALANCE = 3500;
export const SNACK_COST = 850;
export const ALLOWANCE_MIN = 10;
export const ALLOWANCE_MAX = 150;
export type CategoryId = 'food' | 'games' | 'shopping' | 'transport' | 'subscriptions';
export type Permissions = Record<CategoryId, boolean>;
export const INITIAL_PERMISSIONS: Permissions = { food: true, games: false, shopping: true, transport: true, subscriptions: true };
export function spendSnack(balance: number, permissions: Permissions) {
  if (!permissions.food || balance < SNACK_COST) return { success: false, balance };
  return { success: true, balance: balance - SNACK_COST };
}
export function decideRequest(permissions: Permissions, category: CategoryId, approved: boolean): Permissions {
  return approved ? { ...permissions, [category]: true } : permissions;
}