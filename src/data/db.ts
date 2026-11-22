// Base de datos local en IndexedDB (Dexie). Vive en el navegador; si se activa en Ajustes, una
// copia se guarda además en un archivo del ordenador (src/data/diskSync.ts).

import Dexie, { type EntityTable } from 'dexie';
import { META_SEED } from '../domain/metaSeed';
import type { Archetype, Deck, Game, Settings, Tournament } from '../domain/types';

export const DEFAULT_PLAYER_NAME = 'Pablolo23';

export class PtcgDatabase extends Dexie {
  decks!: EntityTable<Deck, 'id'>;
  games!: EntityTable<Game, 'id'>;
  archetypes!: EntityTable<Archetype, 'id'>;
  settings!: EntityTable<Settings, 'id'>;
  tournaments!: EntityTable<Tournament, 'id'>;

  constructor(name = 'registro-partidas-ptcg') {
    super(name);
    this.version(1).stores({
      decks: 'id, name, isCurrent',
      games: 'id, playedAt, status, deckId, archetypeId',
      archetypes: 'id, name',
      settings: 'id',
    });
    // v2: los mazos del meta guardados antes reciben los iconos de la lista inicial.
    this.version(2).upgrade((tx) =>
      tx
        .table<Archetype>('archetypes')
        .toCollection()
        .modify((archetype) => {
          archetype.icons = withSeedIcons(archetype).icons;
        }),
    );
    // v3: torneos, y las partidas se pueden buscar por torneo.
    this.version(3).stores({
      games: 'id, playedAt, status, deckId, archetypeId, tournamentId',
      tournaments: 'id, startedAt',
    });
    this.on('populate', (tx) => {
      void tx.table('archetypes').bulkAdd(META_SEED.map((a) => ({ ...a, id: newId() })));
      void tx.table('settings').add({ id: 'settings', playerName: DEFAULT_PLAYER_NAME });
    });
  }
}

/** Un mazo del meta sin iconos recibe los de la lista inicial, si está en ella. */
function withSeedIcons(archetype: Archetype): Archetype {
  if (archetype.icons?.length) return archetype;
  const seed = META_SEED.find((s) => s.name === archetype.name);
  return seed?.icons ? { ...archetype, icons: seed.icons } : archetype;
}

export const db = new PtcgDatabase();

export function newId(): string {
  return crypto.randomUUID();
}

export async function setCurrentDeck(deckId: string): Promise<void> {
  await db.transaction('rw', db.decks, async () => {
    await db.decks.toCollection().modify({ isCurrent: false });
    await db.decks.update(deckId, { isCurrent: true });
  });
}

export async function saveSettings(changes: Partial<Omit<Settings, 'id'>>): Promise<void> {
  const current = await db.settings.get('settings');
  await db.settings.put({
    id: 'settings',
    playerName: DEFAULT_PLAYER_NAME,
    ...current,
    ...changes,
  });
}

// Copia de seguridad: un JSON con todo, para guardarlo o pasarlo a otro ordenador.

export interface Backup {
  app: 'registro-partidas-ptcg';
  version: 1;
  exportedAt: string;
  decks: Deck[];
  games: Game[];
  archetypes: Archetype[];
  settings: Settings[];
  /** Las copias anteriores a los torneos no lo traen. */
  tournaments?: Tournament[];
}

export async function exportBackup(): Promise<Backup> {
  const [decks, games, archetypes, settings, tournaments] = await Promise.all([
    db.decks.toArray(),
    db.games.toArray(),
    db.archetypes.toArray(),
    db.settings.toArray(),
    db.tournaments.toArray(),
  ]);
  return {
    app: 'registro-partidas-ptcg',
    version: 1,
    exportedAt: new Date().toISOString(),
    decks,
    games,
    archetypes,
    settings,
    tournaments,
  };
}

/** Sustituye todos los datos por los de la copia. Lanza un error si el archivo no es una copia. */
export async function importBackup(data: unknown): Promise<void> {
  const backup = data as Partial<Backup>;
  if (
    backup?.app !== 'registro-partidas-ptcg' ||
    !Array.isArray(backup.decks) ||
    !Array.isArray(backup.games) ||
    !Array.isArray(backup.archetypes)
  ) {
    throw new Error('El archivo no es una copia de seguridad de esta app.');
  }
  const tables = [db.decks, db.games, db.archetypes, db.settings, db.tournaments];
  await db.transaction('rw', tables, async () => {
    await Promise.all([
      db.decks.clear(),
      db.games.clear(),
      db.archetypes.clear(),
      db.tournaments.clear(),
    ]);
    await db.tournaments.bulkAdd(backup.tournaments ?? []);
    await db.decks.bulkAdd(backup.decks ?? []);
    await db.games.bulkAdd(backup.games ?? []);
    // Las copias anteriores a los iconos los reciben aquí, como en la versión 2 de la base de datos.
    await db.archetypes.bulkAdd((backup.archetypes ?? []).map(withSeedIcons));
    if (Array.isArray(backup.settings) && backup.settings.length > 0) {
      await db.settings.clear();
      await db.settings.bulkAdd(backup.settings);
    }
  });
}

// Torneos

/** Crea un torneo y activa el modo torneo con él. */
export async function startTournament(name: string, startedAt: string): Promise<string> {
  const id = newId();
  await db.tournaments.add({ id, name, startedAt, finishedAt: null, notes: '' });
  await saveSettings({ activeTournamentId: id });
  return id;
}

/** Termina un torneo y, si era el activo, sale del modo torneo. */
export async function finishTournament(id: string): Promise<void> {
  await db.tournaments.update(id, { finishedAt: new Date().toISOString() });
  const settings = await db.settings.get('settings');
  if (settings?.activeTournamentId === id) await saveSettings({ activeTournamentId: null });
}

/** Vuelve a abrir un torneo terminado y lo activa. */
export async function resumeTournament(id: string): Promise<void> {
  await db.tournaments.update(id, { finishedAt: null });
  await saveSettings({ activeTournamentId: id });
}

/** Borra un torneo; sus partidas se conservan como partidas normales. */
export async function deleteTournament(id: string): Promise<void> {
  await db.transaction('rw', db.tournaments, db.games, db.settings, async () => {
    await db.games.where('tournamentId').equals(id).modify({ tournamentId: null, round: null });
    await db.tournaments.delete(id);
    const settings = await db.settings.get('settings');
    if (settings?.activeTournamentId === id) await saveSettings({ activeTournamentId: null });
  });
}
