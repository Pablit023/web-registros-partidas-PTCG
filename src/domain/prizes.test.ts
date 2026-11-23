import { describe, expect, it } from 'vitest';
import { markTakenPrizes } from './prizes';

const prize = (name: string) => ({ name, set: '', number: '', taken: false });

describe('markTakenPrizes', () => {
  it('marca una copia por cada carta cogida y añade en los huecos las que no estaban', () => {
    const { prizes, unmatched } = markTakenPrizes(
      [prize('Dreepy'), prize('Dreepy'), prize('Pokochos Gemelos')],
      ['dreepy', 'Arven'],
    );
    expect(prizes.map((p) => [p.name, p.taken])).toEqual([
      ['Dreepy', true],
      ['Dreepy', false],
      ['Pokochos Gemelos', false],
      ['Arven', true],
    ]);
    expect(unmatched).toEqual([]);
  });

  it('aparta solo las que no caben en los 6 premios', () => {
    const six = Array.from({ length: 6 }, () => prize('Dreepy'));
    const { prizes, unmatched } = markTakenPrizes(six, ['Arven']);
    expect(prizes).toHaveLength(6);
    expect(unmatched).toEqual(['Arven']);
  });

  it('sin premios elegidos, rellena con los que dice el log', () => {
    const { prizes } = markTakenPrizes([], ['Arven', 'Dreepy']);
    expect(prizes.map((p) => [p.logName, p.taken])).toEqual([
      ['Arven', true],
      ['Dreepy', true],
    ]);
  });

  it('desmarca lo que no sale en el log', () => {
    const { prizes } = markTakenPrizes([{ ...prize('Dreepy'), taken: true }], []);
    expect(prizes[0]?.taken).toBe(false);
  });

  it('compara con el nombre en español de la carta', () => {
    const { prizes } = markTakenPrizes(
      [{ ...prize('Buddy-Buddy Poffin'), logName: 'Pokochos Gemelos' }],
      ['Pokochos Gemelos'],
    );
    expect(prizes[0]?.taken).toBe(true);
  });
});
