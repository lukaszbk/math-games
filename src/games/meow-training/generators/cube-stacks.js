import { pick, randInt } from '../../../shared/math.js';
import { buildAnswerBarHTML, buildCubeStackSVG } from '../svg-volume.js';

function sumGrid(grid) {
  return grid.reduce((total, row) => total + row.reduce((s, v) => s + v, 0), 0);
}

export function genCubeStacks() {
  const roll = Math.random();

  // 1A: Neat rectangular prism pad of unit cubes (40%)
  if (roll < 0.40) {
    let rows = randInt(2, 4);
    let cols = randInt(2, 4);
    let layers = randInt(1, 3);
    while (rows * cols * layers > 36 || rows * cols * layers < 4) {
      rows = randInt(2, 4);
      cols = randInt(2, 4);
      layers = randInt(1, 3);
    }
    const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => layers));
    const vol = rows * cols * layers;
    return {
      dedupeKey: `cs_prism_${rows}x${cols}x${layers}`,
      domainId: 'cube-stacks',
      skillKey: 'vol_count_prism',
      skillLabel: 'Counting Unit Cube Prisms',
      topicLabel: 'Unit Cube Prism',
      inputType: 'numpad',
      fluencySeconds: 20,
      prompt: 'Count all the <strong>1 × 1 × 1 unit cubes</strong> in Misty’s 3D prism stack:',
      promptText: `Count all the 1×1×1 unit cubes in a ${rows}×${cols}×${layers} stack.`,
      stageHTML: `
        <div class="vol-goal-banner">🧊 1 layer has ${rows} × ${cols} = ${rows * cols} cubes • Stack has ${layers} ${layers === 1 ? 'layer' : 'layers'}!</div>
        ${buildCubeStackSVG({ grid })}
        ${buildAnswerBarHTML({ label: 'Total Volume =', unit: 'cubic units' })}
      `,
      answer: vol,
      helperText: `Count the top squares (${rows} × ${cols} = ${rows * cols} cubes in 1 layer), then multiply by ${layers} ${layers === 1 ? 'layer' : 'layers'}!`,
      mistakeSummary: `${rows}×${cols}×${layers} unit cube prism`,
      explanationHTML: `
        Each layer holds <strong>${rows} × ${cols} = ${rows * cols}</strong> cubes, and there ${layers === 1 ? 'is' : 'are'} <strong>${layers}</strong> ${layers === 1 ? 'layer' : 'layers'} →
        <strong>${rows * cols} × ${layers} = ${vol} cubic units</strong>!
      `
    };
  }

  // 1B: Two-step cube staircase (back rows taller than front rows -> 100% visible!) (32%)
  if (roll < 0.72) {
    const cols = randInt(2, 4);
    const backRows = randInt(1, 2);
    const frontRows = randInt(1, 2);
    const hBack = randInt(2, 3);
    const hFront = randInt(1, hBack - 1);
    const grid = [];
    for (let r = 0; r < backRows; r++) {
      grid.push(Array.from({ length: cols }, () => hBack));
    }
    for (let r = 0; r < frontRows; r++) {
      grid.push(Array.from({ length: cols }, () => hFront));
    }
    const backVol = backRows * cols * hBack;
    const frontVol = frontRows * cols * hFront;
    const vol = sumGrid(grid);

    return {
      dedupeKey: `cs_stairs_${cols}_${backRows}_${hBack}_${frontRows}_${hFront}`,
      domainId: 'cube-stacks',
      skillKey: 'vol_count_stairs',
      skillLabel: 'Counting Step Cube Stacks',
      topicLabel: 'Cube Staircase',
      inputType: 'numpad',
      fluencySeconds: 24,
      prompt: 'Count ALL the unit cubes in this two-step staircase (include the bottom cubes under the back step!):',
      promptText: `Count all unit cubes in a two-step staircase (${backRows}×${cols} at height ${hBack}, plus ${frontRows}×${cols} at height ${hFront}).`,
      stageHTML: `
        <div class="vol-goal-banner">🪜 Count the tall back step + the front step (don’t forget cubes underneath)!</div>
        ${buildCubeStackSVG({ grid })}
        ${buildAnswerBarHTML({ label: 'Total Volume =', unit: 'cubic units' })}
      `,
      answer: vol,
      helperText: `Back part has ${backRows * cols} columns × ${hBack} high = ${backVol}. Front part has ${frontRows * cols} columns × ${hFront} high = ${frontVol}. Add them!`,
      mistakeSummary: `Staircase cube stack (vol ${vol})`,
      explanationHTML: `
        Tall back step: <strong>${backRows * cols} × ${hBack} = ${backVol}</strong> cubes.<br/>
        Lower front step: <strong>${frontRows * cols} × ${hFront} = ${frontVol}</strong> cubes.<br/>
        Total: <strong>${backVol} + ${frontVol} = ${vol} cubic units</strong>!
      `
    };
  }

  // 1C: Monotonic L-terrace / corner tower (every column strictly non-increasing from back-left) (28%)
  const rows = randInt(2, 3);
  const cols = randInt(2, 3);
  const baseH = pick([1, 1, 2]);
  const boost = randInt(1, 2);
  const variant = pick(['corner', 'back-wing', 'l-step']);
  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => baseH));

  if (variant === 'corner') {
    grid[0][0] = baseH + boost;
  } else if (variant === 'back-wing') {
    for (let c = 0; c < cols; c++) grid[0][c] = baseH + boost;
    if (rows === 3 && cols === 3) grid[2][2] = 0;
  } else {
    grid[0][0] = baseH + boost;
    grid[0][1] = baseH + 1;
    grid[1][0] = baseH + 1;
    if (rows === 3 && cols === 3) grid[2][2] = 0;
  }

  const vol = sumGrid(grid);
  const colHeights = grid.flat().filter(h => h > 0);
  const layerCounts = [];
  for (let z = 1; z <= baseH + boost; z++) {
    const countInLayer = colHeights.filter(h => h >= z).length;
    layerCounts.push(`Layer ${z}: ${countInLayer}`);
  }

  return {
    dedupeKey: `cs_terrace_${rows}x${cols}_${baseH}_${boost}_${variant}`,
    domainId: 'cube-stacks',
    skillKey: 'vol_count_terrace',
    skillLabel: 'Counting Corner Tower Stacks',
    topicLabel: 'Corner Tower Stack',
    inputType: 'numpad',
    fluencySeconds: 26,
    prompt: 'Count all the unit cubes in this 3D corner tower stack (layer by layer from the bottom up!):',
    promptText: `Count all unit cubes in a ${rows}×${cols} corner tower stack (total ${vol}).`,
    stageHTML: `
      <div class="vol-goal-banner">🧱 Count layer by layer (teal bottom → blue middle → gold top)!</div>
      ${buildCubeStackSVG({ grid })}
      ${buildAnswerBarHTML({ label: 'Total Volume =', unit: 'cubic units' })}
    `,
    answer: vol,
    helperText: `Count how many cubes sit in each color layer (${layerCounts.join(', ')}), then add them together!`,
    mistakeSummary: `Corner tower stack (${vol} cubes)`,
    explanationHTML: `
      Count each layer from bottom to top: <strong>${layerCounts.join(' + ')}</strong> → Total = <strong>${vol} cubic units</strong>!
    `
  };
}
