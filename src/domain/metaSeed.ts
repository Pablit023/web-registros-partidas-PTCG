// Mazos del meta con los que empieza la app, tomados de los más jugados en Limitless TCG
// (formato TEF-DLR, noviembre de 2026). Se editan desde la página "Meta".
//
// Las cartas clave usan el nombre base del Pokémon para que coincidan en español y en inglés:
// "Zoroark ex" encuentra "N's Zoroark ex" y "Zoroark ex de N". Peso 3 = carta principal,
// 2 = su línea evolutiva o pareja, 1 = apoyo típico. Los iconos son los que usa Limitless.

import type { Archetype } from './types';

type SeedArchetype = Omit<Archetype, 'id'>;

const keys = (...cards: Array<[string, number]>) =>
  cards.map(([name, weight]) => ({ name, weight }));

export const META_SEED: SeedArchetype[] = [
  {
    name: 'Dragapult ex',
    icons: ['dragapult'],
    keyCards: keys(['Dragapult ex', 3], ['Drakloak', 2], ['Dreepy', 2]),
  },
  {
    name: 'Basic Box (Kangaskhan)',
    icons: ['kangaskhan-mega', 'clefairy'],
    keyCards: keys(
      ['Kangaskhan ex', 3],
      ['Meowth ex', 1],
      ['Latias ex', 1],
      ['Ogerpon ex', 1],
      ['Chien-Pao', 1],
      ['Iron Leaves ex', 1],
    ),
  },
  {
    name: "N's Zoroark ex",
    icons: ['zoroark'],
    keyCards: keys(['Zoroark ex', 3], ['Zorua', 2]),
  },
  {
    name: 'Slowking',
    icons: ['slowking'],
    keyCards: keys(['Slowking', 3], ['Slowpoke', 2], ['Kyurem', 1], ['Kangaskhan ex', 1]),
  },
  {
    name: 'Crustle',
    icons: ['crustle'],
    keyCards: keys(['Crustle', 3], ['Dwebble', 2]),
  },
  {
    name: 'Mega Excadrill ex',
    icons: ['excadrill-mega'],
    keyCards: keys(['Excadrill ex', 3], ['Drilbur', 2]),
  },
  {
    name: 'Hydrapple ex',
    icons: ['hydrapple'],
    keyCards: keys(['Hydrapple ex', 3], ['Dipplin', 1], ['Applin', 1]),
  },
  {
    name: 'Festival Lead (Thwackey)',
    icons: ['dipplin', 'thwackey'],
    keyCards: keys(['Thwackey', 3], ['Grookey', 2], ['Dipplin', 1], ['Seaking', 1]),
  },
  {
    name: 'Alakazam',
    icons: ['alakazam'],
    keyCards: keys(['Alakazam', 3], ['Kadabra', 2], ['Abra', 1]),
  },
  {
    name: 'Mega Rayquaza ex',
    icons: ['rayquaza-mega'],
    keyCards: keys(['Rayquaza ex', 3]),
  },
  {
    name: 'Dhelmise / Banette',
    icons: ['dhelmise', 'banette'],
    keyCards: keys(['Dhelmise', 3], ['Banette', 2], ['Shuppet', 1]),
  },
  {
    name: "Rocket's Honchkrow",
    icons: ['honchkrow', 'porygon2'],
    keyCards: keys(['Honchkrow', 3], ['Murkrow', 2]),
  },
  {
    name: 'Mega Lucario ex',
    icons: ['lucario-mega'],
    keyCards: keys(['Lucario ex', 3], ['Riolu', 2]),
  },
  {
    name: 'Talonflame / Dusknoir',
    icons: ['talonflame', 'dusknoir'],
    keyCards: keys(['Talonflame', 3], ['Dusknoir', 3], ['Dusclops', 1], ['Fletchling', 1]),
  },
  {
    name: 'Mega Sharpedo ex',
    icons: ['sharpedo-mega'],
    keyCards: keys(['Sharpedo ex', 3], ['Carvanha', 2]),
  },
  {
    name: 'Mega Lopunny ex',
    icons: ['lopunny-mega'],
    keyCards: keys(['Lopunny ex', 3], ['Buneary', 2]),
  },
  {
    name: "Marnie's Grimmsnarl ex",
    icons: ['grimmsnarl'],
    keyCards: keys(['Grimmsnarl ex', 3], ['Morgrem', 2], ['Impidimp', 1]),
  },
  {
    name: "Rocket's Mewtwo ex",
    icons: ['mewtwo', 'spidops'],
    keyCards: keys(['Mewtwo ex', 3]),
  },
  {
    name: 'Beedrill ex',
    icons: ['beedrill'],
    keyCards: keys(['Beedrill ex', 3], ['Kakuna', 2], ['Weedle', 1]),
  },
  {
    name: 'Greninja ex',
    icons: ['greninja'],
    keyCards: keys(['Greninja ex', 3], ['Frogadier', 2], ['Froakie', 1]),
  },
];
