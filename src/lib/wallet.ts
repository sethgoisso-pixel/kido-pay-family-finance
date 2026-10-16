/**
 * Logique métier de KIDO PAY (pure, testable, en centimes).
 * Chaque enfant a son propre état : solde, règles, demandes, historique, objectif.
 */

export const ALLOWANCE_MIN = 10;
export const ALLOWANCE_MAX = 150;
/** Plafond proposé au parent pour un déblocage « jusqu'à X € » (en centimes). */
export const UNLOCK_CAP = 1000;

export type CategoryId = 'food' | 'games' | 'shopping' | 'transport' | 'subscriptions';
export type ChildId = 'leo' | 'emma';
export type Frequency = 'weekly' | 'monthly';
export type Permissions = Record<CategoryId, boolean>;

/** Achat type simulé pour chaque catégorie (montants en centimes). */
export const PURCHASES: Record<CategoryId, { title: string; cost: number }> = {
  food: { title: 'Snack break', cost: 850 },
  games: { title: 'Game skin', cost: 1000 },
  shopping: { title: 'Vinted', cost: 1200 },
  transport: { title: 'Bus ticket', cost: 200 },
  subscriptions: { title: 'Music subscription', cost: 999 },
};

export const REQUEST_REASONS = ['For a project', 'With friends', 'I saved up for it', 'Other'] as const;
export const DECLINE_REASONS = ["Let's talk this weekend", 'Not this month', "Let's discuss it together"] as const;

/** Déblocage temporaire accordé par le parent. */
export type Grant = { kind: 'once' } | { kind: 'cap'; remaining: number };

export type Decision =
  | { kind: 'once' }
  | { kind: 'cap'; amount: number }
  | { kind: 'later'; reason: string };

export interface UnlockRequest {
  id: number;
  category: CategoryId;
  reason: string;
}

export interface Reply {
  category: CategoryId;
  decision: Decision;
}

export interface Activity {
  id: number;
  title: string;
  note: string;
  amount: number;
  kind: CategoryId | 'allowance';
}

export interface Goal {
  name: string;
  target: number;
}

export interface Impact {
  days: number;
  title: string;
}

export interface ChildData {
  id: ChildId;
  name: string;
  age: number;
  initialBalance: number;
  initialAllowance: number;
  initialFrequency: Frequency;
  initialPermissions: Permissions;
  goal: Goal;
  initialActivity: Activity[];
}

export interface ChildState {
  balance: number;
  allowance: number;
  frequency: Frequency;
  permissions: Permissions;
  grants: Partial<Record<CategoryId, Grant>>;
  requests: UnlockRequest[];
  activity: Activity[];
  goal: Goal;
  reply: Reply | null;
  impact: Impact | null;
}

export const CHILDREN: ChildData[] = [
  {
    id: 'leo',
    name: 'Léo',
    age: 16,
    initialBalance: 3500,
    initialAllowance: 35,
    initialFrequency: 'weekly',
    initialPermissions: { food: true, games: false, shopping: true, transport: true, subscriptions: true },
    goal: { name: 'Gaming headset', target: 6000 },
    initialActivity: [
      { id: 1, title: 'Pocket money', note: 'Today, 09:00', amount: 3500, kind: 'allowance' },
      { id: 2, title: 'Paul Bakery', note: 'Yesterday, 4:42 PM', amount: -450, kind: 'food' },
      { id: 3, title: 'Vinted', note: 'Yesterday, 12:15 PM', amount: -1200, kind: 'shopping' },
    ],
  },
  {
    id: 'emma',
    name: 'Emma',
    age: 13,
    initialBalance: 1850,
    initialAllowance: 15,
    initialFrequency: 'monthly',
    initialPermissions: { food: true, games: false, shopping: false, transport: true, subscriptions: false },
    goal: { name: 'Bluetooth speaker', target: 4000 },
    initialActivity: [
      { id: 1, title: 'Pocket money', note: '1st of the month', amount: 1500, kind: 'allowance' },
      { id: 2, title: 'Gift from Grandma', note: '3 days ago', amount: 1000, kind: 'allowance' },
      { id: 3, title: 'Bus ticket', note: 'Il y a 4 jours', amount: -650, kind: 'transport' },
    ],
  },
];

let seq = 1000;
const nextId = () => Date.now() * 1000 + (seq++ % 1000);

export function createChildState(child: ChildData): ChildState {
  return {
    balance: child.initialBalance,
    allowance: child.initialAllowance,
    frequency: child.initialFrequency,
    permissions: { ...child.initialPermissions },
    grants: {},
    requests: [],
    activity: child.initialActivity.map(a => ({ ...a })),
    goal: { ...child.goal },
    reply: null,
    impact: null,
  };
}

