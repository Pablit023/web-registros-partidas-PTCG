// Modo torneo: las partidas de un torneo se ven aparte, pero siguen contando en las estadísticas.

import type { Game } from './types';

/** Qué partidas mirar: todas, solo las normales, solo las de torneo o las de un torneo concreto. */
export type GameScope = 'all' | 'casual' | 'tournaments' | { tournamentId: string };

export function isTournamentGame(game: Game): boolean {
  return Boolean(game.tournamentId);
}

export function gamesInScope(games: Game[], scope: GameScope): Game[] {
  if (scope === 'all') return games;
  if (scope === 'casual') return games.filter((game) => !isTournamentGame(game));
  if (scope === 'tournaments') return games.filter(isTournamentGame);
  return games.filter((game) => game.tournamentId === scope.tournamentId);
}

/** La ronda que toca en un torneo: una más que la última jugada, o la 1 si aún no hay partidas. */
export function nextRound(games: Game[], tournamentId: string): number {
  const rounds = games
    .filter((game) => game.tournamentId === tournamentId)
    .map((game) => game.round ?? 0);
  return rounds.length === 0 ? 1 : Math.max(...rounds) + 1;
}

/** Los valores de un <select> de ámbito: "all", "casual", "tournaments" o "t:<id>". */
export function scopeToValue(scope: GameScope): string {
  return typeof scope === 'string' ? scope : `t:${scope.tournamentId}`;
}

export function scopeFromValue(value: string): GameScope {
  if (value.startsWith('t:')) return { tournamentId: value.slice(2) };
  return value === 'casual' || value === 'tournaments' ? value : 'all';
}
