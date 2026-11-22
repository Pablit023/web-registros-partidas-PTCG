// Lecturas en vivo de la base de datos: las pantallas se actualizan solas cuando algo cambia.

import { useLiveQuery } from 'dexie-react-hooks';
import type { Archetype, Deck, Game, Tournament } from '../domain/types';
import { db, DEFAULT_PLAYER_NAME } from './db';

export function useDecks(): Deck[] | undefined {
  return useLiveQuery(() => db.decks.orderBy('name').toArray(), []);
}

export function useCurrentDeck(): Deck | null | undefined {
  return useLiveQuery(
    async () => (await db.decks.filter((deck) => deck.isCurrent).first()) ?? null,
    [],
  );
}

export function useGames(): Game[] | undefined {
  return useLiveQuery(() => db.games.orderBy('playedAt').reverse().toArray(), []);
}

export function useGame(id: string | undefined): Game | null | undefined {
  return useLiveQuery(async () => (id ? ((await db.games.get(id)) ?? null) : null), [id]);
}

export function useArchetypes(): Archetype[] | undefined {
  return useLiveQuery(() => db.archetypes.orderBy('name').toArray(), []);
}

export function usePlayerName(): string {
  return (
    useLiveQuery(async () => (await db.settings.get('settings'))?.playerName, []) ??
    DEFAULT_PLAYER_NAME
  );
}

export function useTournaments(): Tournament[] | undefined {
  return useLiveQuery(() => db.tournaments.orderBy('startedAt').reverse().toArray(), []);
}

export function useTournament(id: string | undefined): Tournament | null | undefined {
  return useLiveQuery(async () => (id ? ((await db.tournaments.get(id)) ?? null) : null), [id]);
}

/** El torneo en curso, o null si no hay modo torneo. */
export function useActiveTournament(): Tournament | null | undefined {
  return useLiveQuery(async () => {
    const id = (await db.settings.get('settings'))?.activeTournamentId;
    return id ? ((await db.tournaments.get(id)) ?? null) : null;
  }, []);
}
