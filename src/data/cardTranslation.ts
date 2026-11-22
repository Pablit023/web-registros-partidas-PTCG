// Traduce al español los nombres de las cartas de un mazo con la API pública de TCGdex
// (https://tcgdex.dev): busca la expansión por su código oficial, como TWM, y la carta por su número.
// Solo se usa al importar o al pulsar "Traducir"; sin conexión, el mazo se guarda sin traducir.

import { basicEnergyLogName, normalizeCardNumber, SET_CODE_ALIASES } from '../domain/cardNames';
import type { DeckCard } from '../domain/types';

const API = 'https://api.tcgdex.net/v2/es';

type Fetch = (url: string) => Promise<Response>;

export interface TranslationResult {
  cards: DeckCard[];
  /** Cartas que no tenían traducción y ahora la tienen. */
  translated: number;
  /** Cartas que siguen sin traducción. */
  missing: string[];
  /** Si falló la conexión con TCGdex. */
  error?: string;
}

interface SetSummary {
  id: string;
}
interface SetDetail {
  cards?: Array<{ localId: string; name: string }>;
}

/** Nombres en español de cada expansión, por número de carta. Se guarda mientras la app está abierta. */
const setCache = new Map<string, Promise<Map<string, string> | null>>();

async function loadSet(code: string, fetchFn: Fetch): Promise<Map<string, string> | null> {
  const official = SET_CODE_ALIASES[code] ?? code;
  const found = await fetchJson<SetSummary[]>(
    `${API}/sets?abbreviation.official=${encodeURIComponent(official)}`,
    fetchFn,
  );
  const id = found[0]?.id;
  if (!id) return null;
  const detail = await fetchJson<SetDetail>(`${API}/sets/${encodeURIComponent(id)}`, fetchFn);
  return new Map((detail.cards ?? []).map((c) => [normalizeCardNumber(c.localId), c.name]));
}

async function fetchJson<T>(url: string, fetchFn: Fetch): Promise<T> {
  const response = await fetchFn(url);
  if (!response.ok) throw new Error(`TCGdex respondió ${response.status}`);
  return (await response.json()) as T;
}

/** Rellena `logName` en las cartas que no lo tienen. Nunca cambia una traducción que ya existe. */
export async function translateDeckCards(
  cards: DeckCard[],
  fetchFn: Fetch = (url) => fetch(url),
): Promise<TranslationResult> {
  const result: DeckCard[] = [];
  let translated = 0;
  let error: string | undefined;

  for (const card of cards) {
    if (card.logName) {
      result.push(card);
      continue;
    }
    const energy = card.category === 'energy' ? basicEnergyLogName(card.name) : null;
    let logName = energy;
    if (!logName && card.set && card.number && !error) {
      try {
        let set = setCache.get(card.set);
        if (!set) {
          set = loadSet(card.set, fetchFn);
          setCache.set(card.set, set);
          set.catch(() => setCache.delete(card.set));
        }
        logName = (await set)?.get(normalizeCardNumber(card.number)) ?? null;
      } catch {
        error = 'No se ha podido conectar con TCGdex para traducir las cartas.';
      }
    }
    if (logName) {
      translated += 1;
      result.push({ ...card, logName });
    } else {
      result.push(card);
    }
  }

  const missing = result.filter((c) => !c.logName).map((c) => c.name);
  return { cards: result, translated, missing, error };
}

/** Solo para los tests: vacía la caché de expansiones. */
export function clearTranslationCache(): void {
  setCache.clear();
}
