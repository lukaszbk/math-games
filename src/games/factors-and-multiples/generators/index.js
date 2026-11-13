import { buildRoundQuestionsFromMap } from '../../../shared/round-engine.js';
import { genLeftovers } from './leftovers.js';
import { genFactors } from './factors.js';
import { genMultiples } from './multiples.js';
import { genPrimesSquares } from './primes-squares.js';
import { genGcfLcm } from './gcf-lcm.js';
import { genMystery } from './mystery.js';

export const GENERATORS_BY_MODE = {
  leftovers: genLeftovers,
  factors: genFactors,
  multiples: genMultiples,
  primes: genPrimesSquares,
  gcflcm: genGcfLcm,
  mystery: genMystery
};

export const MIX_SCHEDULE = [
  'leftovers', 'leftovers',
  'factors', 'factors',
  'multiples', 'multiples',
  'primes', 'primes',
  'gcflcm',
  'mystery'
];

export function buildRoundQuestions(modeId) {
  return buildRoundQuestionsFromMap({
    modeId,
    generatorsByMode: GENERATORS_BY_MODE,
    mixSchedule: MIX_SCHEDULE,
    fallbackMode: 'factors'
  });
}

export {
  genLeftovers,
  genFactors,
  genMultiples,
  genPrimesSquares,
  genGcfLcm,
  genMystery
};
