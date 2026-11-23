import { pick, randInt } from '../../../shared/math.js';
import {
  buildAnswerBarHTML,
  buildGoalBannerHTML,
  buildGridRoomSVG,
  buildPolygonPerimeterSVG,
  buildRectBlueprintSVG
} from '../svg-blueprints.js';

function computeGridPerimeter(map) {
  const rows = map.length;
  const cols = map[0].length;
  let perim = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!map[r][c]) continue;
      if (r === 0 || !map[r - 1][c]) perim++;
      if (r === rows - 1 || !map[r + 1][c]) perim++;
      if (c === 0 || !map[r][c - 1]) perim++;
      if (c === cols - 1 || !map[r][c + 1]) perim++;
    }
  }
  return perim;
}

function buildConnectedGardenMap() {
  const roll = Math.random();
  if (roll < 0.35) {
    const rows = randInt(2, 5);
    const cols = randInt(3, 6);
    const map = Array.from({ length: rows }, () => Array(cols).fill(1));
    return { map, rows, cols, name: 'Rectangular Catnip Bed' };
  }
  if (roll < 0.70) {
    // Notch corner or T-shape (no interior holes)
    const rows = randInt(3, 4);
    const cols = randInt(4, 6);
    const notchR = randInt(1, rows - 1);
    const notchC = randInt(1, Math.min(2, cols - 2));
    const map = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => (r < notchR && c >= cols - notchC ? 0 : 1))
    );
    return { map, rows, cols, name: 'Corner-Notch Garden' };
  }
  // Stepped 3-row garden
  const rows = 3;
  const cols = randInt(4, 5);
  const map = [
    Array.from({ length: cols }, (_, c) => (c >= 1 && c <= cols - 2 ? 1 : 0)),
    Array(cols).fill(1),
    Array(cols).fill(1)
  ];
  return { map, rows, cols, name: 'Stepped Kitty Patio' };
}

