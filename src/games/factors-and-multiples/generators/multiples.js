import { randInt, pick, shuffle } from '../../../shared/math.js';

const PATTERN_INSIGHTS = [
  {
    key: 'pat_8_4',
    prompt: 'Think about patterns: EVERY multiple of 8 is ALSO a multiple of which number?',
    answer: '4',
    choices: ['3', '4', '5', '6'],
    exp: 'Since <strong>8 = 2 × 4</strong>, every jump of 8 equals two jumps of 4! So every multiple of 8 (8, 16, 24, 32…) is also a multiple of <strong>4</strong>.'
  },
  {
    key: 'pat_9_3',
    prompt: 'EVERY multiple of 9 (9, 18, 27, 36…) is ALSO a multiple of which number?',
    answer: '3',
    choices: ['2', '3', '4', '6'],
    exp: 'Since <strong>9 = 3 × 3</strong>, every multiple of 9 is made of groups of 3! So every multiple of 9 is also a multiple of <strong>3</strong>.'
  },
  {
    key: 'pat_6_both',
    prompt: 'Every multiple of 6 is ALWAYS a multiple of which TWO numbers?',
    answer: '2 and 3',
    choices: ['2 and 3', '2 and 4', '3 and 5', '4 and 5'],
    exp: 'Since <strong>6 = 2 × 3</strong>, every multiple of 6 is even (multiple of 2) AND divisible by 3! Answer: <strong>2 and 3</strong>.'
  },
  {
    key: 'pat_10_both',
    prompt: 'Every multiple of 10 ends in 0, so it is ALWAYS a multiple of both…',
    answer: '2 and 5',
    choices: ['2 and 5', '3 and 5', '4 and 6', '2 and 8'],
    exp: 'Since <strong>10 = 2 × 5</strong>, every multiple of 10 can be split into 2s or 5s evenly! Answer: <strong>2 and 5</strong>.'
  },
  {
    key: 'pat_4_8_rel',
    prompt: 'Compare multiples of 4 (4, 8, 12, 16, 20, 24…) and multiples of 8 (8, 16, 24…). How are they related?',
    answer: 'Every OTHER multiple of 4 is a multiple of 8',
    choices: [
      'Every OTHER multiple of 4 is a multiple of 8',
      'Every multiple of 4 is a multiple of 8',
      'They never share any numbers',
      'Only square numbers are in both lists'
    ],
    exp: 'Multiples of 4 go 4, <strong>8</strong>, 12, <strong>16</strong>, 20, <strong>24</strong>… Because 8 is double 4, <strong>every other multiple of 4 is a multiple of 8</strong>!'
  },
  {
    key: 'pat_inv_84',
    prompt: 'Since 84 is a MULTIPLE of 7 (7 × 12 = 84), that means 7 is a ______ of 84!',
    answer: 'factor',
    choices: ['factor', 'multiple', 'remainder', 'quotient'],
    exp: 'Factors and multiples are partners! Because 84 is a multiple of 7, <strong>7 is a factor of 84</strong>.'
  }
];

