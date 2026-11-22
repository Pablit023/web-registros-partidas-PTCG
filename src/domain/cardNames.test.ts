import { describe, expect, it } from 'vitest';
import { basicEnergyLogName, logNameOf, normalizeCardNumber } from './cardNames';

describe('basicEnergyLogName', () => {
  it('traduce las formas en que TCG Live escribe la Energía básica', () => {
    expect(basicEnergyLogName('Basic Fire Energy')).toBe('Energía Fuego Básica');
    expect(basicEnergyLogName('Basic {D} Energy')).toBe('Energía Oscura Básica');
    expect(basicEnergyLogName('Psychic Energy')).toBe('Energía Psíquica Básica');
    expect(basicEnergyLogName('Basic Metal Energy')).toBe('Energía Metálica Básica');
    expect(basicEnergyLogName('Energía Fuego Básica')).toBe('Energía Fuego Básica');
  });

  it('no toca las Energías especiales', () => {
    expect(basicEnergyLogName('Luminous Energy')).toBeNull();
    expect(basicEnergyLogName('Reversal Energy')).toBeNull();
    expect(basicEnergyLogName('Arven')).toBeNull();
  });
});

describe('nombres de cartas', () => {
  it('usa la traducción si la hay', () => {
    expect(logNameOf({ name: 'Buddy-Buddy Poffin', logName: 'Pokochos Gemelos' })).toBe(
      'Pokochos Gemelos',
    );
    expect(logNameOf({ name: 'Dreepy', logName: '  ' })).toBe('Dreepy');
  });

  it('trata igual 007 y 7', () => {
    expect(normalizeCardNumber('007')).toBe('7');
    expect(normalizeCardNumber('0')).toBe('0');
    expect(normalizeCardNumber('TG05')).toBe('tg05');
  });
});
