import { pick, randInt } from '../../../shared/math.js';
import {
  buildAnswerBarHTML,
  buildGoalBannerHTML,
  buildGridRoomSVG,
  buildRectBlueprintSVG
} from '../svg-blueprints.js';

const ROOM_THEMES = [
  { name: 'Meow-Meow’s Rainbow Tile Room', fill: '#FCE7F3', stroke: '#DB2777' },
  { name: 'Kiki’s Starlight Terrace', fill: '#EDE9FE', stroke: '#7C3AED' },
  { name: 'Misha’s Lantern Patio', fill: '#E0F2FE', stroke: '#0284C7' },
  { name: 'Anna’s Sunny Cookie Kitchen', fill: '#DCFCE7', stroke: '#16A34A' }
];

function buildIrregularCellMap(kind) {
  if (kind === 't_room') {
    const topW = pick([5, 6, 7]);
    const stemW = topW % 2 === 0 ? 2 : 3;
    const stemH = randInt(2, 3);
    const topH = randInt(2, 3);
    const rows = topH + stemH;
    const cols = topW;
    const padLeft = Math.floor((cols - stemW) / 2);
    const map = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => {
        if (r < topH) return 1;
        return c >= padLeft && c < padLeft + stemW ? 1 : 0;
      })
    );
    return { map, rows, cols, label: 'T-shaped Kitty Hall' };
  }

  if (kind === 'stairs') {
    const steps = pick([4, 5, 6]);
    const rows = steps;
    const cols = steps + 1;
    const flip = Math.random() < 0.5;
    const map = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => {
        const activeCount = r + 2;
        return flip ? c >= cols - activeCount : c < activeCount;
      })
    );
    return { map, rows, cols, label: 'Stepped Kitty Tower' };
  }

  if (kind === 'plus_den') {
    const rows = 5;
    const cols = pick([5, 6, 7]);
    const midC = Math.floor(cols / 2);
    const armW = cols === 6 ? 2 : 3;
    const startC = cols === 6 ? 2 : midC - 1;
    const map = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => {
        if (r >= 1 && r <= 3) return 1;
        return c >= startC && c < startC + armW ? 1 : 0;
      })
    );
    return { map, rows, cols, label: 'Plus-Shaped Hero Den' };
  }

  // courtyard with fountain cutout
  const rows = randInt(4, 5);
  const cols = randInt(5, 7);
  const holeR = Math.floor(rows / 2);
  const holeC1 = Math.floor((cols - 1) / 2);
  const holeW = cols >= 6 && Math.random() < 0.5 ? 2 : 1;
  const map = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      if (r === holeR && c >= holeC1 && c < holeC1 + holeW) return 0;
      return 1;
    })
  );
  return {
    map,
    rows,
    cols,
    label: 'Garden Courtyard (skip the fountain!)',
    cutoutLabel: '⛲',
    holeCount: holeW
  };
}

function countMapCells(map) {
  return map.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
}

