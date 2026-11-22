// Lee la lista que exporta Pokémon TCG Live, en español o en inglés:
//
//   Pokémon: 13
//   4 Dreepy TWM 128
//   Entrenador: 35
//   4 Pokétableta TEF 144
//   Energía: 12
//   7 Energía Fuego Básica SVE 2
//   Total de cartas: 60

import type { CardCategory, DeckCard } from './types';

const HEADERS: Array<[RegExp, CardCategory]> = [
  [/^pok[eé]mon\b/i, 'pokemon'],
  [/^(entrenador|entrenadores|trainer|trainers)\b/i, 'trainer'],
  [/^(energ[ií]a|energ[ií]as|energy)\b/i, 'energy'],
];

const TOTAL_LINE = /^(total|cartas totales)/i;
const CARD_LINE =
  /^(\d+)\s+(.+?)(?:\s+([A-Z][A-Z0-9]{1,4}(?:-[A-Z0-9]+)?)\s+([A-Z]{0,4}\d+[a-z]?))?$/;

export interface ParsedDeck {
  cards: DeckCard[];
  total: number;
  warnings: string[];
}

export function parseDeckList(text: string): ParsedDeck {
  const cards: DeckCard[] = [];
  const warnings: string[] = [];
  let category: CardCategory | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim().replace(/^\*\s*/, '');
    if (line === '' || TOTAL_LINE.test(line)) continue;

    const header = HEADERS.find(([pattern]) => pattern.test(line) && /:\s*\d*\s*$/.test(line));
    if (header) {
      category = header[1];
      continue;
    }

    const match = CARD_LINE.exec(line);
    if (!match) {
      warnings.push(`No se ha entendido la línea: "${line}"`);
      continue;
    }
    const [, count, name, set = '', number = ''] = match;
    const cardName = (name ?? '').trim();
    cards.push({
      count: Number(count),
      name: cardName,
      set,
      number,
      category: category ?? guessCategory(cardName),
    });
  }

  const total = cards.reduce((sum, card) => sum + card.count, 0);
  if (cards.length > 0 && total !== 60) {
    warnings.push(`El mazo tiene ${total} cartas en vez de 60.`);
  }
  return { cards, total, warnings };
}

function guessCategory(name: string): CardCategory {
  return /energ/i.test(name) ? 'energy' : 'trainer';
}
