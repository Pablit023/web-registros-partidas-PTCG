import { describe, expect, it } from 'vitest';
import { META_SEED } from './metaSeed';
import { guessDeckIcons, parseIcons, pokemonIconUrl, pokemonSlug } from './pokemonIcons';
import type { DeckCard } from './types';

const archetypes = META_SEED.map((a, i) => ({ ...a, id: String(i) }));
const pokemon = (name: string, count: number): DeckCard => ({
  count,
  name,
  set: '',
  number: '',
  category: 'pokemon',
});

describe('pokemonSlug', () => {
  it('quita el sufijo, el dueño y la máscara, y pone Mega al final', () => {
    expect(pokemonSlug('Dragapult ex')).toBe('dragapult');
    expect(pokemonSlug("N's Zoroark ex")).toBe('zoroark');
    expect(pokemonSlug('Zoroark ex de N')).toBe('zoroark');
    expect(pokemonSlug("Team Rocket's Mewtwo ex")).toBe('mewtwo');
    expect(pokemonSlug('Mega Kangaskhan ex')).toBe('kangaskhan-mega');
    expect(pokemonSlug('Mega-Kangaskhan ex')).toBe('kangaskhan-mega');
    expect(pokemonSlug('Teal Mask Ogerpon ex')).toBe('ogerpon');
    expect(pokemonSlug('Iron Hands ex')).toBe('iron-hands');
    expect(pokemonSlug("Farfetch'd")).toBe('farfetchd');
  });

  it('construye la URL de Limitless', () => {
    expect(pokemonIconUrl('dragapult')).toBe(
      'https://r2.limitlesstcg.net/pokemon/gen9/dragapult.png',
    );
  });
});

describe('parseIcons', () => {
  it('admite hasta 2 nombres separados por comas, sin repetir', () => {
    expect(parseIcons('Dragapult, dusknoir, pidgeot')).toEqual(['dragapult', 'dusknoir']);
    expect(parseIcons('dragapult, Dragapult ex')).toEqual(['dragapult']);
    expect(parseIcons('  ')).toEqual([]);
  });
});

describe('guessDeckIcons', () => {
  it('usa los iconos del mazo del meta que encaja', () => {
    const cards = [pokemon('Dreepy', 4), pokemon('Drakloak', 3), pokemon('Dragapult ex', 2)];
    expect(guessDeckIcons(cards, archetypes)).toEqual(['dragapult']);
  });

  it('sin mazo del meta, elige el ex con más copias', () => {
    const cards = [pokemon('Pikachu', 4), pokemon('Raichu ex', 2), pokemon('Mew ex', 1)];
    expect(guessDeckIcons(cards, [])).toEqual(['raichu']);
    expect(guessDeckIcons([pokemon('Pikachu', 4)], [])).toEqual(['pikachu']);
    expect(guessDeckIcons([], [])).toEqual([]);
  });
});
