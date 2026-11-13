import { FACTORS_AND_MULTIPLES_GAME } from './factors-and-multiples/index.js';
import { ADDITION_SUBTRACTION_GAME } from './addition-subtraction/index.js';

export const GAMES = [
  FACTORS_AND_MULTIPLES_GAME,
  ADDITION_SUBTRACTION_GAME
];

export const GAMES_BY_ID = Object.fromEntries(GAMES.map(g => [g.id, g]));

export function getGameById(id) {
  return GAMES_BY_ID[id] || null;
}
