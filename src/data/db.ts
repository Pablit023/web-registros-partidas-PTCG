// Base de datos local en IndexedDB (Dexie). Vive en el navegador; si se activa en Ajustes, una
// copia se guarda además en un archivo del ordenador (src/data/diskSync.ts).

import Dexie, { type EntityTable } from 'dexie';
import { META_SEED } from '../domain/metaSeed';
import type { Archetype, Deck, Game, Settings } from '../domain/types';

export const DEFAULT_PLAYER_NAME = 'Pablolo23';

export class PtcgDatabase extends Dexie {
  decks!: EntityTable<Deck, 'id'>;
  games!: EntityTable<Game, 'id'>;
  archetypes!: EntityTable<Archetype, 'id'>;
  settings!: EntityTable<Settings, 'id'>;

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
          if (archetype.icons?.length) return;
          const seed = META_SEED.find((s) => s.name === archetype.name);
          if (seed?.icons) archetype.icons = seed.icons;
        }),
    );
    this.on('populate', (tx) => {
      void tx.table('archetypes').bulkAdd(META_SEED.map((a) => ({ ...a, id: newId() })));
      void tx.table('settings').add({ id: 'settings', playerName: DEFAULT_PLAYER_NAME });
    });
  }
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
}

export async function exportBackup(): Promise<Backup> {
  const [decks, games, archetypes, settings] = await Promise.all([
    db.decks.toArray(),
    db.games.toArray(),
    db.archetypes.toArray(),
    db.settings.toArray(),
  ]);
  return {
    app: 'registro-partidas-ptcg',
    version: 1,
    exportedAt: new Date().toISOString(),
    decks,
    games,
    archetypes,
    settings,
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
  await db.transaction('rw', [db.decks, db.games, db.archetypes, db.settings], async () => {
    await Promise.all([db.decks.clear(), db.games.clear(), db.archetypes.clear()]);
    await db.decks.bulkAdd(backup.decks ?? []);
    await db.games.bulkAdd(backup.games ?? []);
    await db.archetypes.bulkAdd(backup.archetypes ?? []);
    if (Array.isArray(backup.settings) && backup.settings.length > 0) {
      await db.settings.clear();
      await db.settings.bulkAdd(backup.settings);
    }
  });
}
