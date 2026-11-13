import { randInt } from '../../../shared/math.js';

export function genDoubles20() {
  const isDouble = Math.random() < 0.52;

  if (isDouble) {
    const a = randInt(2, 10);
    const ans = a + a;
    return {
      dedupeKey: `dbl20_${a}`,
      domainId: 'doubles20',
      skillKey: 'doubles_fact',
      skillLabel: 'Doubles (Up to 20)',
      topicLabel: 'Doubles',
      inputType: 'numpad',
      fluencySeconds: 18,
      enableTenFrame: a >= 6,
      prompt: `Solve this double: ${a} + ${a}`,
      stageHTML: `
        <div class="equation-hero">
          <span>${a} + ${a} =</span>
          <span id="slot-main" class="answer-slot active">?</span>
        </div>
      `,
      helperText: a <= 5
        ? `Think of two hands with ${a} fingers each!`
        : `Think: ${a} + ${a} is ${a >= 6 ? `5 + 5 = 10 plus ${a - 5} + ${a - 5} = ${(a - 5) * 2}` : ''}!`,
      answer: ans,
      explanationHTML: `
        Double <strong>${a}</strong> is <strong>${a} + ${a} = ${ans}</strong>!
      `
    };
  }

  const a = randInt(4, 9);
  const b = a + 1;
  const swap = Math.random() < 0.45;
  const left = swap ? b : a;
  const right = swap ? a : b;
  const ans = a + b;
  return {
    dedupeKey: `ndbl20_${left}_${right}`,
    domainId: 'doubles20',
    skillKey: 'near_doubles_fact',
    skillLabel: 'Near-Doubles (Doubles + 1)',
    topicLabel: 'Doubles + 1',
    inputType: 'numpad',
    fluencySeconds: 20,
    enableTenFrame: true,
    prompt: `Use your doubles! Break ${left} + ${right} into ${a} + ${a} + 1:`,
    stageHTML: `
      <div class="iready-visual-stack">
        <div class="equation-hero">
          <span>${left} + ${right} =</span>
          <span id="slot-main" class="answer-slot active">?</span>
        </div>
        <div class="slide-caption">💡 Think: (${a} + ${a}) + 1</div>
      </div>
    `,
    helperText: `Double ${a} is ${a * 2}, and 1 more makes ${ans}!`,
    answer: ans,
    explanationHTML: `
      <strong>${a} + ${a} = ${a * 2}</strong>, plus <strong>1</strong> more equals <strong>${ans}</strong>! (${left} + ${right} = ${ans})
    `
  };
}
