// Lee el log de una partida de Pokémon TCG Live en español, como:
//
//   Turno de Pablolo23
//   Pablolo23 ha jugado Pokétableta.
//   - Pablolo23 ha robado Drakloak.
//   El Budew de MestoTrainer ha infligido 10 puntos de daño usando Polen Picazón contra ...
//   El rival se ha rendido. Pablolo23 ha ganado.
//
// Saca los jugadores, quién empezó, los turnos, el ganador, las cartas que mostró cada jugador
// y las cartas de Premio que cogió cada uno.

import type { GameResult } from './types';

export interface ParsedLog {
  players: string[];
  me: string | null;
  opponent: string | null;
  starter: string | null;
  wentFirst: boolean | null;
  turns: number;
  winner: string | null;
  result: GameResult | null;
  winReason: string;
  /** Cartas distintas que mostró el rival, en el orden en que aparecieron. */
  opponentCards: string[];
  myCards: string[];
  /** Cartas que fueron a tu mano al coger premios. */
  myPrizeCards: string[];
  prizesTaken: Record<string, number>;
  warnings: string[];
}

const NOT_A_CARD =
  /^(una carta|\d+ cartas?|su baraja|la baraja|la mano|puesto activo|banca|pok[eé]mon activo)$/i;
const ARTICLE = /(?:^|\s)(?:el|la|los|las|al|del)\s/gi;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function findPlayers(log: string): string[] {
  const players: string[] = [];
  const add = (name: string | undefined) => {
    const clean = name?.trim();
    if (clean && !players.includes(clean)) players.push(clean);
  };
  for (const rawLine of log.split(/\r?\n/)) {
    const line = rawLine.trim();
    add(/^(\S+) ha robado \d+ cartas de la mano inicial/.exec(line)?.[1]);
    add(/^Turno de (\S+)$/.exec(line)?.[1]);
  }
  return players;
}

