import { buildRoundQuestionsFromMap } from '../../../shared/round-engine.js';
import { genWallets } from './wallets.js';
import { genBills } from './bills.js';
import { genDebt } from './debt.js';
import { genPlusMinus } from './plusminus.js';
import { genFairDeals } from './fairdeals.js';
import { genMarket } from './market.js';

export const GENERATORS_BY_MODE = {
  wallets: genWallets,
  bills: genBills,
  debt: genDebt,
  plusminus: genPlusMinus,
  fairdeals: genFairDeals,
  market: genMarket
};

export const MIX_SCHEDULE = [
  'wallets', 'wallets',
  'debt', 'debt',
  'bills',
  'plusminus',
  'fairdeals',
  'market', 'market',
  'wallets'
];

export function buildRoundQuestions(modeId) {
  return buildRoundQuestionsFromMap({
    modeId,
    generatorsByMode: GENERATORS_BY_MODE,
    mixSchedule: MIX_SCHEDULE,
    fallbackMode: 'wallets'
  });
}

export {
  genWallets,
  genBills,
  genDebt,
  genPlusMinus,
  genFairDeals,
  genMarket
};
