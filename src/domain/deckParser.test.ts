import { describe, expect, it } from 'vitest';
import { parseDeckList } from './deckParser';

const spanishExport = `Pokémon: 13
4 Dreepy TWM 128
3 Drakloak TWM 129
2 Dragapult ex TWM 130
2 Budew PRE 4
2 Fezandipiti ex SFA 38

Entrenador: 35
4 Pokétableta TEF 144
4 Pokochos Gemelos TEF 145
4 Martillo Demoledor TEF 159
4 Apoyo de Nanci JTG 155
4 Camilla Nocturna SFA 61
15 Órdenes de Jefes PAL 172

Energía: 12
6 Energía Fuego Básica SVE 2
6 Energía Oscura Básica SVE 7

Total de cartas: 60`;

describe('parseDeckList', () => {
  it('lee la exportación de TCG Live en español', () => {
    const parsed = parseDeckList(spanishExport);
    expect(parsed.total).toBe(60);
    expect(parsed.warnings).toEqual([]);
    expect(parsed.cards[0]).toEqual({
      count: 4,
      name: 'Dreepy',
      set: 'TWM',
      number: '128',
      category: 'pokemon',
    });
    expect(parsed.cards.find((c) => c.name === 'Apoyo de Nanci')?.category).toBe('trainer');
    expect(parsed.cards.find((c) => c.name === 'Energía Oscura Básica')?.category).toBe('energy');
  });

  it('lee la exportación en inglés y códigos de promo', () => {
    const parsed = parseDeckList(
      'Pokémon: 1\n1 Pikachu PR-SV 88\nTrainer: 1\n1 Arven SVI 166\nEnergy: 1\n1 Basic Lightning Energy',
    );
    expect(parsed.cards.map((c) => [c.name, c.set, c.number, c.category])).toEqual([
      ['Pikachu', 'PR-SV', '88', 'pokemon'],
      ['Arven', 'SVI', '166', 'trainer'],
      ['Basic Lightning Energy', '', '', 'energy'],
    ]);
  });

  it('avisa si el mazo no tiene 60 cartas o hay líneas raras', () => {
    const parsed = parseDeckList('Pokémon: 4\n4 Dreepy TWM 128\nesto no es una carta');
    expect(parsed.total).toBe(4);
    expect(parsed.warnings).toHaveLength(2);
  });

  it('devuelve un mazo vacío sin texto', () => {
    expect(parseDeckList('').cards).toEqual([]);
  });
});