export function createAllStates(): Record<ChildId, ChildState> {
  return {
    leo: createChildState(CHILDREN[0]!),
    emma: createChildState(CHILDREN[1]!),
  };
}

/** Le parent active/désactive une catégorie : toute dérogation en cours est annulée. */
export function setPermission(state: ChildState, category: CategoryId, allowed: boolean): ChildState {
  const grants = { ...state.grants };
  delete grants[category];
  return { ...state, permissions: { ...state.permissions, [category]: allowed }, grants };
}

export function sendMoney(state: ChildState, euros: number): ChildState {
  const cents = Math.round(euros * 100);
  return {
    ...state,
    balance: state.balance + cents,
    activity: [
      { id: nextId(), title: 'Transfer from Dad', note: 'Just now · Boost', amount: cents, kind: 'allowance' },
      ...state.activity,
    ],
  };
}

export function isBlocked(state: ChildState, category: CategoryId): boolean {
  return !state.permissions[category] && !state.grants[category];
}

export function hasRequest(state: ChildState, category: CategoryId): boolean {
  return state.requests.some(r => r.category === category);
}

/** L'ado envoie une demande avec un motif. Ignorée si la catégorie n'est pas bloquée ou déjà demandée. */
export function createRequest(state: ChildState, category: CategoryId, reason: string): ChildState {
  if (!isBlocked(state, category) || hasRequest(state, category) || !reason) return state;
  return { ...state, requests: [...state.requests, { id: nextId(), category, reason }] };
}

/** Le parent répond : une fois / jusqu'à X € / pas maintenant (+ raison). L'ado voit la réponse. */
export function decideRequest(state: ChildState, requestId: number, decision: Decision): ChildState {
  const request = state.requests.find(r => r.id === requestId);
  if (!request) return state;
  const grants = { ...state.grants };
  if (decision.kind === 'once') grants[request.category] = { kind: 'once' };
  if (decision.kind === 'cap') grants[request.category] = { kind: 'cap', remaining: decision.amount };
  return {
    ...state,
    grants,
    requests: state.requests.filter(r => r.id !== requestId),
    reply: { category: request.category, decision },
  };
}

export function dismissReply(state: ChildState): ChildState {
  return state.reply ? { ...state, reply: null } : state;
}

/** Nombre de jours de « revenu d'argent de poche » que représente un montant. */
export function delayDays(cost: number, allowanceEuros: number, frequency: Frequency): number {
  const perDay = (allowanceEuros * 100) / (frequency === 'weekly' ? 7 : 30);
  if (perDay <= 0) return 0;
  return Math.max(1, Math.ceil(cost / perDay));
}

/** Jours restants avant d'atteindre l'objectif avec l'argent de poche (0 si déjà atteint). */
export function daysToGoal(state: ChildState): number {
  const missing = state.goal.target - state.balance;
  if (missing <= 0) return 0;
  const perDay = (state.allowance * 100) / (state.frequency === 'weekly' ? 7 : 30);
  return perDay <= 0 ? 0 : Math.ceil(missing / perDay);
}

export function goalProgress(state: ChildState): number {
  return Math.max(0, Math.min(1, state.balance / state.goal.target));
}

export type PurchaseResult =
  | { ok: true; state: ChildState }
  | { ok: false; reason: 'blocked' | 'insufficient' | 'over_cap'; state: ChildState };

/** Achat simulé dans une catégorie. Consomme un déblocage ponctuel / plafonné le cas échéant. */
export function purchase(state: ChildState, category: CategoryId): PurchaseResult {
  const { title, cost } = PURCHASES[category];
  const grant = state.grants[category];
  const allowedByRule = state.permissions[category];

  if (!allowedByRule && !grant) return { ok: false, reason: 'blocked', state };
  if (state.balance < cost) return { ok: false, reason: 'insufficient', state };
  if (!allowedByRule && grant?.kind === 'cap' && cost > grant.remaining) {
    return { ok: false, reason: 'over_cap', state };
  }

  const grants = { ...state.grants };
  if (!allowedByRule && grant) {
    if (grant.kind === 'once') delete grants[category];
    else if (grant.remaining - cost <= 0) delete grants[category];
    else grants[category] = { kind: 'cap', remaining: grant.remaining - cost };
  }

  return {
    ok: true,
    state: {
      ...state,
      balance: state.balance - cost,
      grants,
      activity: [{ id: nextId(), title, note: 'Just now', amount: -cost, kind: category }, ...state.activity],
      impact: { days: delayDays(cost, state.allowance, state.frequency), title },
    },
  };
}