export function genFencePatrol() {
  const roll = Math.random();

  // 2A: Rectangle Perimeter with only 2 labeled sides (36%)
  if (roll < 0.36) {
    const L = randInt(4, 18);
    const W = randInt(3, 14);
    const unit = pick(['m', 'ft']);
    const perim = 2 * (L + W);

    return {
      dedupeKey: `fp_rect_${L}x${W}`,
      domainId: 'fence-patrol',
      skillKey: 'perim_rectangle',
      skillLabel: 'Rectangle Perimeter (All 4 Sides)',
      topicLabel: 'Laser-Fence Perimeter',
      inputType: 'numpad',
      fluencySeconds: 22,
      prompt: 'Help Cagura wrap a glowing border ribbon around ALL 4 sides of this Kitty Zone. What is the <strong>Perimeter</strong>?',
      promptText: `Find the perimeter of a ${L} ${unit} by ${W} ${unit} rectangle.`,
      stageHTML: `
        ${buildGoalBannerHTML('🚧 Perimeter = distance ALL the way around all 4 outside edges!', 'perim')}
        ${buildRectBlueprintSVG({
          length: L,
          width: W,
          unit,
          labelTop: L,
          labelLeft: W,
          fill: '#FEF3C7',
          stroke: '#D97706',
          highlightBorder: true,
          showRightAngles: true
        })}
        ${buildAnswerBarHTML({ label: 'Perimeter =', unit })}
      `,
      answer: perim,
      helperText: `Opposite sides of a rectangle match! Add all 4 sides: ${L} + ${W} + ${L} + ${W}.`,
      explanationHTML: `
        Opposite sides are equal: top &amp; bottom are <strong>${L} ${unit}</strong>, left &amp; right are <strong>${W} ${unit}</strong>.<br/>
        <strong>Perimeter = ${L} + ${W} + ${L} + ${W} = ${perim} ${unit}</strong>!
      `
    };
  }

  // 2B: Polygon Perimeter (34%)
  if (roll < 0.70) {
    const unit = pick(['ft', 'm', 'cm']);
    const shapeRoll = Math.random();
    let kind;
    let sides;
    let shapeName;
    let sumExpr;

    if (shapeRoll < 0.20) {
      kind = 'triangle';
      const a = randInt(5, 16);
      const b = randInt(4, 14);
      sides = [a, b, a];
      shapeName = 'Triangle Shield';
      sumExpr = `${a} + ${b} + ${a}`;
    } else if (shapeRoll < 0.40) {
      kind = 'trapezoid';
      const top = randInt(5, 11);
      const bottom = top + randInt(3, 8);
      const leg = randInt(4, 11);
      sides = [top, leg, bottom, leg];
      shapeName = 'Trapezoid Pad';
      sumExpr = `${top} + ${leg} + ${bottom} + ${leg}`;
    } else if (shapeRoll < 0.58) {
      kind = 'pentagon';
      const s = randInt(4, 12);
      sides = [s, s, s, s, s];
      shapeName = '5-Sided Pentagon Badge';
      sumExpr = `5 × ${s}`;
    } else if (shapeRoll < 0.76) {
      kind = 'hexagon';
      const s = randInt(3, 11);
      sides = [s, s, s, s, s, s];
      shapeName = '6-Sided Hexagon Shield';
      sumExpr = `6 × ${s}`;
    } else if (shapeRoll < 0.88) {
      kind = 'octagon';
      const s = randInt(3, 9);
      sides = [s, s, s, s, s, s, s, s];
      shapeName = '8-Sided Octagon Arena';
      sumExpr = `8 × ${s}`;
    } else {
      kind = 'house';
      const roof = randInt(5, 11);
      const wall = randInt(4, 10);
      const base = randInt(6, 12);
      sides = [roof, roof, wall, base, wall];
      shapeName = '5-Sided Kitty House';
      sumExpr = `${roof} + ${roof} + ${wall} + ${base} + ${wall}`;
    }

    const perim = sides.reduce((acc, v) => acc + v, 0);

    return {
      dedupeKey: `fp_poly_${kind}_${sides.join('_')}`,
      domainId: 'fence-patrol',
      skillKey: 'perim_polygon',
      skillLabel: 'Polygon Border Perimeters',
      topicLabel: 'Polygon Perimeter',
      inputType: 'numpad',
      fluencySeconds: 22,
      prompt: `Add every outer side of this <strong>${shapeName}</strong> to find its <strong>Perimeter</strong>:`,
      promptText: `Find the perimeter of a ${shapeName} with sides ${sides.join(', ')} ${unit}.`,
      stageHTML: `
        ${buildGoalBannerHTML('🎀 Add every outer side around the polygon border!', 'perim')}
        ${buildPolygonPerimeterSVG({ kind, sides, unit })}
        ${buildAnswerBarHTML({ label: 'Perimeter =', unit })}
      `,
      answer: perim,
      helperText: `Walk around the polygon and add all ${sides.length} sides: ${sumExpr}!`,
      explanationHTML: `
        Add all <strong>${sides.length} outer sides</strong>:<br/>
        <strong>${sumExpr} = ${perim} ${unit}</strong>!
      `
    };
  }

  // 2C: Unit-Grid Outer Edge Perimeter Walk (30%)
  const garden = buildConnectedGardenMap();
  const perim = computeGridPerimeter(garden.map);

  return {
    dedupeKey: `fp_grid_${garden.name}_${garden.rows}x${garden.cols}_${perim}`,
    domainId: 'fence-patrol',
    skillKey: 'perim_grid_shape',
    skillLabel: 'Unit-Grid Outer Fence Counting',
    topicLabel: 'Grid Fence Walk',
    inputType: 'numpad',
    fluencySeconds: 24,
    prompt: `Count the glowing <strong>outer fence edges</strong> around this <strong>${garden.name}</strong> (skip inside lines!):`,
    promptText: `Count the outer unit edges (perimeter) of the ${garden.name} (${perim} units).`,
    stageHTML: `
      ${buildGoalBannerHTML('⚡ Perimeter = count ONLY the glowing outside edges (NOT inside squares)!', 'perim')}
      ${buildGridRoomSVG({
        rows: garden.rows,
        cols: garden.cols,
        cellMap: garden.map,
        fill: '#FEF3C7',
        stroke: '#D97706',
        highlightPerimeter: true
      })}
      ${buildAnswerBarHTML({ label: 'Outer Perimeter =', unit: 'units' })}
    `,
    answer: perim,
    helperText: 'Trace one step at a time along the glowing orange fence around the outside — do NOT count inside tile squares!',
    explanationHTML: `
      Walking all the way around the glowing outside boundary counts <strong>${perim} edge units</strong>!<br/>
      (Remember: Perimeter counts outside <em>edges</em>; Area counts inside <em>squares</em>.)
    `
  };
}
