import { describe, expect, it } from 'vitest';
import { detectArchetype, scoreArchetypes } from './detection';
import { META_SEED } from './metaSeed';
import { keyCardMatches } from './normalize';

const archetypes = META_SEED.map((a, i) => ({ ...a, id: String(i) }));

describe('keyCardMatches', () => {
  it('ignora acentos, mayúsculas, guiones y el dueño de la carta', () => {
    expect(keyCardMatches('Zoroark ex', "N's Zoroark ex")).toBe(true);
    expect(keyCardMatches('Zoroark ex', 'Zoroark ex de N')).toBe(true);
    expect(keyCardMatches('Kangaskhan ex', 'Mega-Kangaskhan ex')).toBe(true);
    expect(keyCardMatches('pokétableta', 'Pokétableta')).toBe(true);
  });

  it('no confunde un Pokémon con su versión ex', () => {
    expect(keyCardMatches('Dragapult ex', 'Dragapult')).toBe(false);
    expect(keyCardMatches('', 'Dreepy')).toBe(false);
  });
});

describe('detectArchetype', () => {
  it('detecta Dragapult con solo Dreepy y Budew vistos', () => {
    expect(detectArchetype(['Dreepy', 'Budew', 'Denis'], archetypes)?.archetype.name).toBe(
      'Dragapult ex',
    );
  });

  it('prefiere el mazo con más cartas clave vistas', () => {
    const [best] = scoreArchetypes(['Slowpoke', 'Slowking', 'Mega Kangaskhan ex'], archetypes);
    expect(best?.archetype.name).toBe('Slowking');
  });

  it('no propone nada si no hay cartas clave o pesan poco', () => {
    expect(detectArchetype(['Arven', 'Energía Fuego Básica'], archetypes)).toBeNull();
    expect(detectArchetype(['Meowth ex'], archetypes)).toBeNull();
    expect(detectArchetype([], [])).toBeNull();
  });
});
