import { randInt, pick, shuffle, getFactors, getFactorPairs, isPrime, primeFactorList } from '../../../shared/math.js';

export function genPrimesSquares() {
  const roll = Math.random();

  // 4A: Prime / Composite / Neither (1–100) (42%)
  if (roll < 0.42) {
    const trickyPool = [
      1, 2, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29,
      31, 33, 35, 37, 39, 41, 43, 47, 49, 51, 53, 57, 59, 61, 63,
      67, 71, 73, 77, 81, 83, 87, 89, 91, 93, 97
    ];
    const N = pick(trickyPool);
    const ans = N === 1 ? 'Neither' : (isPrime(N) ? 'Prime' : 'Composite');
    const factors = getFactors(N);
    let exp = '';
    if (N === 1) {
      exp = '<strong>1</strong> has only <strong>ONE factor</strong> (just 1)! Prime numbers must have <em>exactly 2</em> factors, and composite numbers have <em>3 or more</em>, so <strong>1 is Neither</strong>!';
    } else if (N === 2) {
      exp = '<strong>2</strong> has only two factors (1 and 2) — it is the <strong>ONLY even prime number</strong>!';
    } else if (ans === 'Prime') {
      exp = `<strong>${N}</strong> has only <strong>2 factors</strong> (1 and ${N}), so <strong>${N} is Prime</strong>!`;
    } else {
      const pair = getFactorPairs(N)[1];
      exp = `<strong>${N} = ${pair[0]} × ${pair[1]}</strong>! Its factors are ${factors.join(', ')} (${factors.length} factors), so <strong>${N} is Composite</strong>!`;
    }
    return {
      dedupeKey: `pc_${N}`,
      domainId: 'primes',
      skillKey: 'prime_class',
      skillLabel: 'Prime vs. Composite',
      topicLabel: 'Prime vs. Composite (1–100)',
      inputType: 'choice',
      fluencySeconds: 15,
      prompt: `Classify the number ${N}:`,
      stageHTML: `<div class="equation-hero" style="font-size:2.8rem; color:var(--jade-700);">${N}</div>`,
      answer: ans,
      choices: [
        { id: 'Prime', label: 'Prime', sub: 'Exactly 2 factors' },
        { id: 'Composite', label: 'Composite', sub: '3 or more factors' },
        { id: 'Neither', label: 'Neither', sub: 'Only 1 factor' }
      ],
      explanationHTML: exp
    };
  }

  // 4B: Square Numbers 1–100 (28%)
  if (roll < 0.70) {
    if (Math.random() < 0.55) {
      const k = randInt(1, 9);
      const curSq = k * k;
      const nextSq = (k + 1) * (k + 1);
      return {
        dedupeKey: `nextsq_${k}`,
        domainId: 'primes',
        skillKey: 'square_num',
        skillLabel: 'Square Numbers',
        topicLabel: 'Square Numbers',
        inputType: 'numpad',
        fluencySeconds: 15,
        prompt: `${curSq} is a square number (${k} × ${k}). What is the NEXT square number after ${curSq}?`,
        stageHTML: `
          <div class="equation-hero">
            <span>${curSq} →</span>
            <span id="slot-main" class="answer-slot active">?</span>
          </div>
        `,
        answer: nextSq,
        explanationHTML: `
          After ${k} × ${k} = ${curSq} comes <strong>${k + 1} × ${k + 1} = ${nextSq}</strong>! Square numbers up to 100: 1, 4, 9, 16, 25, 36, 49, 64, 81, 100.
        `
      };
    }

    const sqRoot = randInt(2, 10);
    const sqVal = sqRoot * sqRoot;
    const nonSquares = [8, 12, 18, 20, 24, 27, 32, 40, 45, 48, 50, 54, 63, 72, 80, 90];
    const threeNon = shuffle(nonSquares).slice(0, 3);
    const opts = shuffle([sqVal, ...threeNon]);
    return {
      dedupeKey: `picksq_${sqVal}`,
      domainId: 'primes',
      skillKey: 'square_num',
      skillLabel: 'Square Numbers',
      topicLabel: 'Square Numbers',
      inputType: 'choice',
      fluencySeconds: 14,
      prompt: 'Which of these numbers is a SQUARE NUMBER?',
      stageHTML: `<p style="margin:0; font-size:0.88rem; color:var(--ink-700); font-weight:700;">A square number equals a whole number multiplied by itself!</p>`,
      answer: String(sqVal),
      choices: opts.map(v => ({ id: String(v), label: String(v) })),
      explanationHTML: `
        <strong>${sqVal} = ${sqRoot} × ${sqRoot}</strong>, making a ${sqRoot}-by-${sqRoot} square! So <strong>${sqVal}</strong> is a square number.
      `
    };
  }

  // 4C: Visual Prime Factorization Tree (30%)
  const treeNumbers = [12, 18, 20, 24, 27, 28, 30, 36, 40, 42, 45, 48, 50, 54, 56, 60, 63, 70, 72, 75];
  const N = pick(treeNumbers);
  const pairs = getFactorPairs(N).filter(p => p[0] > 1);
  const [branchA, branchB] = pick(pairs);
  const primes = primeFactorList(N);
  const hideIdx = randInt(0, primes.length - 1);
  const missingPrime = primes[hideIdx];

  const leavesHTML = primes.map((p, idx) =>
    idx === hideIdx
      ? '<span id="slot-main" class="answer-slot active" style="min-width:54px; height:48px; font-size:1.45rem;">?</span>'
      : `<span class="tree-node prime">${p}</span>`
  ).join(' <span>×</span> ');

  return {
    dedupeKey: `ptree_${N}_${hideIdx}`,
    domainId: 'primes',
    skillKey: 'prime_tree',
    skillLabel: 'Prime Factorization Trees',
    topicLabel: 'Prime Factorization Tree',
    inputType: 'numpad',
    fluencySeconds: 20,
    prompt: `Enter the missing PRIME factor so the bottom row multiplies to ${N}:`,
    stageHTML: `
      <div class="factor-tree-box">
        <div class="tree-row"><span class="tree-node root">${N}</span></div>
        <div style="font-size:0.82rem; color:var(--ink-500); font-weight:800;">↙ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ↘</div>
        <div class="tree-row">
          <span class="tree-node ${isPrime(branchA) ? 'prime' : ''}">${branchA}</span>
          <span>×</span>
          <span class="tree-node ${isPrime(branchB) ? 'prime' : ''}">${branchB}</span>
        </div>
        <div style="font-size:0.8rem; color:var(--ink-500); font-weight:800;">↓ Prime Factors ↓</div>
        <div class="tree-row" style="flex-wrap:wrap; justify-content:center;">${leavesHTML}</div>
      </div>
    `,
    answer: missingPrime,
    explanationHTML: `
      The prime factorization of <strong>${N}</strong> is <strong>${primes.join(' × ')} = ${N}</strong>! The missing prime number is <strong>${missingPrime}</strong>.
    `
  };
}
