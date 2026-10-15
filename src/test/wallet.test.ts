import { describe, expect, it } from 'vitest';
import {
  ALLOWANCE_MAX,
  ALLOWANCE_MIN,
  UNLOCK_CAP,
  createAllStates,
  createRequest,
  daysToGoal,
  decideRequest,
  delayDays,
  isBlocked,
  purchase,
  setPermission,
  type ChildState,
} from '../lib/wallet';

const fresh = (id: 'leo' | 'emma' = 'leo'): ChildState => createAllStates()[id];

describe('Règles de base', () => {
  it('autorise un versement de 10 € à 150 €', () => {
    expect(ALLOWANCE_MIN).toBe(10);
    expect(ALLOWANCE_MAX).toBe(150);
  });

  it('démarre Léo à 35 € avec seulement les jeux bloqués', () => {
    const leo = fresh('leo');
    expect(leo.balance).toBe(3500);
    expect(leo.permissions.games).toBe(false);
    expect(leo.permissions.food).toBe(true);
  });

  it('déduit exactement 8,50 € pour un snack', () => {
    const r = purchase(fresh(), 'food');
    expect(r.ok).toBe(true);
    expect(r.state.balance).toBe(2650);
  });

  it('refuse un achat dans une catégorie bloquée', () => {
    const r = purchase(fresh(), 'games');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('blocked');
  });

  it('refuse un achat si le solde est insuffisant', () => {
    const s = { ...fresh(), balance: 800 };
    const r = purchase(s, 'food');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('insufficient');
  });
});

describe('Un état par enfant', () => {
  it('garde Léo et Emma indépendants', () => {
    const states = createAllStates();
    const leoAfter = purchase(states.leo, 'food');
    expect(leoAfter.state.balance).toBe(2650);
    expect(states.emma.balance).toBe(1850);
    expect(states.emma.permissions.shopping).toBe(false);
    expect(states.leo.permissions.shopping).toBe(true);
  });
});

describe('Boucle de déblocage', () => {
  it('crée une demande avec motif, une seule par catégorie', () => {
    let s = createRequest(fresh(), 'games', 'Pour un projet');
    expect(s.requests).toHaveLength(1);
    expect(s.requests[0]?.reason).toBe('Pour un projet');
    s = createRequest(s, 'games', 'Avec des amis');
    expect(s.requests).toHaveLength(1);
  });

  it('ignore une demande sans motif ou pour une catégorie déjà autorisée', () => {
    expect(createRequest(fresh(), 'games', '').requests).toHaveLength(0);
    expect(createRequest(fresh(), 'food', 'Autre').requests).toHaveLength(0);
  });

  it('« Oui, une fois » se reverrouille après un achat', () => {
    let s = createRequest(fresh(), 'games', 'Pour un projet');
    s = decideRequest(s, s.requests[0]!.id, { kind: 'once' });
    expect(isBlocked(s, 'games')).toBe(false);
    const r = purchase(s, 'games');
    expect(r.ok).toBe(true);
    expect(isBlocked(r.state, 'games')).toBe(true);
    expect(purchase(r.state, 'games').ok).toBe(false);
  });

  it('« Jusqu’à X € » refuse un achat qui dépasse le plafond', () => {
    let s = createRequest(fresh(), 'shopping', 'Avec des amis');
    // rendre shopping bloqué d'abord
    s = setPermission(s, 'shopping', false);
    s = createRequest(s, 'shopping', 'Avec des amis');
    s = decideRequest(s, s.requests[0]!.id, { kind: 'cap', amount: 500 });
    const r = purchase(s, 'shopping'); // 12 € > 5 €
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('over_cap');
  });

  it('« Jusqu’à 10 € » permet un achat de jeu à 10 €', () => {
    let s = createRequest(fresh(), 'games', 'Pour un projet');
    s = decideRequest(s, s.requests[0]!.id, { kind: 'cap', amount: UNLOCK_CAP });
    expect(purchase(s, 'games').ok).toBe(true);
  });

  it('« Pas maintenant » garde la catégorie bloquée et informe l’ado', () => {
    let s = createRequest(fresh(), 'games', 'Pour un projet');
    s = decideRequest(s, s.requests[0]!.id, { kind: 'later', reason: 'Pas ce mois-ci' });
    expect(isBlocked(s, 'games')).toBe(true);
    expect(s.requests).toHaveLength(0);
    expect(s.reply?.decision).toEqual({ kind: 'later', reason: 'Pas ce mois-ci' });
  });

  it('le parent qui modifie une règle annule la dérogation en cours', () => {
    let s = createRequest(fresh(), 'games', 'Pour un projet');
    s = decideRequest(s, s.requests[0]!.id, { kind: 'once' });
    s = setPermission(s, 'games', false);
    expect(isBlocked(s, 'games')).toBe(true);
  });
});

describe('Objectif d’épargne', () => {
  it('calcule le retard en jours (Léo : 8,50 € ≈ 2 jours)', () => {
    expect(delayDays(850, 35, 'weekly')).toBe(2);
  });

  it('le même achat pèse plus lourd pour Emma (mensuel)', () => {
    expect(delayDays(850, 15, 'monthly')).toBe(17);
  });

  it('un achat stocke son impact sur l’objectif', () => {
    const r = purchase(fresh(), 'food');
    expect(r.state.impact).toEqual({ days: 2, title: 'Pause snack' });
  });

  it('calcule les jours restants avant l’objectif', () => {
    // Léo : 60 € - 35 € = 25 € manquants, 5 €/jour → 5 jours
    expect(daysToGoal(fresh('leo'))).toBe(5);
  });
});
