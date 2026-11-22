// Estadísticas de las partidas terminadas: victorias por mazo rival, por mazo propio y por turno.

import type { Archetype, Game } from './types';

export interface WinRate {
  key: string;
  label: string;
  games: number;
  wins: number;
  losses: number;
  ties: number;
  /** De 0 a 1. Los empates cuentan como partidas no ganadas. */
  winRate: number;
}

export const UNKNOWN_ARCHETYPE = 'Desconocido';

function emptyRate(key: string, label: string): WinRate {
  return { key, label, games: 0, wins: 0, losses: 0, ties: 0, winRate: 0 };
}

function addGame(rate: WinRate, game: Game) {
  rate.games += 1;
  if (game.result === 'win') rate.wins += 1;
  else if (game.result === 'loss') rate.losses += 1;
  else rate.ties += 1;
  rate.winRate = rate.wins / rate.games;
}

export function finishedGames(games: Game[]): Game[] {
  return games.filter((game) => game.status === 'finished' && game.result !== null);
}

export function overall(games: Game[]): WinRate {
  const rate = emptyRate('all', 'Total');
  for (const game of finishedGames(games)) addGame(rate, game);
  return rate;
}

function groupBy(games: Game[], keyOf: (game: Game) => [string, string]): WinRate[] {
  const groups = new Map<string, WinRate>();
  for (const game of finishedGames(games)) {
    const [key, label] = keyOf(game);
    let rate = groups.get(key);
    if (!rate) {
      rate = emptyRate(key, label);
      groups.set(key, rate);
    }
    addGame(rate, game);
  }
  return [...groups.values()].sort((a, b) => b.games - a.games || b.winRate - a.winRate);
}

export function byArchetype(games: Game[], archetypes: Archetype[]): WinRate[] {
  const names = new Map(archetypes.map((a) => [a.id, a.name]));
  return groupBy(games, (game) => {
    const name = game.archetypeId ? names.get(game.archetypeId) : undefined;
    return name ? [game.archetypeId ?? '', name] : ['', UNKNOWN_ARCHETYPE];
  });
}

export function byDeck(games: Game[]): WinRate[] {
  return groupBy(games, (game) => [game.deckId ?? game.deckName, game.deckName || 'Sin mazo']);
}

export function byTurnOrder(games: Game[]): WinRate[] {
  return groupBy(
    games.filter((game) => game.wentFirst !== null),
    (game) => (game.wentFirst ? ['first', 'Empezando primero'] : ['second', 'Empezando segundo']),
  );
}

/** Detección acertada: partidas en las que no se corrigió a mano el mazo propuesto. */
export function detectionAccuracy(games: Game[]): { checked: number; correct: number } {
  const checked = finishedGames(games).filter((game) => game.detectedArchetypeId !== null);
  return {
    checked: checked.length,
    correct: checked.filter((game) => game.detectedArchetypeId === game.archetypeId).length,
  };
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
