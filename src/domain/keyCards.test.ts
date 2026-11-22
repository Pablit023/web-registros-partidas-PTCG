import { describe, expect, it } from 'vitest';
import { formatKeyCards, parseKeyCards } from './keyCards';

describe('parseKeyCards', () => {
  it('lee peso y nombre, con peso 1 por defecto', () => {
    expect(parseKeyCards('3 Dragapult ex\nDreepy\n\n')).toEqual([
      { name: 'Dragapult ex', weight: 3 },
      { name: 'Dreepy', weight: 1 },
    ]);
  });

  it('limita el peso entre 1 y 5 y quita repetidas', () => {
    expect(parseKeyCards('9 Dreepy\n0 Budew\n2 dreepy')).toEqual([
      { name: 'Dreepy', weight: 5 },
      { name: 'Budew', weight: 1 },
    ]);
  });

  it('vuelve al mismo texto al formatear', () => {
    const text = '3 Dragapult ex\n2 Drakloak';
    expect(formatKeyCards(parseKeyCards(text))).toBe(text);
  });
});
