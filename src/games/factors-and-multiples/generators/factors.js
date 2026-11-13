import { pick, shuffle, getFactors, getFactorPairs } from '../../../shared/math.js';

export function genFactors() {
  const roll = Math.random();
  const richComposites = [12, 16, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48, 50, 54, 56, 60, 63, 64, 70, 72, 75, 80, 84, 90, 96, 100];

  // 2A: Missing partner in a factor pair (42%)
  if (roll < 0.42) {
    const N = pick(richComposites);
    const pairs = getFactorPairs(N).filter(p => p[0] >= 2);
    const [a, b] = pick(pairs);
    const hideFirst = Math.random() < 0.5;
    const ans = hideFirst ? a : b;
    const shown = hideFirst ? b : a;
    const allPairsStr = getFactorPairs(N).map(p => `${p[0]}×${p[1]}`).join(', ');
    return {
      dedupeKey: `fpair_${N}_${shown}`,
      domainId: 'factors',
      skillKey: 'fac_pair',
      skillLabel: 'Factor Pairs',
      topicLabel: 'Factor Pairs (1–100)',
      inputType: 'numpad',
      fluencySeconds: 16,
      prompt: `Complete this factor pair for ${N}:`,
      stageHTML: `
        <div class="equation-hero">
          ${hideFirst
            ? `<span id="slot-main" class="answer-slot active">?</span> <span>× ${b} = ${N}</span>`
            : `<span>${a} ×</span> <span id="slot-main" class="answer-slot active">?</span> <span>= ${N}</span>`
          }
        </div>
      `,
      answer: ans,
      explanationHTML: `
        <strong>${a} × ${b} = ${N}</strong>, so the missing factor is <strong>${ans}</strong>!<br/>
        <small>All factor pairs of ${N}: ${allPairsStr}</small>
      `
    };
  }

  // 2B: Multi-select ALL factors from 8 chips (30%)
  if (roll < 0.72) {
    const pool = [12, 15, 16, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48, 50];
    const N = pick(pool);
    const trueFactors = getFactors(N);
    const chosenTrue = shuffle(trueFactors).slice(0, Math.min(4, trueFactors.length));
    const nonFactors = [];
    for (let k = 2; k < N; k++) {
      if (N % k !== 0) nonFactors.push(k);
    }
    const chosenFalse = shuffle(nonFactors).slice(0, 8 - chosenTrue.length);
    const chips = [...chosenTrue, ...chosenFalse].sort((x, y) => x - y);
    const expected = chosenTrue.slice().sort((x, y) => x - y);
    return {
      dedupeKey: `fmulti_${N}_${expected.join('_')}`,
      domainId: 'factors',
      skillKey: 'fac_all',
      skillLabel: 'Finding All Factors',
      topicLabel: 'Factor Hunter',
      inputType: 'multiselect',
      fluencySeconds: 22,
      prompt: `Tap ALL numbers below that are FACTORS of ${N}, then press Check!`,
      stageHTML: `
        <div class="equation-hero" style="font-size:2.1rem;">Target Number: <span style="color:var(--jade-700);">${N}</span></div>
        <p style="margin:0; font-size:0.88rem; color:var(--ink-700); font-weight:700;">Tip: A number is a factor of ${N} if it divides into ${N} with 0 remainder!</p>
      `,
      answer: expected,
      choices: chips,
      explanationHTML: `
        From those choices, the factors of <strong>${N}</strong> are <strong>${expected.join(', ')}</strong>!<br/>
        <small>Complete factor list of ${N}: ${trueFactors.join(', ')}</small>
      `
    };
  }

  // 2C: Spot the non-factor OR count total factors (28%)
  if (Math.random() < 0.62) {
    const N = pick([18, 24, 28, 30, 32, 36, 40, 42, 45, 48, 54, 56, 60, 72]);
    const trueFactors = getFactors(N).filter(f => f > 1 && f < N);
    const threeTrue = shuffle(trueFactors).slice(0, 3);
    const nonFactorPool = [];
    for (let c = 2; c <= Math.min(20, N - 1); c++) {
      if (N % c !== 0) nonFactorPool.push(c);
    }
    const impostor = pick(nonFactorPool);
    const opts = shuffle([impostor, ...threeTrue]);
    return {
      dedupeKey: `notfactor_${N}_${impostor}`,
      domainId: 'factors',
      skillKey: 'fac_impostor',
      skillLabel: 'Spotting Non-Factors',
      topicLabel: 'Spot the Impostor',
      inputType: 'choice',
      fluencySeconds: 15,
      prompt: `Three of these are factors of ${N}. Tap the one that is NOT a factor of ${N}!`,
      stageHTML: `<div class="equation-hero" style="font-size:2.1rem;">Target: ${N}</div>`,
      answer: String(impostor),
      choices: opts.map(v => ({ id: String(v), label: String(v) })),
      explanationHTML: `
        <strong>${N} ÷ ${impostor}</strong> leaves a remainder of <strong>${N % impostor}</strong>, so <strong>${impostor}</strong> is NOT a factor of ${N}!
      `
    };
  }

  const countPool = [9, 12, 15, 16, 18, 20, 24, 25, 28, 36];
  const N = pick(countPool);
  const factors = getFactors(N);
  const pairs = getFactorPairs(N);
  return {
    dedupeKey: `fcount_${N}`,
    domainId: 'factors',
    skillKey: 'fac_count',
    skillLabel: 'Counting Total Factors',
    topicLabel: 'Counting Factors',
    inputType: 'numpad',
    fluencySeconds: 20,
    prompt: `How many total FACTORS does ${N} have (from 1 up to ${N})?`,
    stageHTML: `
      <div class="equation-hero">
        <span>Factors of ${N}:</span>
        <span id="slot-main" class="answer-slot active">?</span>
      </div>
      <p style="margin:0; font-size:0.86rem; color:var(--ink-700); font-weight:700;">Count in factor pairs starting at 1 × ${N}!</p>
    `,
    answer: factors.length,
    explanationHTML: `
      Factor pairs of ${N}: <strong>${pairs.map(p => `${p[0]}×${p[1]}`).join(', ')}</strong>.<br/>
      Listing each factor once (${factors.join(', ')}) gives <strong>${factors.length}</strong> factors!
    `
  };
}