export function genMultiples() {
  const roll = Math.random();

  // 3A: Skip-count sequence with missing multiple (36%)
  if (roll < 0.36) {
    const m = randInt(3, 12);
    const startK = randInt(2, Math.max(2, Math.floor(100 / m) - 4));
    const hideIdx = randInt(0, 4);
    const seq = [0, 1, 2, 3, 4].map(i => (startK + i) * m);
    const ans = seq[hideIdx];
    const htmlItems = seq.map((val, idx) =>
      idx === hideIdx
        ? '<span id="slot-main" class="answer-slot active">?</span>'
        : `<span>${val}${idx < 4 ? ',' : ''}</span>`
    ).join(' ');
    return {
      dedupeKey: `mseq_${m}_${startK}_${hideIdx}`,
      domainId: 'multiples',
      skillKey: 'mult_seq',
      skillLabel: 'Skip-Count Sequences',
      topicLabel: 'Multiples Trail',
      inputType: 'numpad',
      fluencySeconds: 15,
      prompt: `Count by multiples of ${m} to fill in the missing number:`,
      stageHTML: `<div class="equation-hero" style="font-size:clamp(1.55rem,3vw,2.2rem);">${htmlItems}</div>`,
      answer: ans,
      explanationHTML: `
        Counting by <strong>${m}s</strong>: ${seq.join(', ')}! Each number increases by ${m}, so the missing multiple is <strong>${ans}</strong>.
      `
    };
  }

  // 3B: Bounded multiple (greater than / less than) (34%)
  if (roll < 0.70) {
    const m = randInt(4, 11);
    const isGreater = Math.random() < 0.55;
    if (isGreater) {
      const k = randInt(4, Math.floor(92 / m));
      const ans = k * m;
      const bound = ans - randInt(1, m - 1);
      return {
        dedupeKey: `mgt_${m}_${bound}`,
        domainId: 'multiples',
        skillKey: 'mult_bound',
        skillLabel: 'Bounded Multiples',
        topicLabel: 'Multiples Range',
        inputType: 'numpad',
        fluencySeconds: 17,
        prompt: `What is the SMALLEST multiple of ${m} that is GREATER than ${bound}?`,
        stageHTML: `
          <div class="equation-hero">
            <span>&gt; ${bound} →</span>
            <span id="slot-main" class="answer-slot active">?</span>
          </div>
        `,
        answer: ans,
        explanationHTML: `
          <strong>${m} × ${k - 1} = ${(k - 1) * m}</strong> (too small) and <strong>${m} × ${k} = ${ans}</strong>! So the first multiple of ${m} greater than ${bound} is <strong>${ans}</strong>.
        `
      };
    }

    const k = randInt(4, Math.floor(92 / m));
    const ans = k * m;
    const bound = ans + randInt(1, m - 1);
    return {
      dedupeKey: `mlt_${m}_${bound}`,
      domainId: 'multiples',
      skillKey: 'mult_bound',
      skillLabel: 'Bounded Multiples',
      topicLabel: 'Multiples Range',
      inputType: 'numpad',
      fluencySeconds: 17,
      prompt: `What is the GREATEST multiple of ${m} that is LESS than ${bound}?`,
      stageHTML: `
        <div class="equation-hero">
          <span>&lt; ${bound} →</span>
          <span id="slot-main" class="answer-slot active">?</span>
        </div>
      `,
      answer: ans,
      explanationHTML: `
        <strong>${m} × ${k} = ${ans}</strong>, while the next multiple (${(k + 1) * m}) is past ${bound}. So the greatest multiple of ${m} less than ${bound} is <strong>${ans}</strong>!
      `
    };
  }

  // 3C: Pattern insight OR recognize large multiple up to 100 (30%)
  if (Math.random() < 0.5) {
    const item = pick(PATTERN_INSIGHTS);
    return {
      dedupeKey: item.key,
      domainId: 'multiples',
      skillKey: 'mult_pattern',
      skillLabel: 'Multiple Relationships & Patterns',
      topicLabel: 'Multiple Patterns',
      inputType: 'choice',
      fluencySeconds: 18,
      prompt: item.prompt,
      stageHTML: '',
      answer: item.answer,
      choices: shuffle(item.choices).map(c => ({ id: c, label: c })),
      explanationHTML: item.exp
    };
  }

  const m = randInt(4, 9);
  const k = randInt(6, Math.floor(99 / m));
  const ans = m * k;
  const distractors = new Set();
  while (distractors.size < 3) {
    const cand = ans + pick([-6, -4, -3, -2, 2, 3, 4, 6]);
    if (cand > 12 && cand <= 100 && cand % m !== 0) distractors.add(cand);
  }
  const opts = shuffle([ans, ...Array.from(distractors)]);
  return {
    dedupeKey: `mrec_${m}_${ans}`,
    domainId: 'multiples',
    skillKey: 'mult_spot',
    skillLabel: 'Recognizing Multiples',
    topicLabel: 'Spot the Multiple',
    inputType: 'choice',
    fluencySeconds: 16,
    prompt: `Which of these numbers IS a multiple of ${m}?`,
    stageHTML: `<p style="margin:0; font-size:0.88rem; color:var(--ink-700); font-weight:700;">Tip: Split bigger numbers into friendly chunks (like ${m * 10} + …)!</p>`,
    answer: String(ans),
    choices: opts.map(v => ({ id: String(v), label: String(v) })),
    explanationHTML: `
      <strong>${m} × ${k} = ${ans}</strong>, so <strong>${ans}</strong> is a multiple of ${m}!
    `
  };
}
