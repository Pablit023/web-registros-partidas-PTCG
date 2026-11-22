import { describe, expect, it } from 'vitest';
import { byArchetype, byTurnOrder, detectionAccuracy, overall, UNKNOWN_ARCHETYPE } from './stats';
import type { Game } from './types';

function game(overrides: Partial<Game>): Game {
  return {
    id: crypto.randomUUID(),
    playedAt: '2026-11-22T20:00:00.000Z',
    status: 'finished',
    deckId: 'd1',
    deckName: 'Dragapult',
    prizes: [],
    result: 'win',
    opponentName: 'Rival',
    archetypeId: 'a1',
    detectedArchetypeId: 'a1',
    wentFirst: true,
    turns: 10,
    winReason: '',
    notes: '',
    log: '',
    opponentCards: [],
    ...overrides,
  };
}

const archetypes = [{ id: 'a1', name: 'Gardevoir ex', keyCards: [] }];

describe('stats', () => {
  const games = [
    game({ result: 'win' }),
    game({ result: 'loss', wentFirst: false, detectedArchetypeId: null }),
    game({ result: 'win', archetypeId: null, detectedArchetypeId: 'a1' }),
    game({ status: 'in_progress', result: null }),
  ];

  it('cuenta solo las partidas terminadas', () => {
    expect(overall(games)).toMatchObject({ games: 3, wins: 2, losses: 1 });
  });

  it('agrupa por mazo rival y deja aparte los desconocidos', () => {
    const rates = byArchetype(games, archetypes);
    expect(rates.map((r) => [r.label, r.games, r.wins])).toEqual([
      ['Gardevoir ex', 2, 1],
      [UNKNOWN_ARCHETYPE, 1, 1],
    ]);
    expect(rates[0]?.winRate).toBe(0.5);
  });

  it('separa empezar primero y segundo', () => {
    expect(byTurnOrder(games).map((r) => [r.key, r.games])).toEqual([
      ['first', 2],
      ['second', 1],
    ]);
  });

  it('mide cuántas detecciones no se corrigieron', () => {
    expect(detectionAccuracy(games)).toEqual({ checked: 2, correct: 1 });
  });

  it('no divide entre cero sin partidas', () => {
    expect(overall([]).winRate).toBe(0);
  });
});
