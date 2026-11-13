import { randInt } from '../../../shared/math.js';

export function genFactFamilies() {
  const roll = Math.random();

  // 6A: Related Addition & Subtraction (Fact Family) (40%)
  if (roll < 0.40) {
    const a = randInt(4, 9);
    const b = randInt(11 - a, 9); // sum in 11..18
    const total = a + b;
    const askSub = Math.random() < 0.55;
    if (askSub) {
      return {
        dedupeKey: `ff_rel_${a}_${b}`,
        domainId: 'factfamilies',
        skillKey: 'fact_family',
        skillLabel: 'Related Fact Families',
        topicLabel: 'Fact Family Clue',
        inputType: 'numpad',
        fluencySeconds: 20,
        enableTenFrame: true,
        prompt: `Since ${a} + ${b} = ${total}, what is ${total} − ${a}?`,
        stageHTML: `
          <div class="iready-visual-stack">
            <div class="slide-caption">Fact Family Clue: <strong>${a} + ${b} = ${total}</strong></div>
            <div class="equation-hero">
              <span>${total} − ${a} =</span>
              <span id="slot-main" class="answer-slot active">?</span>
            </div>
          </div>
        `,
        helperText: `The same three numbers (${a}, ${b}, ${total}) live in this fact family!`,
        answer: b,
        explanationHTML: `
          Because <strong>${a} + ${b} = ${total}</strong>, taking away ${a} leaves the partner <strong>${b}</strong>! (${total} − ${a} = ${b})
        `
      };
    }

    return {
      dedupeKey: `ff_miss_${a}_${total}`,
      domainId: 'factfamilies',
      skillKey: 'fact_family',
      skillLabel: 'Missing Part in Fact Families',
      topicLabel: 'Missing Partner',
      inputType: 'numpad',
      fluencySeconds: 22,
      enableTenFrame: true,
      prompt: 'Find the missing partner in this fact family:',
      stageHTML: `
        <div class="equation-hero">
          <span>${a} +</span>
          <span id="slot-main" class="answer-slot active">?</span>
          <span>= ${total}</span>
        </div>
      `,
      helperText: `Think: ${a} + ${10 - a} = 10, plus ${total - 10} more to reach ${total}!`,
      answer: b,
      explanationHTML: `
        <strong>${a} + ${b} = ${total}</strong> (and ${total} − ${a} = ${b}), so the missing partner is <strong>${b}</strong>!
      `
    };
  }

  // 6B: Missing subtrahend or missing start (30%)
  if (roll < 0.70) {
    if (Math.random() < 0.55) {
      const start = randInt(11, 18);
      const diff = randInt(3, 9);
      const ans = start - diff;
      return {
        dedupeKey: `ff_subp_${start}_${diff}`,
        domainId: 'factfamilies',
        skillKey: 'fact_family',
        skillLabel: 'Missing Subtrahend',
        topicLabel: 'Fact Family Detective',
        inputType: 'numpad',
        fluencySeconds: 22,
        enableTenFrame: true,
        prompt: `What number was taken away from ${start} to leave ${diff}?`,
        stageHTML: `
          <div class="equation-hero">
            <span>${start} −</span>
            <span id="slot-main" class="answer-slot active">?</span>
            <span>= ${diff}</span>
          </div>
        `,
        helperText: `Use addition to check: ${diff} + ? = ${start}`,
        answer: ans,
        explanationHTML: `
          <strong>${start} − ${ans} = ${diff}</strong> because <strong>${diff} + ${ans} = ${start}</strong>!
        `
      };
    }

    const b = randInt(3, 9);
    const diff = randInt(3, 20 - b);
    const ans = b + diff;
    return {
      dedupeKey: `ff_subs_${b}_${diff}`,
      domainId: 'factfamilies',
      skillKey: 'fact_family',
      skillLabel: 'Missing Whole Number',
      topicLabel: 'Fact Family Detective',
      inputType: 'numpad',
      fluencySeconds: 22,
      enableTenFrame: true,
      prompt: 'Put the two parts back together to find the starting number:',
      stageHTML: `
        <div class="equation-hero">
          <span id="slot-main" class="answer-slot active">?</span>
          <span>− ${b} = ${diff}</span>
        </div>
      `,
      helperText: `Add the two parts: ${diff} + ${b}!`,
      answer: ans,
      explanationHTML: `
        <strong>${diff} + ${b} = ${ans}</strong>, so <strong>${ans} − ${b} = ${diff}</strong>!
      `
    };
  }

  // 6C: Balancing Equations with 10 (30%)
  const a = randInt(6, 9);
  const b = randInt(11 - a, 9);
  const total = a + b;
  const ans = total - 10;
  return {
    dedupeKey: `ff_bal_${a}_${b}`,
    domainId: 'factfamilies',
    skillKey: 'balance_eq',
    skillLabel: 'Balancing Equations',
    topicLabel: 'Balance the Scale',
    inputType: 'numpad',
    fluencySeconds: 22,
    enableTenFrame: true,
    prompt: 'Make BOTH sides of the = sign equal the same total!',
    stageHTML: `
      <div class="equation-hero" style="font-size:clamp(1.65rem,3.3vw,2.35rem);">
        <span>${a} + ${b} = 10 +</span>
        <span id="slot-main" class="answer-slot active">?</span>
      </div>
    `,
    helperText: `Give ${10 - a} from ${b} to ${a} to make 10. How much of ${b} is left?`,
    answer: ans,
    explanationHTML: `
      The left side is <strong>${a} + ${b} = ${total}</strong>. So the right side needs <strong>10 + ${ans} = ${total}</strong>!
    `
  };
}
