import { randInt, pick } from '../../../shared/math.js';
import { buildNumberPathHopsHTML, buildStaticTenFrameHTML } from '../../../shared/manipulatives.js';

export function genPartners10() {
  const roll = Math.random();

  // 1A: Teen numbers as 10 and some more (40%)
  if (roll < 0.40) {
    const ones = randInt(1, 9);
    const teen = 10 + ones;
    const askOnes = Math.random() < 0.5;
    if (askOnes) {
      return {
        dedupeKey: `teen_dec_${teen}`,
        domainId: 'partners10',
        skillKey: 'teen_decompose',
        skillLabel: 'Teen Numbers (10 and Some More)',
        topicLabel: 'Teen Numbers',
        inputType: 'numpad',
        fluencySeconds: 18,
        prompt: `${teen} is 10 and how many more?`,
        stageHTML: `
          <div class="iready-visual-stack">
            ${buildStaticTenFrameHTML({ red: 10, gold: ones, totalSlots: 20 })}
            ${buildNumberPathHopsHTML({ min: 1, max: 20, start: 10, mid: 10, end: teen, benchmarkAfter10: true })}
            <div class="equation-hero">
              <span>${teen} = 10 +</span>
              <span id="slot-main" class="answer-slot active">?</span>
            </div>
          </div>
        `,
        helperText: `Count the yellow counters in the second 10-frame past the purple 10 line!`,
        answer: ones,
        explanationHTML: `
          <strong>${teen}</strong> is one full <strong>10</strong> and <strong>${ones}</strong> extra ones! (${teen} = 10 + ${ones})
        `
      };
    }

    return {
      dedupeKey: `teen_bld_${ones}`,
      domainId: 'partners10',
      skillKey: 'teen_decompose',
      skillLabel: 'Teen Numbers (10 and Some More)',
      topicLabel: 'Teen Numbers',
      inputType: 'numpad',
      fluencySeconds: 18,
      prompt: `What number do 10 and ${ones} make together?`,
      stageHTML: `
        <div class="iready-visual-stack">
          ${buildStaticTenFrameHTML({ red: 10, gold: ones, totalSlots: 20 })}
          <div class="equation-hero">
            <span>10 + ${ones} =</span>
            <span id="slot-main" class="answer-slot active">?</span>
          </div>
        </div>
      `,
      helperText: `One ten plus ${ones} ones puts a 1 in the tens place and ${ones} in the ones place!`,
      answer: teen,
      explanationHTML: `
        One full <strong>10</strong> and <strong>${ones}</strong> more makes <strong>${teen}</strong>! (10 + ${ones} = ${teen})
      `
    };
  }

  // 1B: Friends of 10 (35%)
  if (roll < 0.75) {
    const a = randInt(1, 9);
    const ans = 10 - a;
    const hideFirst = Math.random() < 0.4;
    return {
      dedupeKey: `f10_${a}_${hideFirst ? 'l' : 'r'}`,
      domainId: 'partners10',
      skillKey: 'friends_of_10',
      skillLabel: 'Friends of 10',
      topicLabel: 'Friends of 10',
      inputType: 'numpad',
      fluencySeconds: 16,
      prompt: 'What partner helps fill the 10-frame to make 10?',
      stageHTML: `
        <div class="iready-visual-stack">
          ${buildStaticTenFrameHTML({ red: a, qmark: ans, totalSlots: 10 })}
          <div class="equation-hero">
            ${hideFirst
              ? `<span id="slot-main" class="answer-slot active">?</span> <span>+ ${a} = 10</span>`
              : `<span>${a} +</span> <span id="slot-main" class="answer-slot active">?</span> <span>= 10</span>`
            }
          </div>
        </div>
      `,
      helperText: `Count the blue dotted boxes left in the 10-frame!`,
      answer: ans,
      explanationHTML: `
        <strong>${a}</strong> and <strong>${ans}</strong> are Friends of 10 because <strong>${a} + ${ans} = 10</strong>!
      `
    };
  }

  // 1C: Benchmark-10 subtraction with Dog Man stories (25%)
  const ones = randInt(1, 9);
  const teen = 10 + ones;
  const subOnes = Math.random() < 0.6;
  if (subOnes) {
    const stories = [
      `Dog Man had ${teen} doggy treats and shared ${ones} with Li’l Petey. How many treats are left?`,
      `Chief stacked ${teen} comic books and took away the ${ones} extra ones. How many books stay in the stack?`,
      `80-HD painted ${teen} stars and erased ${ones} stars. How many stars are left?`
    ];
    return {
      dedupeKey: `b10sub_ones_${teen}`,
      domainId: 'partners10',
      skillKey: 'benchmark_10_sub',
      skillLabel: 'Subtracting Back to 10',
      topicLabel: 'Back to 10 Story',
      inputType: 'numpad',
      fluencySeconds: 18,
      prompt: pick(stories),
      stageHTML: `
        <div class="equation-hero">
          <span>${teen} − ${ones} =</span>
          <span id="slot-main" class="answer-slot active">?</span>
        </div>
      `,
      helperText: `${teen} is 10 + ${ones}. Take away the ${ones} extra ones to land right on 10!`,
      answer: 10,
      explanationHTML: `
        <strong>${teen}</strong> is 10 and ${ones}, so taking away ${ones} leaves a clean <strong>10</strong>! (${teen} − ${ones} = 10)
      `
    };
  }

  const stories = [
    `Sarah Hatoff had ${teen} press passes and handed out 10. How many passes are left?`,
    `Petey built ${teen} mini-bots and sent 10 out to help the city. How many are left in the lab?`
  ];
  return {
    dedupeKey: `b10sub_ten_${teen}`,
    domainId: 'partners10',
    skillKey: 'benchmark_10_sub',
    skillLabel: 'Subtracting 10 from a Teen',
    topicLabel: 'Teen Minus 10 Story',
    inputType: 'numpad',
    fluencySeconds: 18,
    prompt: pick(stories),
    stageHTML: `
      <div class="equation-hero">
        <span>${teen} − 10 =</span>
        <span id="slot-main" class="answer-slot active">?</span>
      </div>
    `,
    helperText: `${teen} is 10 + ${ones}. Take away the 10 and only the ones remain!`,
    answer: ones,
    explanationHTML: `
      <strong>${teen} − 10 = ${ones}</strong>! Taking away the ten leaves the <strong>${ones}</strong> extra ones.
    `
  };
}
