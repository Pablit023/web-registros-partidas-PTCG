// Elige hasta 6 cartas del mazo como premios. Cada carta se puede elegir tantas veces como copias tiene.

import { logNameOf } from '../domain/cardNames';
import type { DeckCard, PrizeCard } from '../domain/types';
import { CATEGORY_LABEL } from './ui';

export const PRIZE_COUNT = 6;

const cardKey = (card: { name: string; set: string; number: string }) =>
  `${card.name}|${card.set}|${card.number}`;

interface Props {
  cards: DeckCard[];
  prizes: PrizeCard[];
  onChange: (prizes: PrizeCard[]) => void;
}

export function PrizePicker({ cards, prizes, onChange }: Props) {
  const used = new Map<string, number>();
  for (const prize of prizes) used.set(cardKey(prize), (used.get(cardKey(prize)) ?? 0) + 1);
  const full = prizes.length >= PRIZE_COUNT;

  const add = (card: DeckCard) =>
    onChange([
      ...prizes,
      {
        name: card.name,
        logName: card.logName,
        set: card.set,
        number: card.number,
        taken: false,
      },
    ]);
  const remove = (index: number) => onChange(prizes.filter((_, i) => i !== index));

  return (
    <div className="prize-picker">
      <div className="prize-slots" aria-label="Premios elegidos">
        {Array.from({ length: PRIZE_COUNT }, (_, i) => {
          const prize = prizes[i];
          return prize ? (
            <button
              key={i}
              className="prize-slot filled"
              onClick={() => remove(i)}
              title="Quitar de los premios"
            >
              <span>{logNameOf(prize)}</span>
              <span className="remove">×</span>
            </button>
          ) : (
            <div key={i} className="prize-slot">
              Premio {i + 1}
            </div>
          );
        })}
      </div>
      {(['pokemon', 'trainer', 'energy'] as const).map((category) => {
        const group = cards.filter((card) => card.category === category);
        if (group.length === 0) return null;
        return (
          <div key={category} className="card-group">
            <h3>{CATEGORY_LABEL[category]}</h3>
            <div className="card-grid">
              {group.map((card) => {
                const left = card.count - (used.get(cardKey(card)) ?? 0);
                return (
                  <button
                    key={cardKey(card)}
                    className={`card-tile cat-${category}`}
                    disabled={full || left <= 0}
                    onClick={() => add(card)}
                  >
                    <span className="card-name" title={card.logName ? card.name : undefined}>
                      {logNameOf(card)}
                    </span>
                    <span className="card-count">×{left}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
