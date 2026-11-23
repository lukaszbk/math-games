import { pick, randInt } from '../../../shared/math.js';
import {
  buildAnswerBarHTML,
  buildDualAnswerBarHTML,
  buildGoalBannerHTML,
  buildRectBlueprintSVG
} from '../svg-blueprints.js';

export function genMysterySides() {
  const roll = Math.random();
  const unit = pick(['m', 'ft']);

  // 4A: Missing Side from Area (36%)
  if (roll < 0.36) {
    const L = randInt(3, 12);
    const W = randInt(3, 10);
    const area = L * W;
    const hideTop = Math.random() < 0.5;
    const known = hideTop ? W : L;
    const missing = hideTop ? L : W;

    return {
      dedupeKey: `ms_area_${L}x${W}_${hideTop ? 't' : 'l'}`,
      domainId: 'mystery-sides',
      skillKey: 'missing_side_area',
      skillLabel: 'Finding Missing Side from Area',
      topicLabel: 'Area Vault Clue',
      inputType: 'numpad',
      fluencySeconds: 22,
      prompt: `Cori’s vault blueprint shows <strong>Area = ${area} sq ${unit}</strong> and one side is <strong>${known} ${unit}</strong>. What is the missing <strong>?</strong> side?`,
      promptText: `A rectangle has Area ${area} sq ${unit} and one side ${known} ${unit}. Find the missing side.`,
      stageHTML: `
        ${buildGoalBannerHTML('🔐 Area = Length × Width — divide Area by the known side!', 'mystery')}
        ${buildRectBlueprintSVG({
          length: L,
          width: W,
          unit,
          labelTop: hideTop ? '?' : L,
          labelLeft: hideTop ? W : '?',
          centerBadge: `Area = ${area} sq ${unit}`,
          fill: '#E0F2FE',
          stroke: '#0284C7',
          showRightAngles: true
        })}
        ${buildAnswerBarHTML({ label: 'Missing Side ? =', unit })}
      `,
      answer: missing,
      helperText: `Ask: ${known} × ? = ${area}, or divide ${area} ÷ ${known}!`,
      explanationHTML: `
        Since <strong>Area = Length × Width</strong>:<br/>
        <strong>${area} ÷ ${known} = ${missing} ${unit}</strong> (check: ${known} × ${missing} = ${area})!
      `
    };
  }

  // 4B: Missing Side from Perimeter (34%)
  if (roll < 0.70) {
    const L = randInt(4, 15);
    const W = randInt(3, 12);
    const perim = 2 * (L + W);
    const halfP = L + W;
    const hideTop = Math.random() < 0.5;
    const known = hideTop ? W : L;
    const missing = hideTop ? L : W;

    return {
      dedupeKey: `ms_perim_${L}x${W}_${hideTop ? 't' : 'l'}`,
      domainId: 'mystery-sides',
      skillKey: 'missing_side_perim',
      skillLabel: 'Finding Missing Side from Perimeter',
      topicLabel: 'Perimeter Vault Clue',
      inputType: 'numpad',
      fluencySeconds: 24,
      prompt: `The laser fence has <strong>Perimeter = ${perim} ${unit}</strong> and one side is <strong>${known} ${unit}</strong>. What is the missing <strong>?</strong> side?`,
      promptText: `A rectangle has Perimeter ${perim} ${unit} and one side ${known} ${unit}. Find the missing side.`,
      stageHTML: `
        ${buildGoalBannerHTML('🚧 Two sides match! Subtract both known sides from Perimeter, then divide by 2!', 'perim')}
        ${buildRectBlueprintSVG({
          length: L,
          width: W,
          unit,
          labelTop: hideTop ? '?' : L,
          labelLeft: hideTop ? W : '?',
          centerBadge: `Perimeter = ${perim} ${unit}`,
          fill: '#FEF3C7',
          stroke: '#D97706',
          highlightBorder: true,
          showRightAngles: true
        })}
        ${buildAnswerBarHTML({ label: 'Missing Side ? =', unit })}
      `,
      answer: missing,
      helperText: `Step 1: Half of ${perim} is ${halfP} (one Length + one Width). Step 2: ${halfP} − ${known} = ?`,
      explanationHTML: `
        Two sides of ${known} ${unit} use <strong>${2 * known} ${unit}</strong>.<br/>
        Remaining for the other two sides: ${perim} − ${2 * known} = <strong>${2 * missing}</strong> → <strong>${2 * missing} ÷ 2 = ${missing} ${unit}</strong>!
      `
    };
  }

  // 4C: Dual Vault Lock — Both Area AND Perimeter (multi_slot, 30%)
  const L = randInt(3, 12);
  const W = randInt(3, 10);
  const area = L * W;
  const perim = 2 * (L + W);
  const slots = [
    { id: 'area', label: 'Area (Inside)', shortLabel: 'Area', maxDigits: 3, unit: `sq ${unit}` },
    { id: 'perim', label: 'Perimeter (Fence)', shortLabel: 'Perimeter', maxDigits: 3, unit }
  ];

  return {
    dedupeKey: `ms_dual_${L}x${W}`,
    domainId: 'mystery-sides',
    skillKey: 'both_area_and_perim',
    skillLabel: 'Solving Both Area & Perimeter',
    topicLabel: 'Dual Vault Lock',
    inputType: 'multi_slot',
    slots,
    fluencySeconds: 28,
    prompt: 'Help Cori crack the Dual Vault Lock! Enter BOTH the <strong>Area</strong> inside and the <strong>Perimeter</strong> outside:',
    promptText: `Find both Area and Perimeter of a ${L} ${unit} by ${W} ${unit} rectangle.`,
    stageHTML: `
      ${buildGoalBannerHTML('🔐 Dual Lock: Area = Length × Width (inside) • Perimeter = all 4 sides (outside)!', 'mystery')}
      ${buildRectBlueprintSVG({
        length: L,
        width: W,
        unit,
        labelTop: L,
        labelLeft: W,
        fill: '#EDE9FE',
        stroke: '#7C3AED',
        showRightAngles: true
      })}
      ${buildDualAnswerBarHTML(slots)}
    `,
    answer: { area, perim },
    mistakeSummary: `${L} ${unit} × ${W} ${unit} dual lock`,
    helperText: `Area = ${L} × ${W}. Perimeter = ${L} + ${W} + ${L} + ${W}. Tap each box to enter both!`,
    explanationHTML: `
      • <strong>Area</strong> (inside): ${L} × ${W} = <strong>${area} sq ${unit}</strong><br/>
      • <strong>Perimeter</strong> (outside): ${L} + ${W} + ${L} + ${W} = <strong>${perim} ${unit}</strong>!
    `
  };
}
