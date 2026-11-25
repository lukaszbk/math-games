import { buildRoundQuestionsFromMap } from '../../../shared/round-engine.js';
import { genCubeStacks } from './cube-stacks.js';
import { genLayerSlices } from './layer-slices.js';
import { genBoxBuilder } from './box-builder.js';
import { genTwinTowers } from './twin-towers.js';
import { genTankRivals } from './tank-rivals.js';
import { genPotionBeakers } from './potion-beakers.js';

export const GENERATORS_BY_MODE = {
  'cube-stacks': genCubeStacks,
  'layer-slices': genLayerSlices,
  'box-builder': genBoxBuilder,
  'twin-towers': genTwinTowers,
  'tank-rivals': genTankRivals,
  'potion-beakers': genPotionBeakers
};

export const MIX_SCHEDULE = [
  'cube-stacks', 'cube-stacks',
  'layer-slices', 'layer-slices',
  'box-builder', 'box-builder',
  'twin-towers',
  'tank-rivals',
  'potion-beakers', 'potion-beakers'
];

export function buildRoundQuestions(modeId) {
  return buildRoundQuestionsFromMap({
    modeId,
    generatorsByMode: GENERATORS_BY_MODE,
    mixSchedule: MIX_SCHEDULE,
    fallbackMode: 'cube-stacks'
  });
}

export {
  genCubeStacks,
  genLayerSlices,
  genBoxBuilder,
  genTwinTowers,
  genTankRivals,
  genPotionBeakers
};
