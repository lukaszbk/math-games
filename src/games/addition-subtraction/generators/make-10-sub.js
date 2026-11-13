import { randInt } from '../../../shared/math.js';
import {
  buildNumberPathHopsHTML,
  buildUseTenSubBondHTML,
  buildUseTenSubFramesHTML
} from '../../../shared/manipulatives.js';

function pickSubBridge() {
  const teen = randInt(11, 17);
  const ones = teen - 10;
  const sub = randInt(ones + 1, 9);
  const second = sub - ones;
  const ans = teen - sub;
  return { teen, sub, ones, second, ans };
}

export function genMake10Sub() {
  const roll = Math.random();
  const { teen, sub, ones, second, ans } = pickSubBridge();
  const pathMin = Math.max(1, ans - 1);
  const pathMax = Math.min(20, teen + 1);

  // 3A: Guided 2-step Worksheet Flow (38%)
  if (roll < 0.38) {
    return {
      dedupeKey: `u10s_steps_${teen}_${sub}`,
      domainId: 'make10sub',
      skillKey: 'use10_sub_steps',
      skillLabel: 'Use a Ten to Subtract (2-Step)',
      topicLabel: 'Use a Ten to Subtract',
      inputType: 'step_pair',
      slotLabels: { a: 'Step 1 (Reach 10)', b: 'Step 2 (Answer)' },
      fluencySeconds: 28,
      prompt: `Subtract to 10 first, then subtract the rest to solve ${teen} − ${sub}:`,
      stageHTML: `
        <div class="iready-visual-stack">
          ${buildUseTenSubBondHTML({ teen, sub, partToTen: ones, leftoverPart: second })}
          ${buildNumberPathHopsHTML({ min: pathMin, max: pathMax, start: teen, mid: 10, end: ans, showEndQuestion: true })}
          <div class="step-equations-box">
            <div class="step-eq-line">
              <span class="step-eq-tag">Step 1</span>
              <span>${teen} −</span>
              <span id="slot-a" class="answer-slot active" data-action="focus-dual-slot" data-slot="a">?</span>
              <span>= 10</span>
            </div>
            <div class="step-eq-line">
              <span class="step-eq-tag">Step 2</span>
              <span>10 − ${second} =</span>
              <span id="slot-b" class="answer-slot" data-action="focus-dual-slot" data-slot="b">?</span>
            </div>
          </div>
        </div>
      `,
      helperText: `First subtract ${ones} from ${teen} to land on 10. Then subtract the ${second} left from 10!`,
      answer: { a: ones, b: ans },
      explanationHTML: `
        Break <strong>${sub}</strong> into <strong>${ones} + ${second}</strong>! Step 1: <strong>${teen} − ${ones} = 10</strong>. Step 2: <strong>10 − ${second} = ${ans}</strong>! So <strong>${teen} − ${sub} = ${ans}</strong>.
      `
    };
  }

  // 3B: Double 10-Frame Take-Away (24%)
  if (roll < 0.62) {
    return {
      dedupeKey: `u10s_frames_${teen}_${sub}`,
      domainId: 'make10sub',
      skillKey: 'use10_sub_frames',
      skillLabel: 'Double 10-Frame Subtraction',
      topicLabel: '10-Frame Take-Away',
      inputType: 'numpad',
      fluencySeconds: 22,
      prompt: `We had ${teen} counters and crossed out ${sub}. How many red counters are left?`,
      stageHTML: `
        <div class="iready-visual-stack">
          ${buildUseTenSubFramesHTML(teen, sub)}
          <div class="equation-hero">
            <span>${teen} − ${sub} =</span>
            <span id="slot-main" class="answer-slot active">?</span>
          </div>
        </div>
      `,
      helperText: `Notice ${ones} bottom counters and ${second} top counters are crossed out — count the red counters still left!`,
      answer: ans,
      explanationHTML: `
        Taking away ${ones} leaves 10 in the top frame, and taking away ${second} more leaves <strong>${ans}</strong> red counters! (${teen} − ${sub} = ${ans})
      `
    };
  }

  // 3C: Number Path Two-Hop Landing (20%)
  if (roll < 0.82) {
    return {
      dedupeKey: `u10s_path_${teen}_${sub}`,
      domainId: 'make10sub',
      skillKey: 'use10_sub_path',
      skillLabel: 'Number Path Two-Hop Subtraction',
      topicLabel: 'Number Path Hops',
      inputType: 'numpad',
      fluencySeconds: 22,
      prompt: `Start at ${teen}, hop back ${ones} to 10, then hop back ${second} more. Where do you land?`,
      stageHTML: `
        <div class="iready-visual-stack">
          ${buildNumberPathHopsHTML({ min: pathMin, max: pathMax, start: teen, mid: 10, end: ans, showEndQuestion: true })}
          <div class="equation-hero">
            <span>${teen} − ${sub} =</span>
            <span id="slot-main" class="answer-slot active">?</span>
          </div>
        </div>
      `,
      helperText: `After the first hop you are at 10. Now solve 10 − ${second}!`,
      answer: ans,
      explanationHTML: `
        <strong>${teen} − ${ones} = 10</strong>, then hopping back ${second} more gives <strong>10 − ${second} = ${ans}</strong>!
      `
    };
  }

  // 3D: Break Apart Subtrahend (18%)
  return {
    dedupeKey: `u10s_split_${teen}_${sub}`,
    domainId: 'make10sub',
    skillKey: 'use10_sub_split',
    skillLabel: 'Break Apart to Reach 10',
    topicLabel: 'Use 10 Detective',
    inputType: 'numpad',
    fluencySeconds: 20,
    prompt: `To solve ${teen} − ${sub}, how much do we subtract FIRST from ${teen} to land on 10?`,
    stageHTML: `
      <div class="iready-visual-stack">
        ${buildUseTenSubBondHTML({ teen, sub, partToTen: ones, leftoverPart: second, hidePart: 'left' })}
        <div class="equation-hero">
          <span>${teen} −</span>
          <span id="slot-main" class="answer-slot active">?</span>
          <span>= 10</span>
        </div>
      </div>
    `,
    helperText: `${teen} is 10 + ${ones}. Subtract the ones to reach 10!`,
    answer: ones,
    explanationHTML: `
      Subtract <strong>${ones}</strong> first because <strong>${teen} − ${ones} = 10</strong>! (Then ${sub} has ${second} left to subtract: 10 − ${second} = ${ans}.)
    `
  };
}
