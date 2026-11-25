import { pick, randInt } from '../../../shared/math.js';
import { buildAnswerBarHTML, buildPrismBoxSVG } from '../svg-volume.js';

export function genBoxBuilder() {
  const roll = Math.random();
  const unit = pick(['cm', 'in', 'ft']);

  // 3A: Standard 3D Crate L × W × H (55%)
  if (roll < 0.55) {
    const L = randInt(2, 7);
    const W = randInt(2, 5);
    const H = randInt(2, 5);
    const vol = L * W * H;

    return {
      dedupeKey: `bb_rect_${L}_${W}_${H}_${unit}`,
      domainId: 'box-builder',
      skillKey: 'vol_crate_formula',
      skillLabel: 'Volume Formula (L × W × H)',
      topicLabel: 'Magic Crate Volume',
      inputType: 'numpad',
      fluencySeconds: 22,
      prompt: `Find the volume of this 3D treasure crate (${L} ${unit} × ${W} ${unit} × ${H} ${unit}):`,
      promptText: `Find the volume of a rectangular crate measuring ${L} ${unit} by ${W} ${unit} by ${H} ${unit}.`,
      stageHTML: `
        <div class="vol-goal-banner">📦 Volume = Length × Width × Height!</div>
        ${buildPrismBoxSVG({
          length: L,
          width: W,
          height: H,
          unit
        })}
        ${buildAnswerBarHTML({ label: 'Crate Volume =', unit: `cubic ${unit}` })}
      `,
      answer: vol,
      helperText: `Multiply two sides first (${L} × ${W} = ${L * W}), then multiply by ${H}!`,
      mistakeSummary: `Crate ${L}×${W}×${H} ${unit}`,
      explanationHTML: `
        <strong>Volume = ${L} × ${W} × ${H}</strong> → (${L} × ${W} = ${L * W}) × ${H} = <strong>${vol} cubic ${unit}</strong>!
      `
    };
  }

  // 3B: Cube Crate s × s × s (20%)
  if (roll < 0.75) {
    const s = randInt(2, 5);
    const vol = s * s * s;

    return {
      dedupeKey: `bb_cube_${s}_${unit}`,
      domainId: 'box-builder',
      skillKey: 'vol_cube_crate',
      skillLabel: 'Cube Volume (s × s × s)',
      topicLabel: 'Magic Cube Box',
      inputType: 'numpad',
      fluencySeconds: 20,
      prompt: `Every edge of this glowing cube box is <strong>${s} ${unit}</strong>! What is its volume?`,
      promptText: `Find the volume of a cube with edge length ${s} ${unit}.`,
      stageHTML: `
        <div class="vol-goal-banner">🧊 A cube has equal Length, Width, and Height (${s} × ${s} × ${s})!</div>
        ${buildPrismBoxSVG({
          length: s,
          width: s,
          height: s,
          unit,
          palette: {
            top: '#FEF3C7',
            left: '#FCD34D',
            right: '#F59E0B',
            stroke: '#B45309'
          }
        })}
        ${buildAnswerBarHTML({ label: 'Cube Volume =', unit: `cubic ${unit}` })}
      `,
      answer: vol,
      helperText: `Multiply ${s} × ${s} = ${s * s}, then multiply ${s * s} × ${s}!`,
      mistakeSummary: `Cube ${s}×${s}×${s} ${unit}`,
      explanationHTML: `
        <strong>${s} × ${s} = ${s * s}</strong>, and <strong>${s * s} × ${s} = ${vol} cubic ${unit}</strong>!
      `
    };
  }

  // 3C: Cat Crew Packing Story (25%)
  const L = randInt(3, 6);
  const W = randInt(2, 5);
  const H = randInt(2, 4);
  const vol = L * W * H;
  const story = pick([
    `Misty packs her funny props into a box ${L} ${unit} long, ${W} ${unit} wide, and ${H} ${unit} tall. How many cubic ${unit} of space are inside?`,
    `Fang floats a gear chest ${L} ${unit} long, ${W} ${unit} wide, and ${H} ${unit} tall. What is the chest’s volume?`,
    `Aria stores Sea Force pearls in a crystal box ${L} ${unit} long, ${W} ${unit} wide, and ${H} ${unit} tall. Find its total volume!`
  ]);

  return {
    dedupeKey: `bb_story_${L}_${W}_${H}_${unit}`,
    domainId: 'box-builder',
    skillKey: 'vol_crate_story',
    skillLabel: 'Volume Word Problems',
    topicLabel: 'Gear Crate Story',
    inputType: 'numpad',
    fluencySeconds: 24,
    prompt: story,
    promptText: `${story} (${L}×${W}×${H} ${unit})`,
    stageHTML: `
      <div class="vol-goal-banner">📦 Multiply Length × Width × Height!</div>
      ${buildPrismBoxSVG({
        length: L,
        width: W,
        height: H,
        unit,
        palette: {
          top: '#CCFBF1',
          left: '#5EEAD4',
          right: '#0D9488',
          stroke: '#0F766E'
        }
      })}
      ${buildAnswerBarHTML({ label: 'Total Volume =', unit: `cubic ${unit}` })}
    `,
    answer: vol,
    helperText: `Multiply all 3 dimensions: ${L} × ${W} × ${H}!`,
    mistakeSummary: `Story crate ${L}×${W}×${H} ${unit}`,
    explanationHTML: `
      <strong>${L} × ${W} = ${L * W}</strong>, and <strong>${L * W} × ${H} = ${vol} cubic ${unit}</strong>!
    `
  };
}
