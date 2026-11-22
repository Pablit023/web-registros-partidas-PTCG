// Mazos del meta con los que empieza la app, tomados de los más jugados en Limitless TCG
// (formato TEF-DLR, noviembre de 2026). Se editan desde la página "Meta".
//
// Las cartas clave usan el nombre base del Pokémon para que coincidan en español y en inglés:
// "Zoroark ex" encuentra "N's Zoroark ex" y "Zoroark ex de N". Peso 3 = carta principal,
// 2 = su línea evolutiva o pareja, 1 = apoyo típico.

import type { Archetype } from './types';

type SeedArchetype = Omit<Archetype, 'id'>;

const keys = (...cards: Array<[string, number]>) =>
  cards.map(([name, weight]) => ({ name, weight }));

export const META_SEED: SeedArchetype[] = [
  {
    name: 'Dragapult ex',
    keyCards: keys(['Dragapult ex', 3], ['Drakloak', 2], ['Dreepy', 2]),
  },
  {
    name: 'Basic Box (Kangaskhan)',
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
    keyCards: keys(['Zoroark ex', 3], ['Zorua', 2]),
  },
  {
    name: 'Slowking',
    keyCards: keys(['Slowking', 3], ['Slowpoke', 2], ['Kyurem', 1], ['Kangaskhan ex', 1]),
  },
  {
    name: 'Crustle',
    keyCards: keys(['Crustle', 3], ['Dwebble', 2]),
  },
  {
    name: 'Mega Excadrill ex',
    keyCards: keys(['Excadrill ex', 3], ['Drilbur', 2]),
  },
  {
    name: 'Hydrapple ex',
    keyCards: keys(['Hydrapple ex', 3], ['Dipplin', 1], ['Applin', 1]),
  },
  {
    name: 'Festival Lead (Thwackey)',
    keyCards: keys(['Thwackey', 3], ['Grookey', 2], ['Dipplin', 1], ['Seaking', 1]),
  },
  {
    name: 'Alakazam',
    keyCards: keys(['Alakazam', 3], ['Kadabra', 2], ['Abra', 1]),
  },
  {
    name: 'Mega Rayquaza ex',
    keyCards: keys(['Rayquaza ex', 3]),
  },
  {
    name: 'Dhelmise / Banette',
    keyCards: keys(['Dhelmise', 3], ['Banette', 2], ['Shuppet', 1]),
  },
  {
    name: "Rocket's Honchkrow",
    keyCards: keys(['Honchkrow', 3], ['Murkrow', 2]),
  },
  {
    name: 'Mega Lucario ex',
    keyCards: keys(['Lucario ex', 3], ['Riolu', 2]),
  },
  {
    name: 'Talonflame / Dusknoir',
    keyCards: keys(['Talonflame', 3], ['Dusknoir', 3], ['Dusclops', 1], ['Fletchling', 1]),
  },
  {
    name: 'Mega Sharpedo ex',
    keyCards: keys(['Sharpedo ex', 3], ['Carvanha', 2]),
  },
  {
    name: 'Mega Lopunny ex',
    keyCards: keys(['Lopunny ex', 3], ['Buneary', 2]),
  },
  {
    name: "Marnie's Grimmsnarl ex",
    keyCards: keys(['Grimmsnarl ex', 3], ['Morgrem', 2], ['Impidimp', 1]),
  },
  {
    name: "Rocket's Mewtwo ex",
    keyCards: keys(['Mewtwo ex', 3]),
  },
  {
    name: 'Beedrill ex',
    keyCards: keys(['Beedrill ex', 3], ['Kakuna', 2], ['Weedle', 1]),
  },
  {
    name: 'Greninja ex',
    keyCards: keys(['Greninja ex', 3], ['Frogadier', 2], ['Froakie', 1]),
  },
];
