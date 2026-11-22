import { describe, expect, it } from 'vitest';
import exampleLog from './__fixtures__/log-ejemplo.txt?raw';
import { parseGameLog } from './logParser';

describe('parseGameLog con el log de ejemplo', () => {
  const parsed = parseGameLog(exampleLog, 'Pablolo23');

  it('encuentra los dos jugadores y cuál es el rival', () => {
    expect(parsed.players).toEqual(['RivalDePrueba', 'Pablolo23']);
    expect(parsed.me).toBe('Pablolo23');
    expect(parsed.opponent).toBe('RivalDePrueba');
  });

  it('sabe quién empezó y cuántos turnos hubo', () => {
    expect(parsed.starter).toBe('Pablolo23');
    expect(parsed.wentFirst).toBe(true);
    expect(parsed.turns).toBe(8);
  });

  it('lee la victoria por rendición', () => {
    expect(parsed.winner).toBe('Pablolo23');
    expect(parsed.result).toBe('win');
    expect(parsed.winReason).toBe('Rendición');
    expect(parsed.warnings).toEqual([]);
  });

  it('saca las cartas que mostró el rival, sin las tuyas', () => {
    expect(parsed.opponentCards).toEqual(
      expect.arrayContaining([
        'Dreepy',
        'Pokochos Gemelos',
        'Budew',
        'Denis',
        'Energía Fuego Básica',
        'Energía Psíquica Básica',
        'Órdenes de Jefes',
      ]),
    );
    expect(parsed.opponentCards).not.toContain('Drakloak');
    expect(parsed.opponentCards).not.toContain('Pokétableta');
  });

  it('saca tus cartas, incluida la mano inicial', () => {
    expect(parsed.myCards).toEqual(
      expect.arrayContaining(['Dragapult ex', 'Drakloak', 'Pokétableta', 'Martillo Demoledor']),
    );
  });

  it('cuenta los premios cogidos y qué carta fue a la mano', () => {
    expect(parsed.prizesTaken).toEqual({ RivalDePrueba: 0, Pablolo23: 1 });
    expect(parsed.myPrizeCards).toEqual(['Pokochos Gemelos']);
  });
});

describe('parseGameLog en otros casos', () => {
  it('avisa si tu nombre no está en el log y no decide el resultado', () => {
    const parsed = parseGameLog(exampleLog, 'OtroNombre');
    expect(parsed.me).toBeNull();
    expect(parsed.result).toBeNull();
    expect(parsed.warnings[0]).toContain('OtroNombre');
  });

  it('no distingue mayúsculas en tu nombre', () => {
    expect(parseGameLog(exampleLog, 'pablolo23').me).toBe('Pablolo23');
  });

  it('lee una derrota por premios y varios premios a la vez', () => {
    const log = [
      'Ana ha robado 7 cartas de la mano inicial.',
      'Yo ha robado 7 cartas de la mano inicial.',
      'Turno de Ana',
      'Ana ha jugado Gardevoir ex.',
      'Ana ha cogido 2 cartas de Premio.',
      '- 2 cartas robadas.',
      '   • Psychic Embrace, Arven',
      'Turno de Yo',
      'Yo ha cogido una carta de Premio.',
      'Se ha añadido Dreepy a la mano de Yo.',
      'Ana ha cogido 6 cartas de Premio. Ana ha ganado.',
    ].join('\n');
    const parsed = parseGameLog(log, 'Yo');
    expect(parsed.result).toBe('loss');
    expect(parsed.wentFirst).toBe(false);
    expect(parsed.prizesTaken.Ana).toBe(2);
    expect(parsed.myPrizeCards).toEqual(['Dreepy']);
    expect(parsed.opponentCards).toContain('Gardevoir ex');
  });

  it('pide el resultado a mano si el log está cortado', () => {
    const parsed = parseGameLog('Turno de Ana\nAna ha jugado Arven.', 'Yo');
    expect(parsed.result).toBeNull();
    expect(parsed.warnings.some((w) => w.includes('quién ganó'))).toBe(true);
  });

  it('no rompe con un texto vacío', () => {
    const parsed = parseGameLog('', 'Yo');
    expect(parsed.players).toEqual([]);
    expect(parsed.turns).toBe(0);
    expect(parsed.opponentCards).toEqual([]);
  });

  it('atribuye "Zoroark ex de N" a su dueño entero', () => {
    const log = 'Turno de Ana\nEl Zoroark ex de N de Ana pasa a estar en el Puesto Activo.';
    expect(parseGameLog(log, 'Yo').opponentCards).toEqual(['Zoroark ex de N']);
  });
});
