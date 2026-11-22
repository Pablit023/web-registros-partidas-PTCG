import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { InvalidDataError, previousFile, readDataFile, writeDataFile } from './dataFile';

const backup = (games: number) =>
  JSON.stringify({ app: 'registro-partidas-ptcg', version: 1, games: Array(games).fill({}) });

describe('archivo de datos', () => {
  let dir: string;
  let file: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'ptcg-'));
    file = join(dir, 'datos', 'partidas.json');
  });
  afterEach(() => rm(dir, { recursive: true, force: true }));

  it('devuelve null si todavía no existe', async () => {
    expect(await readDataFile(file)).toBeNull();
  });

  it('crea la carpeta, escribe y guarda la versión anterior', async () => {
    await writeDataFile(file, backup(1));
    await writeDataFile(file, backup(2));
    expect(await readDataFile(file)).toBe(backup(2));
    expect(await readFile(previousFile(file), 'utf8')).toBe(backup(1));
  });

  it('rechaza lo que no es JSON o no es de esta app, sin tocar el archivo', async () => {
    await writeDataFile(file, backup(1));
    await expect(writeDataFile(file, 'no es json')).rejects.toBeInstanceOf(InvalidDataError);
    await expect(writeDataFile(file, '{"app":"otra"}')).rejects.toBeInstanceOf(InvalidDataError);
    await expect(writeDataFile(file, 'null')).rejects.toBeInstanceOf(InvalidDataError);
    expect(await readDataFile(file)).toBe(backup(1));
  });

  it('nombra la copia anterior junto al archivo', () => {
    expect(previousFile('/a/partidas.json')).toBe('/a/partidas.anterior.json');
  });
});
