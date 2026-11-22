// Elige el mazo rival comparando las cartas que mostró en el log con las cartas clave de cada
// mazo del meta. Cada carta clave vista suma su peso; gana el mazo con más proporción de peso visto.

import { keyCardMatches } from './normalize';
import type { Archetype } from './types';

export interface ArchetypeScore {
  archetype: Archetype;
  /** De 0 a 1: peso de las cartas clave vistas entre el peso total del mazo. */
  score: number;
  matched: string[];
}

/** Por debajo de esta puntuación no se propone ningún mazo. */
export const MIN_SCORE = 0.25;

export function scoreArchetypes(seenCards: string[], archetypes: Archetype[]): ArchetypeScore[] {
  return archetypes
    .map((archetype) => {
      const total = archetype.keyCards.reduce((sum, card) => sum + card.weight, 0);
      const matched = archetype.keyCards.filter((key) =>
        seenCards.some((seen) => keyCardMatches(key.name, seen)),
      );
      const weight = matched.reduce((sum, card) => sum + card.weight, 0);
      return {
        archetype,
        score: total > 0 ? weight / total : 0,
        matched: matched.map((card) => card.name),
      };
    })
    .filter((entry) => entry.matched.length > 0)
    .sort((a, b) => b.score - a.score || b.matched.length - a.matched.length);
}

export function detectArchetype(
  seenCards: string[],
  archetypes: Archetype[],
): ArchetypeScore | null {
  const [best] = scoreArchetypes(seenCards, archetypes);
  return best && best.score >= MIN_SCORE ? best : null;
}
