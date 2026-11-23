import { FACTORS_AND_MULTIPLES_GAME } from './factors-and-multiples/index.js';
import { MULTIPLICATION_FACTS_GAME } from './multiplication-facts/index.js';
import { MONEY_MATCH_GAME } from './money-match/index.js';
import { SUPERKITTIES_SHAPES_GAME } from './superkitties-shapes/index.js';
import { ADDITION_SUBTRACTION_GAME } from './addition-subtraction/index.js';
import { HUNDREDS_CHART_GAME } from './hundreds-chart/index.js';

export const GAMES = [
  FACTORS_AND_MULTIPLES_GAME,
  MULTIPLICATION_FACTS_GAME,
  MONEY_MATCH_GAME,
  SUPERKITTIES_SHAPES_GAME,
  ADDITION_SUBTRACTION_GAME,
  HUNDREDS_CHART_GAME
];

export const GAMES_BY_ID = Object.fromEntries(GAMES.map(g => [g.id, g]));

export function getGameById(id) {
  return GAMES_BY_ID[id] || null;
}
