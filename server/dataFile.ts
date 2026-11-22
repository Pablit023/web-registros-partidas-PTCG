// Guarda los datos de la app en un archivo JSON del ordenador. Lo sirve el propio servidor de Vite
// (`pnpm dev` y `pnpm preview`) en /api/datos, solo para este equipo:
//
//   GET /api/datos  → el contenido del archivo, o 404 si todavía no existe
//   PUT /api/datos  → sustituye el archivo; la versión anterior queda en *.anterior.json
//
// La ruta es `datos/partidas.json` dentro del proyecto, o la de la variable PTCG_DATA_FILE.

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { dirname, resolve } from 'node:path';
import type { Connect, Plugin } from 'vite';

export const API_PATH = '/api/datos';
const APP_MARKER = 'registro-partidas-ptcg';
/** Muy por encima de lo que ocupan miles de partidas con su log. */
const MAX_BYTES = 50 * 1024 * 1024;

export function defaultDataFile(): string {
  return resolve(process.env.PTCG_DATA_FILE ?? 'datos/partidas.json');
}

export function previousFile(file: string): string {
  return file.replace(/\.json$/i, '') + '.anterior.json';
}

/** Lee el archivo de datos, o devuelve null si todavía no existe. */
export async function readDataFile(file: string): Promise<string | null> {
  try {
    return await readFile(file, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

/**
 * Comprueba que el texto es una copia de esta app y la escribe sin dejar nunca el archivo a medias:
 * primero en un temporal y luego lo renombra. La versión que había pasa a *.anterior.json.
 */
export async function writeDataFile(file: string, body: string): Promise<void> {
  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    throw new InvalidDataError('El cuerpo no es un JSON válido.');
  }
  if ((data as { app?: unknown } | null)?.app !== APP_MARKER) {
    throw new InvalidDataError('El JSON no son datos de esta app.');
  }
  await mkdir(dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  await writeFile(temporary, body, 'utf8');
  const current = await readDataFile(file);
  if (current !== null) await writeFile(previousFile(file), current, 'utf8');
  await rename(temporary, file);
}

export class InvalidDataError extends Error {}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolveBody, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BYTES) {
        reject(new InvalidDataError('Los datos ocupan demasiado.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolveBody(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function send(res: ServerResponse, status: number, body: string, type = 'application/json') {
  res.statusCode = status;
  res.setHeader('Content-Type', `${type}; charset=utf-8`);
  res.setHeader('Cache-Control', 'no-store');
  res.end(body);
}

export function createDataFileHandler(file: string) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    try {
      if (req.method === 'GET') {
        const content = await readDataFile(file);
        if (content === null) send(res, 404, JSON.stringify({ error: 'Todavía no hay archivo.' }));
        else send(res, 200, content);
        return;
      }
      if (req.method === 'PUT') {
        await writeDataFile(file, await readBody(req));
        send(res, 200, JSON.stringify({ file, savedAt: new Date().toISOString() }));
        return;
      }
      res.setHeader('Allow', 'GET, PUT');
      send(res, 405, JSON.stringify({ error: 'Método no permitido.' }));
    } catch (error) {
      const status = error instanceof InvalidDataError ? 400 : 500;
      send(res, status, JSON.stringify({ error: (error as Error).message }));
    }
  };
}

/** Plugin de Vite que añade /api/datos a `pnpm dev` y a `pnpm preview`. */
export function dataFilePlugin(file = defaultDataFile()): Plugin {
  const handler = createDataFileHandler(file);
  const mount = (middlewares: Connect.Server) => {
    middlewares.use(API_PATH, (req, res) => void handler(req, res));
  };
  return {
    name: 'ptcg-data-file',
    configureServer: (server) => mount(server.middlewares),
    configurePreviewServer: (server) => mount(server.middlewares),
  };
}
