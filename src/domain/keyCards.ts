// Las cartas clave de un mazo del meta se editan como texto, una por línea: "3 Dragapult ex".
// Sin número delante, la carta pesa 1.

import type { KeyCard } from './types';

export function formatKeyCards(cards: KeyCard[]): string {
  return cards.map((card) => `${card.weight} ${card.name}`).join('\n');
}

export function parseKeyCards(text: string): KeyCard[] {
  const cards: KeyCard[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === '') continue;
    const match = /^(\d+)\s+(.+)$/.exec(line);
    const name = (match ? match[2] : line)?.trim() ?? '';
    const weight = match ? Math.max(1, Math.min(5, Number(match[1]))) : 1;
    if (name !== '' && !cards.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      cards.push({ name, weight });
    }
  }
  return cards;
}
