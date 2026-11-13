import { buildRoundQuestionsFromMap } from '../../../shared/round-engine.js';
import { genPartners10 } from './partners-10.js';
import { genMake10Add } from './make-10-add.js';
import { genMake10Sub } from './make-10-sub.js';
import { genDoubles20 } from './doubles-20.js';
import { genWithin10 } from './within-10.js';
import { genFactFamilies } from './fact-families.js';

export const GENERATORS_BY_MODE = {
  partners10: genPartners10,
  make10add: genMake10Add,
  make10sub: genMake10Sub,
  doubles20: genDoubles20,
  within10: genWithin10,
  factfamilies: genFactFamilies
};

export const MIX_SCHEDULE = [
  'make10add', 'make10add',
  'make10sub', 'make10sub',
  'partners10', 'partners10',
  'within10', 'within10',
  'doubles20',
  'factfamilies'
];

export function buildRoundQuestions(modeId) {
  return buildRoundQuestionsFromMap({
    modeId,
    generatorsByMode: GENERATORS_BY_MODE,
    mixSchedule: MIX_SCHEDULE,
    fallbackMode: 'make10add'
  });
}

export {
  genPartners10,
  genMake10Add,
  genMake10Sub,
  genDoubles20,
  genWithin10,
  genFactFamilies
};
