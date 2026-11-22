import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DeckCard } from '../domain/types';
import { clearTranslationCache, translateDeckCards } from './cardTranslation';

const card = (name: string, set: string, number: string, category: DeckCard['category']) => ({
  count: 1,
  name,
  set,
  number,
  category,
});

function fakeTcgdex() {
  return vi.fn(async (url: string) => {
    const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
    if (url.endsWith('abbreviation.official=TEF')) return json([{ id: 'sv05' }]);
    if (url.endsWith('abbreviation.official=SVP')) return json([{ id: 'svp' }]);
    if (url.includes('abbreviation.official=')) return json([]);
    if (url.endsWith('/sets/sv05'))
      return json({ cards: [{ localId: '144', name: 'Pokochos Gemelos' }] });
    if (url.endsWith('/sets/svp')) return json({ cards: [{ localId: '007', name: 'Pikachu' }] });
    return json({}, 404);
  });
}

describe('translateDeckCards', () => {
  beforeEach(clearTranslationCache);

  it('traduce por expansión y número, y las energías básicas sin conexión', async () => {
    const fetchFn = fakeTcgdex();
    const result = await translateDeckCards(
      [
        card('Buddy-Buddy Poffin', 'TEF', '144', 'trainer'),
        card('Pikachu', 'PR-SV', '7', 'pokemon'),
        card('Basic {R} Energy', 'SVE', '2', 'energy'),
        card('Unknown Card', 'XYZ', '1', 'trainer'),
      ],
      fetchFn,
    );
    expect(result.cards.map((c) => c.logName)).toEqual([
      'Pokochos Gemelos',
      'Pikachu',
      'Energía Fuego Básica',
      undefined,
    ]);
    expect(result.translated).toBe(3);
    expect(result.missing).toEqual(['Unknown Card']);
    expect(result.error).toBeUndefined();
  });

  it('pide cada expansión una sola vez y respeta las traducciones hechas a mano', async () => {
    const fetchFn = fakeTcgdex();
    const result = await translateDeckCards(
      [
        card('Buddy-Buddy Poffin', 'TEF', '144', 'trainer'),
        { ...card('Buddy-Buddy Poffin', 'TEF', '144', 'trainer'), logName: 'Mi nombre' },
        card('Buddy-Buddy Poffin', 'TEF', '0144', 'trainer'),
      ],
      fetchFn,
    );
    expect(result.cards.map((c) => c.logName)).toEqual([
      'Pokochos Gemelos',
      'Mi nombre',
      'Pokochos Gemelos',
    ]);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('sin conexión devuelve el mazo como estaba y un aviso', async () => {
    const fetchFn = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
    const cards = [card('Buddy-Buddy Poffin', 'TEF', '144', 'trainer')];
    const result = await translateDeckCards(cards, fetchFn);
    expect(result.cards).toEqual(cards);
    expect(result.error).toContain('TCGdex');
    expect(result.missing).toEqual(['Buddy-Buddy Poffin']);
  });
});
