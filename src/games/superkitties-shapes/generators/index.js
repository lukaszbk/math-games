import { shuffle } from '../../../shared/math.js';
import { buildRoundQuestionsFromMap } from '../../../shared/round-engine.js';
import { genTileRooms } from './tile-rooms.js';
import { genFencePatrol } from './fence-patrol.js';
import { genLBlueprints } from './l-blueprints.js';
import { genMysterySides } from './mystery-sides.js';
import { genRoomRivals } from './room-rivals.js';
import { genShapeAcademy } from './shape-academy.js';

export const GENERATORS_BY_MODE = {
  'tile-rooms': genTileRooms,
  'fence-patrol': genFencePatrol,
  'l-blueprints': genLBlueprints,
  'mystery-sides': genMysterySides,
  'room-rivals': genRoomRivals,
  'shape-academy': genShapeAcademy
};

export const MIX_SCHEDULE = [
  'tile-rooms', 'tile-rooms',
  'fence-patrol', 'fence-patrol',
  'l-blueprints', 'l-blueprints',
  'mystery-sides',
  'room-rivals',
  'shape-academy', 'shape-academy'
];

function shapeCapFor(focusShape) {
  return focusShape === 'multi_shields' ? 2 : 1;
}

function fitsRoundConstraints(q, seen, shapeCounts) {
  if (!q || seen.has(q.dedupeKey)) return false;
  if (q.focusShape) {
    const used = shapeCounts.get(q.focusShape) || 0;
    if (used >= shapeCapFor(q.focusShape)) return false;
  }
  return true;
}

function recordAccepted(q, seen, shapeCounts) {
  seen.add(q.dedupeKey);
  if (q.focusShape) {
    shapeCounts.set(q.focusShape, (shapeCounts.get(q.focusShape) || 0) + 1);
  }
}

export function buildRoundQuestions(modeId) {
  if (modeId === 'shape-academy') {
    const round = [];
    const seen = new Set();
    const shapeCounts = new Map();
    while (round.length < 10) {
      let q = genShapeAcademy();
      for (let t = 0; t < 150 && !fitsRoundConstraints(q, seen, shapeCounts); t++) {
        q = genShapeAcademy();
      }
      recordAccepted(q, seen, shapeCounts);
      round.push(q);
    }
    return round;
  }

  if (modeId === 'mix') {
    const round = [];
    const seen = new Set();
    const shapeCounts = new Map();
    const schedule = shuffle(MIX_SCHEDULE);
    for (const m of schedule) {
      const gen = GENERATORS_BY_MODE[m] || genTileRooms;
      let q = gen();
      for (let t = 0; t < 80 && !fitsRoundConstraints(q, seen, shapeCounts); t++) {
        q = gen();
      }
      recordAccepted(q, seen, shapeCounts);
      round.push(q);
    }
    return round;
  }

  return buildRoundQuestionsFromMap({
    modeId,
    generatorsByMode: GENERATORS_BY_MODE,
    mixSchedule: MIX_SCHEDULE,
    fallbackMode: 'tile-rooms'
  });
}

export {
  genTileRooms,
  genFencePatrol,
  genLBlueprints,
  genMysterySides,
  genRoomRivals,
  genShapeAcademy
};
