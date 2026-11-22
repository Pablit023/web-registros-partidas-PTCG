import { describe, expect, it } from 'vitest';
import { gamesInScope, nextRound, scopeFromValue, scopeToValue } from './tournaments';
import type { Game } from './types';

const game = (id: string, tournamentId: string | null, round: number | null = null) =>
  ({ id, tournamentId, round }) as Game;

const games = [
  game('normal', null),
  game('antigua', undefined as unknown as null),
  game('t1-r1', 't1', 1),
  game('t1-r2', 't1', 2),
  game('t2-r1', 't2', 1),
];

describe('gamesInScope', () => {
  it('separa las partidas normales de las de torneo', () => {
    expect(gamesInScope(games, 'all')).toHaveLength(5);
    expect(gamesInScope(games, 'casual').map((g) => g.id)).toEqual(['normal', 'antigua']);
    expect(gamesInScope(games, 'tournaments')).toHaveLength(3);
    expect(gamesInScope(games, { tournamentId: 't1' }).map((g) => g.id)).toEqual([
      't1-r1',
      't1-r2',
    ]);
  });
});

describe('nextRound', () => {
  it('sigue con la ronda siguiente a la última', () => {
    expect(nextRound(games, 't1')).toBe(3);
    expect(nextRound(games, 'nuevo')).toBe(1);
    expect(nextRound([game('sin-ronda', 't3', null)], 't3')).toBe(1);
  });
});

describe('ámbito en un select', () => {
  it('ida y vuelta', () => {
    for (const scope of ['all', 'casual', 'tournaments', { tournamentId: 'abc' }] as const) {
      expect(scopeFromValue(scopeToValue(scope))).toEqual(scope);
    }
    expect(scopeFromValue('cualquier cosa')).toBe('all');
  });
});
