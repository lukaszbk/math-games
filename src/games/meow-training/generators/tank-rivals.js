import { pick, randInt } from '../../../shared/math.js';
import { buildPrismBoxSVG } from '../svg-volume.js';

function pickCloseTankPair(waterMode) {
  for (let i = 0; i < 120; i++) {
    const l1 = randInt(2, 6);
    const w1 = randInt(2, 5);
    const h1 = randInt(2, 5);
    const fill1 = waterMode ? randInt(2, h1) : h1;
    const v1 = l1 * w1 * fill1;

    const l2 = randInt(2, 6);
    const w2 = randInt(2, 5);
    const h2 = randInt(2, 5);
    const fill2 = waterMode ? randInt(2, h2) : h2;
    const v2 = l2 * w2 * fill2;

    if (l1 === l2 && w1 === w2 && fill1 === fill2) continue;
    const diff = Math.abs(v1 - v2);
    if (diff >= 1 && diff <= 18 && v1 >= 12 && v2 >= 12 && v1 <= 120 && v2 <= 120) {
      return {
        a: { l: l1, w: w1, h: h1, fill: fill1, vol: v1 },
        b: { l: l2, w: w2, h: h2, fill: fill2, vol: v2 }
      };
    }
  }
  return {
    a: { l: 3, w: 4, h: 5, fill: waterMode ? 4 : 5, vol: waterMode ? 48 : 60 },
    b: { l: 2, w: 6, h: 6, fill: waterMode ? 5 : 6, vol: waterMode ? 60 : 72 }
  };
}

export function genTankRivals() {
  const waterMode = Math.random() < 0.35;
  const unit = pick(['cm', 'in', 'ft']);
  const { a, b } = pickCloseTankPair(waterMode);

  const aWins = a.vol > b.vol;
  const answer = aWins ? 'Tank A' : 'Tank B';
  const cmpSymbol = aWins ? '>' : '&lt;';
  const diff = Math.abs(a.vol - b.vol);

  const subA = waterMode
    ? `${a.l}×${a.w} base • water ${a.fill} ${unit} deep`
    : `${a.l} × ${a.w} × ${a.h} ${unit}`;
  const subB = waterMode
    ? `${b.l}×${b.w} base • water ${b.fill} ${unit} deep`
    : `${b.l} × ${b.w} × ${b.h} ${unit}`;

  const palA = { top: '#D7F3F7', left: '#67E8F9', right: '#1996B0', stroke: '#0E6478' };
  const palB = { top: '#FEF3C7', left: '#FCD34D', right: '#F59E0B', stroke: '#B45309' };

  const svgA = buildPrismBoxSVG({
    length: a.l,
    width: a.w,
    height: a.h,
    unit,
    labelL: a.l,
    labelW: a.w,
    labelH: waterMode ? `${a.fill}/${a.h}` : a.h,
    fillLevel: waterMode ? a.fill : null,
    centerBadge: waterMode ? `Water: ${a.fill} ${unit}` : '',
    palette: palA,
    compact: true
  });

  const svgB = buildPrismBoxSVG({
    length: b.l,
    width: b.w,
    height: b.h,
    unit,
    labelL: b.l,
    labelW: b.w,
    labelH: waterMode ? `${b.fill}/${b.h}` : b.h,
    fillLevel: waterMode ? b.fill : null,
    centerBadge: waterMode ? `Water: ${b.fill} ${unit}` : '',
    palette: palB,
    compact: true
  });

  return {
    dedupeKey: `tr_${waterMode ? 'w' : 'f'}_${a.l}${a.w}${a.fill}_${b.l}${b.w}${b.fill}_${unit}`,
    domainId: 'tank-rivals',
    skillKey: waterMode ? 'vol_tank_water_duel' : 'vol_tank_duel',
    skillLabel: waterMode ? 'Comparing Water Volume in Tanks' : 'Comparing Tank Volumes',
    topicLabel: waterMode ? 'Sea Force Water Duel' : 'Sea Force Tank Duel',
    inputType: 'choice',
    fluencySeconds: 26,
    prompt: waterMode
      ? 'Which crystal Sea Force tank holds <strong>MORE water</strong> right now? Tap the winning tank!'
      : 'Which Sea Force tank has the <strong>GREATER volume</strong>? Multiply both and tap the winner!',
    promptText: waterMode
      ? `Compare water volume: Tank A (${subA}) vs Tank B (${subB}).`
      : `Compare volume: Tank A (${subA}) vs Tank B (${subB}).`,
    stageHTML: `
      <div class="vol-goal-banner">🐠 Goal: Tap the tank with MORE ${waterMode ? 'water' : 'volume'}!</div>
      <div class="vol-duel-grid">
        <button type="button" class="vol-duel-card" data-action="submit-choice" data-index="0">
          <span class="vol-duel-tag">Tank A</span>
          ${svgA}
          <span class="vol-duel-sub">${subA}</span>
          <span class="vol-duel-pick">Tap Tank A!</span>
        </button>
        <div class="vol-duel-vs"><span>VS</span></div>
        <button type="button" class="vol-duel-card" data-action="submit-choice" data-index="1">
          <span class="vol-duel-tag">Tank B</span>
          ${svgB}
          <span class="vol-duel-sub">${subB}</span>
          <span class="vol-duel-pick">Tap Tank B!</span>
        </button>
      </div>
    `,
    choices: [
      { id: 'Tank A', label: 'Tank A', sub: subA },
      { id: 'Tank B', label: 'Tank B', sub: subB }
    ],
    answer,
    helperText: waterMode
      ? `Use the WATER height, not the empty top! Tank A = ${a.l} × ${a.w} × ${a.fill}, Tank B = ${b.l} × ${b.w} × ${b.fill}.`
      : `Multiply L × W × H for each tank: Tank A = ${a.l} × ${a.w} × ${a.h}, Tank B = ${b.l} × ${b.w} × ${b.h}.`,
    mistakeSummary: `Tank A (${a.vol}) vs Tank B (${b.vol})`,
    explanationHTML: `
      Tank A: <strong>${a.l} × ${a.w} × ${a.fill} = ${a.vol} cubic ${unit}</strong> &nbsp;•&nbsp;
      Tank B: <strong>${b.l} × ${b.w} × ${b.fill} = ${b.vol} cubic ${unit}</strong><br/>
      <strong>${a.vol} ${cmpSymbol} ${b.vol}</strong> → <strong>${answer}</strong> holds <strong>${diff} cubic ${unit}</strong> more!
    `
  };
}
