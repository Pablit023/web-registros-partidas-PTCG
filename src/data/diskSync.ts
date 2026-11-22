// Con "Guardar en el ordenador" activado, el archivo del ordenador manda: al abrir la app se cargan
// sus datos en el navegador, y cada cambio se vuelve a escribir en él medio segundo después.
// IndexedDB sigue siendo donde trabaja la app, así que todo va igual de rápido.

import { liveQuery, type Subscription } from 'dexie';
import { useSyncExternalStore } from 'react';
import { type Backup, db, exportBackup, importBackup, saveSettings } from './db';

const API_PATH = '/api/datos';
const SAVE_DELAY_MS = 500;

export type DiskStatus =
  | { state: 'off' }
  | { state: 'loading' }
  | { state: 'saving' }
  | { state: 'saved'; at: Date }
  | { state: 'error'; message: string };

let status: DiskStatus = { state: 'off' };
const listeners = new Set<() => void>();

function setStatus(next: DiskStatus) {
  status = next;
  for (const listener of listeners) listener();
}

export function useDiskStatus(): DiskStatus {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => status,
  );
}

const UNREACHABLE =
  'No se puede hablar con el servidor local. Abre la app con "pnpm dev" o "pnpm preview".';

/** Lee el archivo del ordenador, o null si todavía no existe. */
export async function fetchDiskData(): Promise<Backup | null> {
  let response: Response;
  try {
    response = await fetch(API_PATH, { cache: 'no-store' });
  } catch {
    throw new Error(UNREACHABLE);
  }
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(await errorMessage(response));
  return (await response.json()) as Backup;
}

export async function writeDiskData(backup: Backup): Promise<void> {
  let response: Response;
  try {
    response = await fetch(API_PATH, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backup),
    });
  } catch {
    throw new Error(UNREACHABLE);
  }
  if (!response.ok) throw new Error(await errorMessage(response));
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    if (body.error) return body.error;
  } catch {
    // Sin cuerpo JSON: el servidor no es el de la app (por ejemplo, un servidor de archivos).
  }
  return response.status === 404 || response.status === 405
    ? UNREACHABLE
    : `Error ${response.status}`;
}

let subscription: Subscription | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let running = false;
/** Cambia en cada arranque y parada, para que un arranque viejo que termina tarde no haga nada. */
let generation = 0;

async function saveNow() {
  setStatus({ state: 'saving' });
  try {
    await writeDiskData(await exportBackup());
    setStatus({ state: 'saved', at: new Date() });
  } catch (error) {
    setStatus({ state: 'error', message: (error as Error).message });
  }
}

/** Carga el archivo (si existe) y empieza a guardar cada cambio. No hace nada si ya está en marcha. */
export async function startDiskSync(): Promise<void> {
  if (running) return;
  running = true;
  const mine = ++generation;
  setStatus({ state: 'loading' });
  try {
    const data = await fetchDiskData();
    if (mine !== generation) return;
    if (data) {
      await importBackup(data);
      // El archivo podría traer los ajustes de antes de activar la opción.
      await saveSettings({ saveToDisk: true });
    }
  } catch (error) {
    // Sin servidor no se escribe nada: así nunca se pisa el archivo con datos sin cargar.
    if (mine !== generation) return;
    running = false;
    setStatus({ state: 'error', message: (error as Error).message });
    return;
  }
  if (mine !== generation) return;
  let first = true;
  subscription = liveQuery(() =>
    Promise.all([
      db.decks.toArray(),
      db.games.toArray(),
      db.archetypes.toArray(),
      db.settings.toArray(),
      db.tournaments.toArray(),
    ]),
  ).subscribe({
    next: () => {
      clearTimeout(timer);
      timer = setTimeout(() => void saveNow(), first ? 0 : SAVE_DELAY_MS);
      first = false;
    },
    error: (error: unknown) => setStatus({ state: 'error', message: String(error) }),
  });
}

/** Deja de guardar en el ordenador; lo que haya en el archivo se queda como está. */
export function stopDiskSync(): void {
  running = false;
  generation += 1;
  clearTimeout(timer);
  subscription?.unsubscribe();
  subscription = null;
  setStatus({ state: 'off' });
}

/** Activa la opción. Con `keep: 'browser'` el archivo se sustituye por los datos del navegador. */
export async function enableDiskSync(keep: 'disk' | 'browser'): Promise<void> {
  if (keep === 'browser') {
    // Primero el archivo y después el ajuste: al activarse, la app ya carga estos mismos datos.
    const backup = await exportBackup();
    backup.settings = backup.settings.map((s) => ({ ...s, saveToDisk: true }));
    await writeDiskData(backup);
  }
  await saveSettings({ saveToDisk: true });
}

export async function disableDiskSync(): Promise<void> {
  stopDiskSync();
  await saveSettings({ saveToDisk: false });
}
