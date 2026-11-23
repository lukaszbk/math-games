import { pick, randInt } from '../../../shared/math.js';
import {
  buildAnswerBarHTML,
  buildGoalBannerHTML,
  buildLShapeSVG
} from '../svg-blueprints.js';

const ORIENTATIONS = ['top-right', 'top-left', 'bottom-right', 'bottom-left'];

function buildLParams() {
  const orient = pick(ORIENTATIONS);
  const w1 = randInt(3, 9);
  const w2 = randInt(3, 8);
  const h1 = randInt(3, 8);
  const h2 = randInt(3, 8);
  const W = w1 + w2;
  const H = h1 + h2;
  const unit = pick(['m', 'ft']);

  let labels;
  let area;
  let splitText;

  if (orient === 'top-right') {
    labels = { top: w1, stepV: h1, stepH: w2, right: h2, bottom: W, left: H };
    const topArea = w1 * h1;
    const botArea = W * h2;
    area = topArea + botArea;
    splitText = `Top room (${w1} × ${h1} = <strong>${topArea}</strong>) + Bottom room (${W} × ${h2} = <strong>${botArea}</strong>)`;
  } else if (orient === 'top-left') {
    labels = { top: w2, right: H, bottom: W, left: h2, stepH: w1, stepV: h1 };
    const topArea = w2 * h1;
    const botArea = W * h2;
    area = topArea + botArea;
    splitText = `Top room (${w2} × ${h1} = <strong>${topArea}</strong>) + Bottom room (${W} × ${h2} = <strong>${botArea}</strong>)`;
  } else if (orient === 'bottom-right') {
    labels = { top: W, right: h1, stepH: w2, stepV: h2, bottom: w1, left: H };
    const topArea = W * h1;
    const botArea = w1 * h2;
    area = topArea + botArea;
    splitText = `Top room (${W} × ${h1} = <strong>${topArea}</strong>) + Bottom room (${w1} × ${h2} = <strong>${botArea}</strong>)`;
  } else {
    labels = { top: W, right: H, bottom: w2, stepV: h2, stepH: w1, left: h1 };
    const topArea = W * h1;
    const botArea = w2 * h2;
    area = topArea + botArea;
    splitText = `Top room (${W} × ${h1} = <strong>${topArea}</strong>) + Bottom room (${w2} × ${h2} = <strong>${botArea}</strong>)`;
  }

  return { orient, w1, w2, h1, h2, W, H, unit, labels, area, perimeter: 2 * (W + H), splitText };
}

