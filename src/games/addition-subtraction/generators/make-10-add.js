import { randInt, shuffle } from '../../../shared/math.js';
import { buildMakeTenAddBondHTML, buildMakeTenCounterSlideHTML } from '../../../shared/manipulatives.js';

function pickBridgePair() {
  const a = randInt(7, 9);
  const b = randInt(11 - a, 9);
  return {
    a,
    b,
    total: a + b,
    toTen: 10 - a,
    leftover: a + b - 10
  };
}

export function genMake10Add() {
  const roll = Math.random();
  const { a, b, total, toTen, leftover } = pickBridgePair();

  // 2A: Guided 2-step Make a Ten to Add (38%)
  if (roll < 0.38) {
    return {
      dedupeKey: `m10a_steps_${a}_${b}`,
      domainId: 'make10add',
      skillKey: 'make10_add_steps',
      skillLabel: 'Make a Ten to Add (2-Step)',
      topicLabel: 'Make a Ten to Add',
      inputType: 'step_pair',
      slotLabels: { a: 'Step 1 (10 + ?)', b: 'Step 2 (Answer)' },
      fluencySeconds: 28,
      prompt: `Use the counter slide & bond to make 10 first, then solve ${a} + ${b}:`,
      stageHTML: `
        <div class="iready-visual-stack">
          <div class="iready-visual-row">
            ${buildMakeTenCounterSlideHTML(a, b)}
            ${buildMakeTenAddBondHTML({ a, b, partToTen: toTen, leftoverPart: leftover })}
          </div>
          <div class="step-equations-box">
            <div class="step-eq-line">
              <span class="step-eq-tag">Step 1</span>
              <span>${a} + ${b} = 10 +</span>
              <span id="slot-a" class="answer-slot active" data-action="focus-dual-slot" data-slot="a">?</span>
            </div>
            <div class="step-eq-line">
              <span class="step-eq-tag">Step 2</span>
              <span>10 + ${leftover} =</span>
              <span id="slot-b" class="answer-slot" data-action="focus-dual-slot" data-slot="b">?</span>
            </div>
          </div>
        </div>
      `,
      helperText: `Slide ${toTen} from ${b} to turn ${a} into 10, leaving ${leftover} outside. So ${a} + ${b} = 10 + ${leftover} = ${total}!`,
      answer: { a: leftover, b: total },
      explanationHTML: `
        Break <strong>${b}</strong> into <strong>${toTen} + ${leftover}</strong>! First <strong>${a} + ${toTen} = 10</strong>, so ${a} + ${b} is the same as <strong>10 + ${leftover}</strong>, which equals <strong>${total}</strong>!
      `
    };
  }

  // 2B: Break Apart Partner (24%)
  if (roll < 0.62) {
    return {
      dedupeKey: `m10a_split_${a}_${b}`,
      domainId: 'make10add',
      skillKey: 'make10_add_split',
      skillLabel: 'Break Apart to Make 10',
      topicLabel: 'Break Apart Partner',
      inputType: 'numpad',
      fluencySeconds: 20,
      prompt: `Break apart ${b} so ${a} can make a 10! What goes in the ? box?`,
      stageHTML: `
        <div class="iready-visual-stack">
          ${buildMakeTenAddBondHTML({ a, b, partToTen: toTen, leftoverPart: leftover, hidePart: 'left' })}
          <div class="equation-hero">
            <span>${a} +</span>
            <span id="slot-main" class="answer-slot active">?</span>
            <span>= 10</span>
          </div>
        </div>
      `,
      helperText: `Ask yourself: ${a} plus WHAT makes 10?`,
      answer: toTen,
      explanationHTML: `
        <strong>${a} + ${toTen} = 10</strong>! Splitting ${b} into <strong>${toTen}</strong> and ${leftover} lets ${a} + ${toTen} make 10.
      `
    };
  }

  // 2C: "Same As 10 + ___" Equivalence choice (20%)
  if (roll < 0.82) {
    const correctLabel = `10 + ${leftover}`;
    const distractors = new Set();
    while (distractors.size < 3) {
      const cand = randInt(1, 9);
      if (cand !== leftover) distractors.add(`10 + ${cand}`);
    }
    const opts = shuffle([correctLabel, ...Array.from(distractors)]);
    return {
      dedupeKey: `m10a_equiv_${a}_${b}`,
      domainId: 'make10add',
      skillKey: 'make10_add_equiv',
      skillLabel: 'Friendly 10-Fact Equivalence',
      topicLabel: 'Make 10 Match',
      inputType: 'choice',
      fluencySeconds: 20,
      prompt: `${a} + ${b} is the same as which friendly 10-fact?`,
      stageHTML: `
        <div class="equation-hero" style="font-size:2.3rem;">
          <span>${a} + ${b} = ?</span>
        </div>
      `,
      helperText: `Give ${toTen} from ${b} to ${a} so ${a} becomes 10. How much of ${b} is left over?`,
      answer: correctLabel,
      choices: opts.map(lbl => ({ id: lbl, label: lbl })),
      explanationHTML: `
        Give <strong>${toTen}</strong> from ${b} to ${a} to make <strong>10</strong>! That leaves <strong>${leftover}</strong> from ${b}, so <strong>${a} + ${b} = 10 + ${leftover}</strong> (= ${total}).
      `
    };
  }

  // 2D: Say & Solve Make-a-Ten (18%)
  return {
    dedupeKey: `m10a_solve_${a}_${b}`,
    domainId: 'make10add',
    skillKey: 'make10_add_solve',
    skillLabel: 'Make-a-Ten Mental Addition',
    topicLabel: 'Say & Solve • Make 10',
    inputType: 'numpad',
    fluencySeconds: 22,
    enableTenFrame: true,
    prompt: `🗣️ Say it out loud: "${a} + ${toTen} makes 10, plus ${leftover} more is…"`,
    stageHTML: `
      <div class="equation-hero">
        <span>${a} + ${b} =</span>
        <span id="slot-main" class="answer-slot active">?</span>
      </div>
    `,
    helperText: `${a} + ${toTen} = 10, and ${b} − ${toTen} = ${leftover}, so 10 + ${leftover} = ${total}!`,
    answer: total,
    explanationHTML: `
      <strong>${a} + ${toTen} = 10</strong>, plus <strong>${leftover}</strong> more gives <strong>${total}</strong>!
    `
  };
}
