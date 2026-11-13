import { randInt, pick, shuffle } from '../../../shared/math.js';
import { buildNumberPathHopsHTML, buildStaticTenFrameHTML } from '../../../shared/manipulatives.js';

export function genWithin10() {
  const roll = Math.random();

  // 5A: Addition within 10 (visual ten-frame or Dog Man story) (38%)
  if (roll < 0.38) {
    const a = randInt(1, 8);
    const b = randInt(1, 10 - a);
    const ans = a + b;
    if (Math.random() < 0.55) {
      return {
        dedupeKey: `w10_add_${a}_${b}`,
        domainId: 'within10',
        skillKey: 'within10_add',
        skillLabel: 'Addition Within 10',
        topicLabel: 'Ten-Frame Add',
        inputType: 'numpad',
        fluencySeconds: 16,
        prompt: `How many counters are in the 10-frame altogether? (${a} + ${b})`,
        stageHTML: `
          <div class="iready-visual-stack">
            ${buildStaticTenFrameHTML({ red: a, gold: b, totalSlots: 10 })}
            <div class="equation-hero">
              <span>${a} + ${b} =</span>
              <span id="slot-main" class="answer-slot active">?</span>
            </div>
          </div>
        `,
        helperText: `Start at ${Math.max(a, b)} and count on ${Math.min(a, b)} more!`,
        answer: ans,
        explanationHTML: `
          <strong>${a}</strong> red and <strong>${b}</strong> yellow make <strong>${ans}</strong> altogether! (${a} + ${b} = ${ans})
        `
      };
    }

    const stories = [
      `Dog Man fetched ${a} rubber balls and Zuzu fetched ${b} more. How many balls did they fetch in all?`,
      `Li’l Petey drew ${a} comic panels before lunch and ${b} panels after lunch. How many panels did he draw altogether?`,
      `Cat Kid leaped over ${a} puddles, then ${b} more puddles. How many puddles in total?`
    ];
    return {
      dedupeKey: `w10_addst_${a}_${b}`,
      domainId: 'within10',
      skillKey: 'within10_add',
      skillLabel: 'Addition Stories Within 10',
      topicLabel: 'Comic Story • Add',
      inputType: 'numpad',
      fluencySeconds: 20,
      prompt: pick(stories),
      stageHTML: `
        <div class="equation-hero">
          <span>${a} + ${b} =</span>
          <span id="slot-main" class="answer-slot active">?</span>
        </div>
      `,
      helperText: `Put ${a} and ${b} together by counting on from ${Math.max(a, b)}.`,
      answer: ans,
      explanationHTML: `
        <strong>${a} + ${b} = ${ans}</strong>!
      `
    };
  }

  // 5B: Subtraction within 10 (visual, number path 0..10, or story) (38%)
  if (roll < 0.76) {
    const start = randInt(4, 10);
    const take = randInt(1, start - 1);
    const ans = start - take;
    const subRoll = Math.random();

    if (subRoll < 0.4) {
      return {
        dedupeKey: `w10_subvis_${start}_${take}`,
        domainId: 'within10',
        skillKey: 'within10_sub',
        skillLabel: 'Subtraction Within 10',
        topicLabel: 'Ten-Frame Subtract',
        inputType: 'numpad',
        fluencySeconds: 18,
        prompt: `We started with ${start} counters and crossed out ${take}. How many red counters remain?`,
        stageHTML: `
          <div class="iready-visual-stack">
            ${buildStaticTenFrameHTML({ red: ans, crossed: take, totalSlots: 10 })}
            <div class="equation-hero">
              <span>${start} − ${take} =</span>
              <span id="slot-main" class="answer-slot active">?</span>
            </div>
          </div>
        `,
        helperText: `Count the red counters that are not crossed out!`,
        answer: ans,
        explanationHTML: `
          <strong>${start} − ${take} = ${ans}</strong>! (${ans} + ${take} = ${start})
        `
      };
    }

    if (subRoll < 0.75) {
      return {
        dedupeKey: `w10_subnp_${start}_${take}`,
        domainId: 'within10',
        skillKey: 'within10_sub',
        skillLabel: 'Subtraction Within 10',
        topicLabel: 'Number Path Subtract',
        inputType: 'numpad',
        fluencySeconds: 18,
        prompt: `Start at ${start} and hop back ${take} on the number path:`,
        stageHTML: `
          <div class="iready-visual-stack">
            ${buildNumberPathHopsHTML({ min: 0, max: 10, start, mid: ans, end: ans, showEndQuestion: true })}
            <div class="equation-hero">
              <span>${start} − ${take} =</span>
              <span id="slot-main" class="answer-slot active">?</span>
            </div>
          </div>
        `,
        helperText: `Count back ${take} steps from ${start}!`,
        answer: ans,
        explanationHTML: `
          Starting at ${start} and hopping back ${take} lands on <strong>${ans}</strong>!
        `
      };
    }

    const distractors = new Set();
    while (distractors.size < 3) {
      const cand = randInt(0, 10);
      if (cand !== ans) distractors.add(cand);
    }
    const opts = shuffle([ans, ...Array.from(distractors)]);
    return {
      dedupeKey: `w10_subch_${start}_${take}`,
      domainId: 'within10',
      skillKey: 'within10_sub',
      skillLabel: 'Subtraction Within 10',
      topicLabel: 'Subtraction Match',
      inputType: 'choice',
      fluencySeconds: 16,
      prompt: `Petey had ${start} gadgets and ${take} broke! How many gadgets still work?`,
      stageHTML: `<div class="equation-hero" style="font-size:2.3rem;">${start} − ${take} = ?</div>`,
      answer: String(ans),
      choices: opts.map(v => ({ id: String(v), label: String(v) })),
      explanationHTML: `
        <strong>${start} − ${take} = ${ans}</strong>!
      `
    };
  }

  // 5C: Missing part bond within 10 (24%)
  const total = randInt(5, 10);
  const part = randInt(1, total - 1);
  const ans = total - part;
  return {
    dedupeKey: `w10_bond_${total}_${part}`,
    domainId: 'within10',
    skillKey: 'within10_bond',
    skillLabel: 'Number Bonds Within 10',
    topicLabel: 'Missing Part to ' + total,
    inputType: 'numpad',
    fluencySeconds: 18,
    prompt: `Find the missing partner that makes ${total}:`,
    stageHTML: `
      <div class="equation-hero">
        <span>${part} +</span>
        <span id="slot-main" class="answer-slot active">?</span>
        <span>= ${total}</span>
      </div>
    `,
    helperText: `Count up from ${part} to ${total}!`,
    answer: ans,
    explanationHTML: `
      <strong>${part} + ${ans} = ${total}</strong>!
    `
  };
}