export function genTileRooms() {
  const roll = Math.random();
  const theme = pick(ROOM_THEMES);

  // 1A: Paw-Tile Grid Rectangles (35%)
  if (roll < 0.35) {
    const rows = randInt(2, 9);
    const cols = randInt(3, 10);
    const area = rows * cols;
    const showDims = Math.random() < 0.68;

    return {
      dedupeKey: `tr_grid_${rows}x${cols}`,
      domainId: 'tile-rooms',
      skillKey: 'area_rect_grid',
      skillLabel: 'Counting & Multiplying Tile Grids',
      topicLabel: 'Paw-Tile Room Area',
      inputType: 'numpad',
      fluencySeconds: 20,
      prompt: `How many <strong>square units</strong> cover the floor of <strong>${theme.name}</strong>?`,
      promptText: `Find the area in square units of a ${rows} by ${cols} tile grid (${theme.name}).`,
      stageHTML: `
        ${buildGoalBannerHTML('🐾 Area = total square tiles covering the INSIDE floor!', 'area')}
        ${buildGridRoomSVG({ rows, cols, fill: theme.fill, stroke: theme.stroke, showDimensions: showDims })}
        ${buildAnswerBarHTML({ label: 'Room Area =', unit: 'sq units' })}
      `,
      answer: area,
      helperText: `Count ${rows} rows with ${cols} tiles in each row: ${rows} × ${cols}!`,
      explanationHTML: `
        There are <strong>${rows} rows</strong> of <strong>${cols} square tiles</strong>.<br/>
        <strong>Area = ${rows} × ${cols} = ${area} square units</strong>!
      `
    };
  }

  // 1B: Irregular Grid Rooms & Courtyard Cutouts (32%)
  if (roll < 0.67) {
    let spec;
    let area = 0;
    for (let tries = 0; tries < 25; tries++) {
      const kind = pick(['t_room', 'stairs', 'plus_den', 'courtyard']);
      spec = buildIrregularCellMap(kind);
      area = countMapCells(spec.map);
      if (area >= 10 && area <= 42) break;
    }

    const rowCounts = spec.map.map(r => r.filter(Boolean).length);
    const rowSumStr = rowCounts.join(' + ');

    return {
      dedupeKey: `tr_irreg_${spec.label}_${spec.rows}x${spec.cols}_${area}`,
      domainId: 'tile-rooms',
      skillKey: 'area_irregular_grid',
      skillLabel: 'Irregular Grid & Cutout Area',
      topicLabel: 'Garden Tile Count',
      inputType: 'numpad',
      fluencySeconds: 24,
      prompt: `Count every colored square tile in the <strong>${spec.label}</strong> to find its Area:`,
      promptText: `Count the square units in the ${spec.label} (${spec.rows} rows, total ${area} tiles).`,
      stageHTML: `
        ${buildGoalBannerHTML('🌱 Count only the colored floor tiles inside the room!', 'area')}
        ${buildGridRoomSVG({
          rows: spec.rows,
          cols: spec.cols,
          cellMap: spec.map,
          fill: theme.fill,
          stroke: theme.stroke,
          cutoutLabel: spec.cutoutLabel || ''
        })}
        ${buildAnswerBarHTML({ label: 'Total Area =', unit: 'sq units' })}
      `,
      answer: area,
      helperText: spec.cutoutLabel
        ? `Find the full ${spec.rows} × ${spec.cols} rectangle (${spec.rows * spec.cols}), then subtract the ${spec.holeCount} fountain tile(s)!`
        : 'Count row by row from top to bottom and add each row’s tiles together!',
      explanationHTML: spec.cutoutLabel
        ? `Full rectangle = ${spec.rows} × ${spec.cols} = <strong>${spec.rows * spec.cols}</strong>, minus ${spec.holeCount} fountain tile(s) = <strong>${area} square units</strong>!`
        : `Counting row by row: <strong>${rowSumStr} = ${area} square units</strong>!`
    };
  }

  // 1C: Dimension-Only Room Blueprints (33%)
  const length = randInt(4, 12);
  const width = randInt(3, 10);
  const unit = pick(['m', 'ft', 'yd']);
  const area = length * width;

  return {
    dedupeKey: `tr_mult_${length}x${width}`,
    domainId: 'tile-rooms',
    skillKey: 'area_rect_multiply',
    skillLabel: 'Multiplying Length × Width for Area',
    topicLabel: 'Blueprint Area',
    inputType: 'numpad',
    fluencySeconds: 20,
    prompt: `What is the <strong>Area</strong> of this rectangular <strong>${theme.name}</strong> blueprint?`,
    promptText: `Find the area of a ${length} ${unit} by ${width} ${unit} rectangle.`,
    stageHTML: `
      ${buildGoalBannerHTML('📐 Rectangle Area = Length × Width (square units inside!)', 'area')}
      ${buildRectBlueprintSVG({
        length,
        width,
        unit,
        labelTop: length,
        labelLeft: width,
        fill: theme.fill,
        stroke: theme.stroke,
        showRightAngles: true
      })}
      ${buildAnswerBarHTML({ label: 'Area =', unit: `sq ${unit}` })}
    `,
    answer: area,
    helperText: `Multiply the two side lengths: ${length} × ${width}!`,
    explanationHTML: `
      <strong>Area = Length × Width</strong><br/>
      <strong>${length} ${unit} × ${width} ${unit} = ${area} sq ${unit}</strong>!
    `
  };
}
