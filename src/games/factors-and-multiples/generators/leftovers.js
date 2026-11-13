import { randInt, pick, shuffle } from '../../../shared/math.js';

export function genLeftovers() {
  const roll = Math.random();

  // 1A: Quotient & Remainder dual entry (46%)
  if (roll < 0.46) {
    const d = randInt(3, 9);
    const q = randInt(2, 11);
    const hasRem = Math.random() < 0.78;
    const r = hasRem ? randInt(1, d - 1) : 0;
    const N = d * q + r;
    return {
      dedupeKey: `qr_${N}_${d}`,
      domainId: 'leftovers',
      skillKey: 'div_qr',
      skillLabel: 'Quotient & Remainder',
      topicLabel: 'Division & Leftovers',
      inputType: 'quot_rem',
      fluencySeconds: 18,
      prompt: 'Find the quotient and the remainder (enter 0 if there are no leftovers):',
      stageHTML: `
        <div class="equation-hero">
          <span>${N} ÷ ${d} =</span>
          <span id="slot-q" class="answer-slot active" data-action="focus-dual-slot" data-slot="q">?</span>
          <span class="rem-label">R</span>
          <span id="slot-r" class="answer-slot" data-action="focus-dual-slot" data-slot="r">?</span>
        </div>
      `,
      answer: { q, r },
      explanationHTML: `
        <strong>${d} × ${q} = ${d * q}</strong>, and <strong>${N} − ${d * q} = ${r}</strong> left over!<br/>
        So the <strong>quotient is ${q}</strong> and the <strong>remainder is ${r}</strong>.${r === 0 ? ` (${N} is evenly divisible by ${d}!)` : ''}
      `
    };
  }

  // 1B: Precision Vocabulary (dividend, divisor, quotient, remainder) (30%)
  if (roll < 0.76) {
    if (Math.random() < 0.22) {
      const d = randInt(3, 12);
      return {
        dedupeKey: `maxrem_${d}`,
        domainId: 'leftovers',
        skillKey: 'div_rem_rule',
        skillLabel: 'Remainder Upper-Bound Rule',
        topicLabel: 'Leftovers Rule',
        inputType: 'numpad',
        fluencySeconds: 15,
        prompt: `When dividing any whole number by ${d}, what is the GREATEST possible remainder?`,
        stageHTML: `
          <div class="equation-hero">
            <span>? ÷ ${d} → Max R =</span>
            <span id="slot-main" class="answer-slot active">?</span>
          </div>
        `,
        answer: d - 1,
        explanationHTML: `
          Remainders must ALWAYS be smaller than the divisor (<strong>${d}</strong>)! If you had ${d} left over, you could make 1 more full group of ${d}. So the greatest remainder is <strong>${d - 1}</strong>.
        `
      };
    }

    let N, d, q, r;
    for (let tries = 0; tries < 50; tries++) {
      d = randInt(4, 9);
      q = randInt(3, 11);
      r = randInt(1, d - 1);
      N = d * q + r;
      if (new Set([N, d, q, r]).size === 4) break;
    }
    const roles = [
      { key: 'dividend', word: 'DIVIDEND', val: N, meaning: 'the total number being divided up' },
      { key: 'divisor', word: 'DIVISOR', val: d, meaning: 'the number we divide by (group size)' },
      { key: 'quotient', word: 'QUOTIENT', val: q, meaning: 'the whole-number answer before leftovers' },
      { key: 'remainder', word: 'REMAINDER', val: r, meaning: 'the leftover amount that cannot form a full group' }
    ];
    const chosen = pick(roles);
    return {
      dedupeKey: `vocab_${N}_${d}_${chosen.key}`,
      domainId: 'leftovers',
      skillKey: 'div_vocab',
      skillLabel: 'Division Vocabulary',
      topicLabel: 'Division Vocabulary',
      inputType: 'choice',
      fluencySeconds: 14,
      prompt: `In this division equation, which number is the ${chosen.word}?`,
      stageHTML: `
        <div class="equation-hero" style="font-size:clamp(1.7rem,3.3vw,2.35rem);">
          <span>${N} ÷ ${d} = ${q} <span class="rem-label">R ${r}</span></span>
        </div>
      `,
      answer: String(chosen.val),
      choices: shuffle([N, d, q, r]).map(v => ({ id: String(v), label: String(v) })),
      explanationHTML: `
        The <strong>${chosen.word.toLowerCase()}</strong> is ${chosen.meaning}. In <strong>${N} ÷ ${d} = ${q} R ${r}</strong>, the ${chosen.word.toLowerCase()} is <strong>${chosen.val}</strong>!
      `
    };
  }

  // 1C: Divisibility & target remainder quick check (24%)
  const d = randInt(3, 9);
  if (Math.random() < 0.5) {
    const targetMult = d * randInt(3, Math.floor(96 / d));
    const distractors = new Set();
    while (distractors.size < 3) {
      const cand = targetMult + pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]);
      if (cand > d && cand <= 100 && cand % d !== 0) distractors.add(cand);
    }
    const allNums = shuffle([targetMult, ...Array.from(distractors)]);
    return {
      dedupeKey: `divisible_${d}_${targetMult}`,
      domainId: 'leftovers',
      skillKey: 'div_check',
      skillLabel: 'Divisibility Checks',
      topicLabel: 'Divisibility',
      inputType: 'choice',
      fluencySeconds: 15,
      prompt: `Which number is DIVISIBLE by ${d} (leaves 0 remainder)?`,
      stageHTML: `<p style="margin:0; color:var(--ink-700); font-weight:700;">Hint: A number is divisible by ${d} if ${d} divides into it evenly with no leftovers!</p>`,
      answer: String(targetMult),
      choices: allNums.map(v => ({ id: String(v), label: String(v) })),
      explanationHTML: `
        <strong>${targetMult} ÷ ${d} = ${targetMult / d} R 0</strong>! Since there is no remainder, <strong>${targetMult}</strong> is divisible by ${d}.
      `
    };
  }

  const rem = randInt(1, d - 1);
  const q = randInt(3, Math.floor((95 - rem) / d));
  const correctN = d * q + rem;
  const distractors = new Set();
  while (distractors.size < 3) {
    const cand = randInt(d * 2 + 1, 98);
    if (cand % d !== rem) distractors.add(cand);
  }
  const allNums = shuffle([correctN, ...Array.from(distractors)]);
  return {
    dedupeKey: `remfind_${d}_${rem}_${correctN}`,
    domainId: 'leftovers',
    skillKey: 'div_check',
    skillLabel: 'Divisibility & Remainder Detective',
    topicLabel: 'Leftovers Detective',
    inputType: 'choice',
    fluencySeconds: 18,
    prompt: `Which number leaves a REMAINDER of ${rem} when divided by ${d}?`,
    stageHTML: `<p style="margin:0; color:var(--ink-700); font-weight:700;">Look for a multiple of ${d}, plus ${rem} extra!</p>`,
    answer: String(correctN),
    choices: allNums.map(v => ({ id: String(v), label: String(v) })),
    explanationHTML: `
      <strong>${d} × ${q} = ${d * q}</strong>, plus <strong>${rem}</strong> gives <strong>${correctN}</strong>! (${correctN} ÷ ${d} = ${q} R ${rem}).
    `
  };
}
