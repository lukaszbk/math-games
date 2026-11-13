import { randInt, shuffle, isPrime, isSquare } from '../../../shared/math.js';

export function genMystery() {
  for (let attempt = 0; attempt < 80; attempt++) {
    const target = randInt(4, 98);
    const span = randInt(16, 28);
    const low = Math.max(1, target - randInt(4, span - 4));
    const high = Math.min(100, low + span);
    if (target <= low || target >= high) continue;

    const clues = [];
    const predicates = [];

    clues.push(`My number is greater than ${low} and less than ${high}.`);
    predicates.push(n => n > low && n < high);

    const propPool = [];

    if (isSquare(target)) {
      propPool.push({
        prio: 1,
        text: 'I am a square number.',
        fn: n => isSquare(n)
      });
    }
    if (isPrime(target)) {
      propPool.push({
        prio: 1,
        text: 'I am a prime number.',
        fn: n => isPrime(n)
      });
    } else {
      propPool.push({
        prio: 3,
        text: 'I am a composite number.',
        fn: n => n > 1 && !isPrime(n)
      });
    }

    for (const m of [3, 4, 5, 6, 7, 8, 9, 11, 12]) {
      if (target % m === 0 && target !== m) {
        propPool.push({
          prio: 1,
          text: `I am a multiple of ${m}.`,
          fn: n => n % m === 0
        });
      }
    }

    for (const big of [36, 48, 60, 72, 80, 90, 96, 100]) {
      if (big % target === 0 && target < big) {
        propPool.push({
          prio: 1,
          text: `I am a factor of ${big}.`,
          fn: n => big % n === 0
        });
      }
    }

    for (const d of [4, 5, 6, 7, 8, 9, 10]) {
      const rem = target % d;
      if (rem > 0) {
        propPool.push({
          prio: 2,
          text: `When you divide me by ${d}, the remainder is ${rem}.`,
          fn: n => n % d === rem
        });
      }
    }

    const digitSum = String(target).split('').reduce((s, c) => s + Number(c), 0);
    propPool.push({
      prio: 3,
      text: `My digits add up to ${digitSum}.`,
      fn: n => String(n).split('').reduce((s, c) => s + Number(c), 0) === digitSum
    });

    propPool.push({
      prio: 4,
      text: target % 2 === 0 ? 'I am an even number.' : 'I am an odd number.',
      fn: n => (n % 2) === (target % 2)
    });

    const ordered = shuffle(propPool).sort((a, b) => a.prio - b.prio);

    let candidates = [];
    for (let i = 1; i <= 100; i++) {
      if (predicates.every(fn => fn(i))) candidates.push(i);
    }

    for (const prop of ordered) {
      if (candidates.length === 1) break;
      if (clues.length >= 4) break;
      const narrowed = candidates.filter(prop.fn);
      if (narrowed.length < candidates.length && narrowed.length >= 1) {
        clues.push(prop.text);
        predicates.push(prop.fn);
        candidates = narrowed;
      }
    }

    if (candidates.length === 1 && candidates[0] === target && clues.length >= 3) {
      const clueItems = clues.map(c => `<li>🔎 ${c}</li>`).join('');
      return {
        dedupeKey: `myst_${target}_${low}_${high}`,
        domainId: 'mystery',
        skillKey: 'mystery_clues',
        skillLabel: 'Mystery Number Deduction',
        topicLabel: 'Mystery Number (1–100)',
        inputType: 'numpad',
        fluencySeconds: 26,
        enableSieve: true,
        prompt: 'Read all the clues — what Mystery Number am I?',
        stageHTML: `
          <ul class="clue-list">${clueItems}</ul>
          <div class="equation-hero" style="font-size:1.75rem; margin-top:2px;">
            <span>I am:</span>
            <span id="slot-main" class="answer-slot active">?</span>
          </div>
        `,
        answer: target,
        predicates,
        explanationHTML: `
          Every clue matches <strong>${target}</strong>! (${clues.join(' ')}) → Mystery Number = <strong>${target}</strong>!
        `
      };
    }
  }

  return {
    dedupeKey: 'myst_fallback_36',
    domainId: 'mystery',
    skillKey: 'mystery_clues',
    skillLabel: 'Mystery Number Deduction',
    topicLabel: 'Mystery Number (1–100)',
    inputType: 'numpad',
    fluencySeconds: 24,
    enableSieve: true,
    prompt: 'Read all the clues — what Mystery Number am I?',
    stageHTML: `
      <ul class="clue-list">
        <li>🔎 My number is greater than 20 and less than 40.</li>
        <li>🔎 I am a multiple of 6.</li>
        <li>🔎 I am a square number.</li>
      </ul>
      <div class="equation-hero" style="font-size:1.75rem;">
        <span>I am:</span>
        <span id="slot-main" class="answer-slot active">?</span>
      </div>
    `,
    answer: 36,
    predicates: [n => n > 20 && n < 40, n => n % 6 === 0, n => isSquare(n)],
    explanationHTML: 'Multiples of 6 between 20 and 40 are 24, 30, and 36 — and <strong>36 = 6 × 6</strong> is a square number!'
  };
}
