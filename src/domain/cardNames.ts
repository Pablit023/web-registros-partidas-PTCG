// TCG Live exporta los mazos con los nombres en inglés, pero escribe el log en español. Cada carta
// del mazo guarda por eso también su nombre en español (`logName`), que es el que se compara con el
// log y el que se enseña.

import type { DeckCard } from './types';

/** El nombre de la carta tal como sale en el log, o el del mazo si no tiene traducción. */
export function logNameOf(card: { name: string; logName?: string }): string {
  return card.logName?.trim() || card.name;
}

const ENERGY_TYPES: Array<[RegExp, string]> = [
  [/\b(grass|planta)\b/i, 'Planta'],
  [/\b(fire|fuego)\b/i, 'Fuego'],
  [/\b(water|agua)\b/i, 'Agua'],
  [/\b(lightning|rayo)\b/i, 'Rayo'],
  [/\b(psychic|ps[ií]quica)\b/i, 'Psíquica'],
  [/\b(fighting|lucha)\b/i, 'Lucha'],
  [/\b(darkness|dark|oscura)\b/i, 'Oscura'],
  [/\b(metal|met[aá]lica)\b/i, 'Metálica'],
];

const ENERGY_SYMBOLS: Record<string, string> = {
  G: 'grass',
  R: 'fire',
  W: 'water',
  L: 'lightning',
  P: 'psychic',
  F: 'fighting',
  D: 'darkness',
  M: 'metal',
};

/**
 * El nombre en español de una Energía básica, como "Energía Fuego Básica", a partir de cómo la
 * escribe la exportación: "Basic Fire Energy", "Basic {R} Energy" o "Fire Energy".
 */
export function basicEnergyLogName(name: string): string | null {
  const hasSymbol = /\{\w\}/.test(name);
  const text = name.replace(/\{(\w)\}/g, (_, s: string) => ENERGY_SYMBOLS[s.toUpperCase()] ?? s);
  if (!/energ/i.test(text)) return null;
  if (!hasSymbol && !/\bbasic\b|b[aá]sica|^\s*\w+\s+energy\s*$/i.test(text)) return null;
  const type = ENERGY_TYPES.find(([pattern]) => pattern.test(text));
  return type ? `Energía ${type[1]} Básica` : null;
}

/** Los códigos de las promos en TCG Live no son los oficiales que usa TCGdex. */
export const SET_CODE_ALIASES: Record<string, string> = {
  'PR-SV': 'SVP',
  'PR-ME': 'MEP',
};

/** "007" y "7" son la misma carta. */
export function normalizeCardNumber(number: string): string {
  return number
    .trim()
    .toLowerCase()
    .replace(/^0+(?=\w)/, '');
}

export function cardKey(card: Pick<DeckCard, 'name' | 'set' | 'number'>): string {
  return `${card.name}|${card.set}|${card.number}`;
}
