// Iconos de los Pokémon principales de cada mazo, como en Limitless TCG. Las imágenes son las de
// Limitless (r2.limitlesstcg.net), que se nombran por el Pokémon en inglés: "dragapult",
// "kangaskhan-mega", "iron-hands".

import { detectArchetype } from './detection';
import type { Archetype, DeckCard } from './types';

export const MAX_ICONS = 2;

export function pokemonIconUrl(slug: string): string {
  return `https://r2.limitlesstcg.net/pokemon/gen9/${encodeURIComponent(slug)}.png`;
}

const MASKS = /^(teal|wellspring|hearthflame|cornerstone)\s+mask\s+/i;

/** El nombre de una carta Pokémon, en inglés o en español, como nombre de icono de Limitless. */
export function pokemonSlug(cardName: string): string {
  let name = cardName.normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  name = name.replace(/^[\w. ]+'s\s+/i, ''); // dueño en inglés: "N's", "Team Rocket's"
  name = name.replace(/\s+(de|del)\s+.+$/i, ''); // dueño en español: "de N", "del Team Rocket"
  name = name.replace(/\s+(ex|v|vstar|vmax|gx)$/i, ''); // sufijo de la carta
  name = name.replace(MASKS, '');
  let mega = false;
  if (/^mega[\s-]/i.test(name)) {
    mega = true;
    name = name.replace(/^mega[\s-]/i, '');
  }
  const slug = name
    .toLowerCase()
    .replace(/['’.:]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return mega ? `${slug}-mega` : slug;
}

/** Lee los iconos escritos a mano: "dragapult, dusknoir". */
export function parseIcons(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map((part) => pokemonSlug(part))
    .filter((slug, i, all) => slug !== '' && all.indexOf(slug) === i)
    .slice(0, MAX_ICONS);
}

/**
 * Iconos de un mazo propio. Si sus cartas encajan con un mazo del meta, usa los de ese mazo; si no,
 * el Pokémon ex con más copias (o, sin ex, el Pokémon con más copias).
 */
export function guessDeckIcons(cards: DeckCard[], archetypes: Archetype[]): string[] {
  const names = cards.flatMap((c) => [c.name, ...(c.logName ? [c.logName] : [])]);
  const archetype = detectArchetype(names, archetypes)?.archetype;
  if (archetype?.icons?.length) return archetype.icons;

  const pokemon = cards.filter((c) => c.category === 'pokemon');
  const isEx = (c: DeckCard) => /\s(ex|vstar|vmax)$/i.test(c.name) || /^mega[\s-]/i.test(c.name);
  const best = [...pokemon].sort(
    (a, b) => Number(isEx(b)) - Number(isEx(a)) || b.count - a.count,
  )[0];
  return best ? [pokemonSlug(best.name)] : [];
}
