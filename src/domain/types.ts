// Modelo de datos de la app. Todo se guarda en el navegador (IndexedDB), nunca en un servidor.

export type CardCategory = 'pokemon' | 'trainer' | 'energy';

export interface DeckCard {
  count: number;
  name: string;
  /** Código de la expansión, como TWM. Vacío si la lista no lo trae. */
  set: string;
  number: string;
  category: CardCategory;
}

export interface Deck {
  id: string;
  name: string;
  cards: DeckCard[];
  isCurrent: boolean;
  createdAt: string;
  /** El texto tal como se importó desde TCG Live. */
  rawText: string;
}

export interface PrizeCard {
  name: string;
  set: string;
  number: string;
  taken: boolean;
}

export type GameResult = 'win' | 'loss' | 'tie';
export type GameStatus = 'in_progress' | 'finished';

export interface Game {
  id: string;
  /** Fecha y hora de la partida, ISO 8601. */
  playedAt: string;
  status: GameStatus;
  deckId: string | null;
  /** Nombre del mazo al crear la partida, por si luego se borra el mazo. */
  deckName: string;
  prizes: PrizeCard[];
  result: GameResult | null;
  opponentName: string;
  /** Mazo rival elegido (detectado o corregido a mano). */
  archetypeId: string | null;
  /** Mazo rival que propuso la detección automática. */
  detectedArchetypeId: string | null;
  wentFirst: boolean | null;
  turns: number | null;
  winReason: string;
  notes: string;
  log: string;
  opponentCards: string[];
}

export interface KeyCard {
  name: string;
  /** Cuánto pesa la carta al detectar el mazo: 3 para la carta principal, 1 para las de apoyo. */
  weight: number;
}

export interface Archetype {
  id: string;
  name: string;
  keyCards: KeyCard[];
}

export interface Settings {
  id: 'settings';
  playerName: string;
  /** Si es true, los datos se guardan también en un archivo del ordenador (ver server/dataFile.ts). */
  saveToDisk?: boolean;
}
