import { normalizeName } from './normalize';
import type { PrizeCard } from './types';

/**
 * Marca como cogidos los premios que el log dice que fueron a tu mano. Cada nombre marca una sola
 * copia; los que no coinciden con ningún premio elegido se devuelven aparte.
 */
export function markTakenPrizes(
  prizes: PrizeCard[],
  takenNames: string[],
): { prizes: PrizeCard[]; unmatched: string[] } {
  const result = prizes.map((prize) => ({ ...prize, taken: false }));
  const unmatched: string[] = [];
  for (const name of takenNames) {
    const target = normalizeName(name);
    const prize = result.find((p) => !p.taken && normalizeName(p.name) === target);
    if (prize) prize.taken = true;
    else unmatched.push(name);
  }
  return { prizes: result, unmatched };
}
