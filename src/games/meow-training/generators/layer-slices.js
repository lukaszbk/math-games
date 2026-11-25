import { pick, randInt } from '../../../shared/math.js';
import { buildAnswerBarHTML, buildPrismBoxSVG } from '../svg-volume.js';

export function genLayerSlices() {
  const roll = Math.random();

  // 2A: 2-Step Layer Cake (step_pair: a = Base Layer L*W, b = Total Volume <= 99) (45%)
  if (roll < 0.45) {
    let L = randInt(2, 6);
    let W = randInt(2, 5);
    let H = randInt(2, 5);
    while (L * W * H > 99 || L * W > 30) {
      L = randInt(2, 6);
      W = randInt(2, 5);
      H = randInt(2, 5);
    }
    const baseArea = L * W;
    const vol = baseArea * H;
    const unit = pick(['cm', 'in', 'ft']);

    return {
      dedupeKey: `ls_step_${L}_${W}_${H}_${unit}`,
      domainId: 'layer-slices',
      skillKey: 'vol_layer_steps',
      skillLabel: 'Base Layer × Height (2-Step)',
      topicLabel: 'Layer Cake (2-Step)',
      inputType: 'step_pair',
      slotLabels: { a: '1 Layer (L × W)', b: 'Total Volume' },
      fluencySeconds: 26,
      prompt: `Find the gold <strong>top layer</strong> (${L} × ${W}) first, then find the total volume of all <strong>${H} layers</strong>:`,
      promptText: `Find 1 layer (${L}×${W}) and total volume for ${H} layers.`,
      stageHTML: `
        <div class="vol-goal-banner">🍰 Step 1: Multiply ${L} × ${W} for 1 gold layer • Step 2: Multiply by ${H} layers!</div>
        ${buildPrismBoxSVG({
          length: L,
          width: W,
          height: H,
          unit,
          showLayerGrid: true,
          highlightTopLayer: true
        })}
        <div class="step-equations-box">
          <div class="step-eq-line">
            <span class="step-eq-tag">Step 1</span>
            <span>1 Layer (${L} × ${W}) =</span>
            <span id="slot-a" class="answer-slot active" data-action="focus-dual-slot" data-slot="a">?</span>
          </div>
          <div class="step-eq-line">
            <span class="step-eq-tag">Step 2</span>
            <span>${H} Layers Total =</span>
            <span id="slot-b" class="answer-slot" data-action="focus-dual-slot" data-slot="b">?</span>
          </div>
        </div>
      `,
      answer: { a: baseArea, b: vol },
      helperText: `First count or multiply the gold top layer: ${L} × ${W} = ${baseArea}. Then multiply ${baseArea} × ${H} layers!`,
      mistakeSummary: `Layer cake ${L}×${W}×${H}`,
      explanationHTML: `
        Step 1: One layer holds <strong>${L} × ${W} = ${baseArea}</strong> cubes.<br/>
        Step 2: Stack <strong>${H}</strong> layers → <strong>${baseArea} × ${H} = ${vol} cubic ${unit}</strong>!
      `
    };
  }

  // 2B: Given Base Area × Height -> Find Volume (30%)
  if (roll < 0.75) {
    const [L, W] = pick([[2, 3], [2, 4], [3, 3], [2, 5], [3, 4], [3, 5], [4, 4], [3, 6], [4, 5], [4, 6]]);
    const baseArea = L * W;
    const H = randInt(2, 6);
    const vol = baseArea * H;
    const unit = pick(['cm', 'in', 'ft']);

    return {
      dedupeKey: `ls_base_${baseArea}_${H}_${unit}`,
      domainId: 'layer-slices',
      skillKey: 'vol_base_times_h',
      skillLabel: 'Base Area × Height',
      topicLabel: 'Base Area × Height',
      inputType: 'numpad',
      fluencySeconds: 20,
      prompt: `Each layer has a <strong>Base Area of ${baseArea} square ${unit}</strong>, and the box is <strong>${H} ${unit}</strong> tall. What is its Volume?`,
      promptText: `Base Area is ${baseArea} sq ${unit} and height is ${H} ${unit}. Find Volume.`,
      stageHTML: `
        <div class="vol-goal-banner">🍰 Volume = Base Area × Height!</div>
        ${buildPrismBoxSVG({
          length: L,
          width: W,
          height: H,
          unit,
          labelL: null,
          labelW: null,
          labelH: H,
          centerBadge: `Base = ${baseArea} sq ${unit}`,
          showLayerGrid: H <= 5,
          highlightTopLayer: H <= 5
        })}
        ${buildAnswerBarHTML({ label: 'Volume =', unit: `cubic ${unit}` })}
      `,
      answer: vol,
      helperText: `Every layer holds ${baseArea} cubes! Multiply ${baseArea} × ${H} layers.`,
      mistakeSummary: `Base ${baseArea} × Height ${H}`,
      explanationHTML: `
        <strong>Volume = Base Area × Height</strong> → <strong>${baseArea} × ${H} = ${vol} cubic ${unit}</strong>!
      `
    };
  }

  // 2C: Find number of layers (Height) from Base Area and Total Volume (25%)
  const [L, W] = pick([[2, 3], [2, 4], [3, 3], [2, 5], [3, 4], [4, 4], [4, 5]]);
  const baseArea = L * W;
  const H = randInt(2, 7);
  const vol = baseArea * H;

  return {
    dedupeKey: `ls_layers_${baseArea}_${H}`,
    domainId: 'layer-slices',
    skillKey: 'vol_find_layers',
    skillLabel: 'Finding Number of Layers',
    topicLabel: 'Find the Layers',
    inputType: 'numpad',
    fluencySeconds: 22,
    prompt: `Misty’s cake holds <strong>${vol} unit cubes</strong> in total, and <strong>1 layer</strong> holds <strong>${baseArea} cubes</strong>. How many layers tall is it?`,
    promptText: `Total volume is ${vol} cubes and 1 layer holds ${baseArea} cubes. How many layers tall?`,
    stageHTML: `
      <div class="vol-goal-banner">🍰 Total Volume = ${vol} cubic units • Divide by 1 layer!</div>
      ${buildPrismBoxSVG({
        length: L,
        width: W,
        height: Math.min(H, 5),
        unit: '',
        labelL: null,
        labelW: null,
        labelH: '?',
        centerBadge: `1 Layer = ${baseArea}`
      })}
      ${buildAnswerBarHTML({ label: 'Number of Layers =', unit: 'layers' })}
    `,
    answer: H,
    helperText: `Ask: ${baseArea} × ? = ${vol} (or divide ${vol} ÷ ${baseArea})!`,
    mistakeSummary: `${vol} ÷ ${baseArea} layers`,
    explanationHTML: `
      Each layer has <strong>${baseArea}</strong> cubes, and <strong>${baseArea} × ${H} = ${vol}</strong> → so there are <strong>${H} layers</strong>!
    `
  };
}