export function parseGameLog(log: string, playerName: string): ParsedLog {
  const warnings: string[] = [];
  const players = findPlayers(log);
  const me = players.find((p) => p.toLowerCase() === playerName.trim().toLowerCase()) ?? null;
  if (players.length === 0) warnings.push('No se han encontrado jugadores en el log.');
  else if (!me) {
    warnings.push(
      `Tu nombre "${playerName}" no aparece en el log (jugadores: ${players.join(', ')}). Cámbialo en Ajustes.`,
    );
  }
  const opponent = players.find((p) => p !== me) ?? null;

  const cards = new Map<string, string[]>(players.map((p) => [p, []]));
  const prizeCards = new Map<string, string[]>(players.map((p) => [p, []]));
  const prizesTaken: Record<string, number> = Object.fromEntries(players.map((p) => [p, 0]));
  const pendingPrizes = new Map<string, number>();

  const playerAlt = players.map(escapeRegExp).join('|') || '(?!)';
  const startsWithPlayer = new RegExp(`^(${playerAlt}) `);
  const ownedBy = new RegExp(` de (${playerAlt})(?=[\\s.,!?;:]|$)`, 'g');
  const wonLine = new RegExp(`(${playerAlt}) ha ganado`);
  const addedLine = new RegExp(`^Se ha añadido (.+?) a la mano de (${playerAlt})`);
  const discardedLine = new RegExp(
    `^Se ha descartado (.+?) (?:del (.+?)|de la mano) de (${playerAlt})(?=[\\s.,]|$)`,
  );

  const addCard = (owner: string | undefined, rawName: string | undefined) => {
    if (!owner || !rawName) return;
    const name = rawName.trim().replace(/[.,;:!]+$/, '');
    if (name === '' || NOT_A_CARD.test(name) || name.length > 60) return;
    const list = cards.get(owner);
    if (list && !list.includes(name)) list.push(name);
  };
  const addPrize = (owner: string, rawName: string) => {
    const pending = pendingPrizes.get(owner) ?? 0;
    if (pending <= 0) return;
    pendingPrizes.set(owner, pending - 1);
    prizeCards.get(owner)?.push(rawName.trim().replace(/[.,;:!]+$/, ''));
  };

  let starter: string | null = null;
  let turns = 0;
  let winner: string | null = null;
  let actor: string | null = null;
  let winReason = '';
  let tie = false;

  for (const rawLine of log.split(/\r?\n/)) {
    const line = rawLine.trim().replace(/^-\s*/, '');
    if (line === '') continue;

    const turn = /^Turno de (\S+)$/.exec(line);
    if (turn?.[1]) {
      turns += 1;
      starter ??= turn[1];
      actor = turn[1];
      continue;
    }

    // Listas de cartas debajo de una acción, como "• Dreepy, Budew": son de quien hizo la acción.
    const bullet = /^[•·*]\s*(.+)$/.exec(line);
    if (bullet) {
      if (actor) {
        for (const name of (bullet[1] ?? '').split(/,\s*/)) {
          addCard(actor, name);
          addPrize(actor, name);
        }
      }
      continue;
    }

    const subject = startsWithPlayer.exec(line)?.[1];
    if (subject) actor = subject;

    if (/se ha rendido|no le quedan|no puede robar|no tiene ning[uú]n pok[eé]mon/i.test(line)) {
      winReason = describeWinReason(line, winReason);
    }
    const won = wonLine.exec(line);
    if (won?.[1]) {
      winner = won[1];
      winReason = describeWinReason(line, winReason);
      continue;
    }
    if (/empate/i.test(line)) tie = true;

    const prize = /^(\S+) ha cogido (una|\d+) cartas? de Premio/.exec(line);
    if (prize?.[1] && players.includes(prize[1])) {
      const count = prize[2] === 'una' ? 1 : Number(prize[2]);
      prizesTaken[prize[1]] = (prizesTaken[prize[1]] ?? 0) + count;
      pendingPrizes.set(prize[1], (pendingPrizes.get(prize[1]) ?? 0) + count);
      continue;
    }

    const added = addedLine.exec(line);
    if (added?.[1] && added[2]) {
      addCard(added[2], added[1]);
      addPrize(added[2], added[1]);
      continue;
    }

    const discarded = discardedLine.exec(line);
    if (discarded) {
      addCard(discarded[3], discarded[1]);
      addCard(discarded[3], discarded[2]);
      continue;
    }

    if (subject) readAction(line.slice(subject.length + 1), (name) => addCard(subject, name));

    // "El Budew de MestoTrainer ...": la carta es de quien aparece detrás de "de".
    for (const match of line.matchAll(ownedBy)) {
      const before = line.slice(0, match.index);
      const last = [...before.matchAll(ARTICLE)].at(-1);
      if (last?.index === undefined) continue;
      addCard(match[1], before.slice(last.index + last[0].length));
    }
  }

  if (winner === null && !tie && turns > 0) {
    warnings.push('No se ha encontrado quién ganó: elige el resultado a mano.');
  }

  let result: GameResult | null = null;
  if (tie && winner === null) result = 'tie';
  else if (winner && me) result = winner === me ? 'win' : 'loss';

  if (winner && winReason === '' && (prizesTaken[winner] ?? 0) >= 6) winReason = 'Premios';

  return {
    players,
    me,
    opponent,
    starter,
    wentFirst: starter && me ? starter === me : null,
    turns,
    winner,
    result,
    winReason,
    opponentCards: opponent ? (cards.get(opponent) ?? []) : [],
    myCards: me ? (cards.get(me) ?? []) : [],
    myPrizeCards: me ? (prizeCards.get(me) ?? []) : [],
    prizesTaken,
    warnings,
  };
}

/** Las acciones de un jugador que nombran cartas, sin el nombre del jugador delante. */
function readAction(rest: string, add: (name: string | undefined) => void) {
  const played = /^ha jugado (.+?)\.?$/.exec(rest);
  if (played) add(played[1]);
  const put = /^ha puesto en juego a (.+?) en (?:el|la) /.exec(rest);
  if (put) add(put[1]);
  const evolved =
    /^ha hecho que el (.+?) (?:del|de la|en el|en la) .+? evolucione a (.+?)\.?$/.exec(rest);
  if (evolved) {
    add(evolved[1]);
    add(evolved[2]);
  }
  const attached = /^ha unido (.+?) al? (.+?) (?:en|del|de la) /.exec(rest);
  if (attached) {
    add(attached[1]);
    add(attached[2]);
  }
  const retreated = /^ha retirado a (.+?) a la Banca/.exec(rest);
  if (retreated) add(retreated[1]);
  const drew = /^ha robado (.+?)\.?$/.exec(rest);
  if (drew && !/^(una carta|\d+ cartas)/.test(drew[1] ?? '')) add(drew[1]);
}

function describeWinReason(line: string, current: string): string {
  if (/se ha rendido/i.test(line)) return 'Rendición';
  if (/no le quedan cartas|no puede robar/i.test(line)) return 'Sin cartas en la baraja';
  if (/pok[eé]mon/i.test(line) && /no (le quedan|tiene)/i.test(line)) return 'Sin Pokémon en juego';
  if (/tiempo/i.test(line)) return 'Tiempo';
  if (/premio/i.test(line)) return 'Premios';
  return current;
}
