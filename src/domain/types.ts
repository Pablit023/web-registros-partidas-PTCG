// Modelo de datos de la app. Todo se guarda en el navegador (IndexedDB), nunca en un servidor.

export type CardCategory = 'pokemon' | 'trainer' | 'energy';

export interface DeckCard {
  count: number;
  name: string;
  /** Código de la expansión, como TWM. Vacío si la lista no lo trae. */
  set: string;
  number: string;
  category: CardCategory;
  /** Nombre en español, como sale en el log. TCG Live exporta los mazos en inglés. */
  logName?: string;
}

export interface Deck {
  id: string;
  name: string;
  cards: DeckCard[];
  isCurrent: boolean;
  /** Pokémon que se muestran como iconos (ver pokemonIcons.ts). Sin ellos, se eligen solos. */
  icons?: string[];
  createdAt: string;
  /** El texto tal como se importó desde TCG Live. */
  rawText: string;
}

export interface PrizeCard {
  name: string;
  /** Nombre en español, como sale en el log. */
  logName?: string;
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
  /** Torneo al que pertenece la partida, o null si es una partida normal. */
  tournamentId?: string | null;
  /** Ronda del torneo. En un Bo3, las partidas de la misma ronda comparten número. */
  round?: number | null;
}

export interface Tournament {
  id: string;
  name: string;
  startedAt: string;
  /** Cuándo se terminó, o null mientras sigue en curso. */
  finishedAt: string | null;
  notes: string;
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
  /** Pokémon que se muestran como iconos, como en Limitless: "dragapult", "kangaskhan-mega". */
  icons?: string[];
}

export interface Settings {
  id: 'settings';
  playerName: string;
  /** Si es true, los datos se guardan también en un archivo del ordenador (ver server/dataFile.ts). */
  saveToDisk?: boolean;
  /** Torneo en curso: las partidas nuevas se guardan en él. */
  activeTournamentId?: string | null;
}
