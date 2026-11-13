import { shuffle } from './math.js';
import { stripHtml } from './dom.js';

export function buildRoundQuestionsFromMap({ modeId, generatorsByMode, mixSchedule, fallbackMode }) {
  const round = [];
  const seen = new Set();

  if (modeId === 'mix') {
    const schedule = shuffle(mixSchedule);
    for (const m of schedule) {
      const gen = generatorsByMode[m];
      let q = gen();
      for (let t = 0; t < 25 && seen.has(q.dedupeKey); t++) {
        q = gen();
      }
      seen.add(q.dedupeKey);
      round.push(q);
    }
    return round;
  }

  const gen = generatorsByMode[modeId] || generatorsByMode[fallbackMode];
  while (round.length < 10) {
    let q = gen();
    for (let t = 0; t < 30 && seen.has(q.dedupeKey); t++) {
      q = gen();
    }
    seen.add(q.dedupeKey);
    round.push(q);
  }
  return round;
}

export function createRoundState(modeId, questions) {
  const firstType = questions && questions[0] ? questions[0].inputType : 'numpad';
  return {
    modeId,
    questions,
    index: 0,
    results: new Array(10).fill(null), // 'perfect' | 'solved'
    missedCurrent: false,
    usedPeekCurrent: false,
    withinFluency: true,
    fastCount: 0,
    lockedTransition: false,
    numBuf: '',
    qBuf: '',
    rBuf: '',
    aBuf: '',
    bBuf: '',
    activeSlot: firstType === 'step_pair' ? 'a' : 'q',
    multiSelected: new Set(),
    sieveOpen: false,
    sieveCrossed: new Set(),
    tenFrameOpen: false,
    tenFrameCells: new Array(20).fill(0)
  };
}

export function formatCorrectAnswer(q) {
  if (!q) return '';
  if (q.inputType === 'quot_rem' && q.answer && typeof q.answer === 'object') {
    return `${q.answer.q} R ${q.answer.r}`;
  }
  if (q.inputType === 'step_pair' && q.answer && typeof q.answer === 'object') {
    return `${q.answer.a}, ${q.answer.b}`;
  }
  if (Array.isArray(q.answer)) {
    return q.answer.join(', ');
  }
  return String(q.answer);
}

export function buildMistakePromptText(q) {
  const base = stripHtml(q.prompt);
  if (!q.stageHTML) return base;
  if (q.skillKey === 'div_qr' || q.skillKey === 'fac_pair' || q.skillKey === 'prime_tree') {
    const eq = stripHtml(q.stageHTML).replace(/\s*\?\s*/g, ' ? ').replace(/\s+/g, ' ').trim();
    return eq ? `${base} (${eq})` : base;
  }
  if (q.domainId === 'mystery') {
    const clues = stripHtml(q.stageHTML).replace(/I am:\s*\?/g, '').trim();
    return clues ? `${base} [${clues}]` : base;
  }
  const stageClean = stripHtml(q.stageHTML);
  if (stageClean && stageClean.length <= 60 && !base.includes(stageClean)) {
    return `${base} (${stageClean})`;
  }
  return base;
}

export function recordMistakeInSave(gameSave, roundState, q, now = Date.now()) {
  if (!q) return;
  gameSave.recentMistakes.unshift({
    ts: now,
    modeId: roundState.modeId,
    domainId: q.domainId || roundState.modeId,
    skillLabel: q.skillLabel || q.topicLabel,
    promptText: buildMistakePromptText(q),
    correctText: formatCorrectAnswer(q)
  });
  if (gameSave.recentMistakes.length > 25) {
    gameSave.recentMistakes.length = 25;
  }
}

export function recordSkillAttemptInSave(gameSave, roundState, q, firstTry) {
  if (!q || !q.skillKey) return;
  if (!gameSave.skillStats[q.skillKey]) {
    gameSave.skillStats[q.skillKey] = {
      label: q.skillLabel || q.topicLabel || q.skillKey,
      domainId: q.domainId || roundState.modeId,
      attempts: 0,
      firstTry: 0,
      fast: 0
    };
  }
  const sk = gameSave.skillStats[q.skillKey];
  sk.label = q.skillLabel || q.topicLabel || sk.label;
  sk.domainId = q.domainId || sk.domainId;
  sk.attempts += 1;
  if (firstTry) sk.firstTry += 1;
  if (firstTry && roundState.withinFluency) sk.fast += 1;
}
