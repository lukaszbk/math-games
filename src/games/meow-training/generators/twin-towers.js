import { pick, randInt } from '../../../shared/math.js';
import { buildAnswerBarHTML, buildTwinBoxesSVG } from '../svg-volume.js';

function pickTwinPair({ maxTotal = 150, maxBoxA = 80 }) {
  for (let i = 0; i < 80; i++) {
    const l1 = randInt(2, 5);
    const w1 = randInt(2, 4);
    const h1 = randInt(3, 5);
    const volA = l1 * w1 * h1;

    const l2 = randInt(2, 4);
    const w2 = randInt(2, 4);
    const h2 = randInt(2, h1 - 1);
    const volB = l2 * w2 * h2;

    if (volA <= maxBoxA && volA + volB <= maxTotal) {
      return {
        boxA: { l: l1, w: w1, h: h1, vol: volA },
        boxB: { l: l2, w: w2, h: h2, vol: volB },
        total: volA + volB
      };
    }
  }
  return {
    boxA: { l: 3, w: 2, h: 4, vol: 24 },
    boxB: { l: 2, w: 3, h: 2, vol: 12 },
    total: 36
  };
}

export function genTwinTowers() {
  const unit = pick(['cm', 'in', 'ft']);

  // 4A: Guided 2-Step Composite Volume (step_pair: a = Box A <= 99, b = Total <= 99) (45%)
  if (Math.random() < 0.45) {
    const { boxA, boxB, total } = pickTwinPair({ maxTotal: 99, maxBoxA: 64 });
    return {
      dedupeKey: `tt_step_${boxA.l}${boxA.w}${boxA.h}_${boxB.l}${boxB.w}${boxB.h}_${unit}`,
      domainId: 'twin-towers',
      skillKey: 'vol_twin_steps',
      skillLabel: 'Composite Twin Boxes (2-Step)',
      topicLabel: 'Twin Towers (2-Step)',
      inputType: 'step_pair',
      slotLabels: { a: 'Teal Box A', b: 'Total (A + B)' },
      fluencySeconds: 30,
      prompt: 'Find the volume of <strong>Teal Box A</strong> first, then add <strong>Gold Box B</strong> for the total volume:',
      promptText: `Find Teal Box A (${boxA.l}×${boxA.w}×${boxA.h}) and total volume with Gold Box B (${boxB.l}×${boxB.w}×${boxB.h}).`,
      stageHTML: `
        <div class="vol-goal-banner">🏰 Split along the dotted seam: Box A Volume + Box B Volume = Total!</div>
        ${buildTwinBoxesSVG({ boxA, boxB, unit })}
        <div class="vol-twin-legend">
          <span class="vol-legend-chip box-a">Teal Box A: ${boxA.l} × ${boxA.w} × ${boxA.h} ${unit}</span>
          <span class="vol-legend-chip box-b">Gold Box B: ${boxB.l} × ${boxB.w} × ${boxB.h} ${unit}</span>
        </div>
        <div class="step-equations-box">
          <div class="step-eq-line">
            <span class="step-eq-tag">Step 1</span>
            <span>Teal Box A =</span>
            <span id="slot-a" class="answer-slot active" data-action="focus-dual-slot" data-slot="a">?</span>
          </div>
          <div class="step-eq-line">
            <span class="step-eq-tag">Step 2</span>
            <span>Total (A + B) =</span>
            <span id="slot-b" class="answer-slot" data-action="focus-dual-slot" data-slot="b">?</span>
          </div>
        </div>
      `,
      answer: { a: boxA.vol, b: total },
      helperText: `Box A = ${boxA.l} × ${boxA.w} × ${boxA.h} = ${boxA.vol}. Box B = ${boxB.l} × ${boxB.w} × ${boxB.h} = ${boxB.vol}. Now add ${boxA.vol} + ${boxB.vol}!`,
      mistakeSummary: `Twin towers ${boxA.l}×${boxA.w}×${boxA.h} + ${boxB.l}×${boxB.w}×${boxB.h}`,
      explanationHTML: `
        Teal Box A: <strong>${boxA.l} × ${boxA.w} × ${boxA.h} = ${boxA.vol}</strong><br/>
        Gold Box B: <strong>${boxB.l} × ${boxB.w} × ${boxB.h} = ${boxB.vol}</strong><br/>
        Total Volume: <strong>${boxA.vol} + ${boxB.vol} = ${total} cubic ${unit}</strong>!
      `
    };
  }

  // 4B: Total Composite Volume (numpad up to 160) (55%)
  const { boxA, boxB, total } = pickTwinPair({ maxTotal: 150, maxBoxA: 96 });
  return {
    dedupeKey: `tt_sum_${boxA.l}${boxA.w}${boxA.h}_${boxB.l}${boxB.w}${boxB.h}_${unit}`,
    domainId: 'twin-towers',
    skillKey: 'vol_twin_total',
    skillLabel: 'Additive Composite Volume',
    topicLabel: 'Twin Cat Towers',
    inputType: 'numpad',
    fluencySeconds: 28,
    prompt: 'Fang floated two boxes together! Find the <strong>total combined volume</strong> of Teal Box A + Gold Box B:',
    promptText: `Find combined volume of Box A (${boxA.l}×${boxA.w}×${boxA.h}) and Box B (${boxB.l}×${boxB.w}×${boxB.h}) in ${unit}.`,
    stageHTML: `
      <div class="vol-goal-banner">🏰 Find Box A + Find Box B → Add both volumes!</div>
      ${buildTwinBoxesSVG({ boxA, boxB, unit })}
      <div class="vol-twin-legend">
        <span class="vol-legend-chip box-a">Teal Box A: ${boxA.l} × ${boxA.w} × ${boxA.h} ${unit}</span>
        <span class="vol-legend-chip box-b">Gold Box B: ${boxB.l} × ${boxB.w} × ${boxB.h} ${unit}</span>
      </div>
      ${buildAnswerBarHTML({ label: 'Total Volume =', unit: `cubic ${unit}` })}
    `,
    answer: total,
    helperText: `Multiply ${boxA.l}×${boxA.w}×${boxA.h} for Box A, multiply ${boxB.l}×${boxB.w}×${boxB.h} for Box B, and add!`,
    mistakeSummary: `Twin towers A(${boxA.vol}) + B(${boxB.vol})`,
    explanationHTML: `
      Box A: <strong>${boxA.l} × ${boxA.w} × ${boxA.h} = ${boxA.vol}</strong> &nbsp;•&nbsp;
      Box B: <strong>${boxB.l} × ${boxB.w} × ${boxB.h} = ${boxB.vol}</strong><br/>
      Combined Volume: <strong>${boxA.vol} + ${boxB.vol} = ${total} cubic ${unit}</strong>!
    `
  };
}