export function genLBlueprints() {
  const p = buildLParams();
  const roll = Math.random();

  // 3A: L-Shape Total Area by Splitting into 2 Rectangles (42%)
  if (roll < 0.42) {
    const showSplit = Math.random() < 0.65;
    return {
      dedupeKey: `lb_area_${p.orient}_${p.w1}_${p.w2}_${p.h1}_${p.h2}`,
      domainId: 'l-blueprints',
      skillKey: 'l_shape_area',
      skillLabel: 'Splitting L-Shapes to Find Area',
      topicLabel: 'L-Castle Area',
      inputType: 'numpad',
      fluencySeconds: 28,
      prompt: 'Slice Cuzi’s L-shaped castle blueprint into <strong>2 rectangles</strong> and add their areas together:',
      promptText: `Find the total area of an L-shaped castle (overall ${p.W}×${p.H}, wings ${p.w1}, ${p.w2}, ${p.h1}, ${p.h2} ${p.unit}).`,
      stageHTML: `
        ${buildGoalBannerHTML('🏰 Split the L-shape into 2 rectangles, multiply each, then ADD!', 'area')}
        ${buildLShapeSVG({
          orient: p.orient,
          w1: p.w1,
          w2: p.w2,
          h1: p.h1,
          h2: p.h2,
          unit: p.unit,
          labels: p.labels,
          showSplit
        })}
        ${buildAnswerBarHTML({ label: 'Total Castle Area =', unit: `sq ${p.unit}` })}
      `,
      answer: p.area,
      helperText: 'Draw a horizontal cut across the step! Multiply each rectangle’s Length × Width, then add both areas.',
      explanationHTML: `
        Split horizontally into 2 rectangles:<br/>
        ${p.splitText} = <strong>${p.area} sq ${p.unit}</strong>!
      `
    };
  }

  // 3B: Missing Side on an L-Shape Blueprint (30%)
  if (roll < 0.72) {
    const hideChoice = pick(['stepH', 'stepV', 'fullW', 'fullH']);
    const modded = Object.assign({}, p.labels);
    let ans;
    let explain;
    let clueKind;

    if (hideChoice === 'stepH') {
      ans = p.labels.stepH;
      modded.stepH = '?';
      const knownPart = p.W - ans;
      clueKind = `full width ${p.W} and parallel wall ${knownPart}`;
      explain = `The two horizontal parts match the full width <strong>${p.W} ${p.unit}</strong>: <strong>${p.W} − ${knownPart} = ${ans} ${p.unit}</strong>!`;
    } else if (hideChoice === 'stepV') {
      ans = p.labels.stepV;
      modded.stepV = '?';
      const knownPart = p.H - ans;
      clueKind = `full height ${p.H} and parallel wall ${knownPart}`;
      explain = `The two vertical parts match the full height <strong>${p.H} ${p.unit}</strong>: <strong>${p.H} − ${knownPart} = ${ans} ${p.unit}</strong>!`;
    } else if (hideChoice === 'fullW') {
      const key = (p.orient === 'top-right' || p.orient === 'top-left') ? 'bottom' : 'top';
      ans = p.W;
      modded[key] = '?';
      clueKind = `parallel widths ${p.w1} and ${p.w2}`;
      explain = `Add the two parallel horizontal walls: <strong>${p.w1} + ${p.w2} = ${p.W} ${p.unit}</strong>!`;
    } else {
      const key = (p.orient === 'top-right' || p.orient === 'bottom-right') ? 'left' : 'right';
      ans = p.H;
      modded[key] = '?';
      clueKind = `parallel heights ${p.h1} and ${p.h2}`;
      explain = `Add the two parallel vertical walls: <strong>${p.h1} + ${p.h2} = ${p.H} ${p.unit}</strong>!`;
    }

    return {
      dedupeKey: `lb_miss_${p.orient}_${hideChoice}_${p.w1}_${p.w2}_${p.h1}_${p.h2}`,
      domainId: 'l-blueprints',
      skillKey: 'l_missing_side',
      skillLabel: 'Finding Missing L-Shape Wall Lengths',
      topicLabel: 'Missing Step Wall',
      inputType: 'numpad',
      fluencySeconds: 22,
      prompt: 'Use the opposite parallel walls to find the missing <strong>?</strong> wall length:',
      promptText: `Find the missing L-shape wall length given ${clueKind} (${p.unit}).`,
      stageHTML: `
        ${buildGoalBannerHTML('🔍 Opposite parallel walls add up to the same total length!', 'mystery')}
        ${buildLShapeSVG({
          orient: p.orient,
          w1: p.w1,
          w2: p.w2,
          h1: p.h1,
          h2: p.h2,
          unit: p.unit,
          labels: modded
        })}
        ${buildAnswerBarHTML({ label: 'Missing Wall ? =', unit: p.unit })}
      `,
      answer: ans,
      helperText: hideChoice === 'stepH' || hideChoice === 'stepV'
        ? 'Subtract the shorter parallel wall from the full opposite wall!'
        : 'Add the two shorter parallel walls facing the missing long wall!',
      explanationHTML: explain
    };
  }

  // 3C: Full 6-Wall Perimeter of an L-Shape (28%)
  const allSidesList = Object.values(p.labels);
  return {
    dedupeKey: `lb_perim_${p.orient}_${p.w1}_${p.w2}_${p.h1}_${p.h2}`,
    domainId: 'l-blueprints',
    skillKey: 'l_shape_perim',
    skillLabel: '6-Wall L-Shape Perimeter',
    topicLabel: 'L-Castle Perimeter',
    inputType: 'numpad',
    fluencySeconds: 26,
    prompt: 'Patrol all <strong>6 outer walls</strong> of Cuzi’s L-shaped castle to find its total <strong>Perimeter</strong>:',
    promptText: `Find the perimeter of an L-shape with outer walls ${allSidesList.join(', ')} ${p.unit}.`,
    stageHTML: `
      ${buildGoalBannerHTML('🚧 Walk around ALL 6 outer walls — don’t miss the 2 inner step walls!', 'perim')}
      ${buildLShapeSVG({
        orient: p.orient,
        w1: p.w1,
        w2: p.w2,
        h1: p.h1,
        h2: p.h2,
        unit: p.unit,
        labels: p.labels,
        highlightPerimeter: true
      })}
      ${buildAnswerBarHTML({ label: 'Castle Perimeter =', unit: p.unit })}
    `,
    answer: p.perimeter,
    helperText: `Add all 6 outer wall lengths: ${allSidesList.join(' + ')}!`,
    explanationHTML: `
      Walking all 6 outer walls:<br/>
      <strong>${allSidesList.join(' + ')} = ${p.perimeter} ${p.unit}</strong>!
    `
  };
}
