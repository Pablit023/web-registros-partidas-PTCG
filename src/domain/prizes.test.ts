import { describe, expect, it } from 'vitest';
import { markTakenPrizes } from './prizes';

const prize = (name: string) => ({ name, set: '', number: '', taken: false });

describe('markTakenPrizes', () => {
  it('marca una copia por cada carta cogida y aparta las que no estaban', () => {
    const { prizes, unmatched } = markTakenPrizes(
      [prize('Dreepy'), prize('Dreepy'), prize('Pokochos Gemelos')],
      ['dreepy', 'Arven'],
    );
    expect(prizes.map((p) => p.taken)).toEqual([true, false, false]);
    expect(unmatched).toEqual(['Arven']);
  });

  it('desmarca lo que no sale en el log', () => {
    const { prizes } = markTakenPrizes([{ ...prize('Dreepy'), taken: true }], []);
    expect(prizes[0]?.taken).toBe(false);
  });
});
