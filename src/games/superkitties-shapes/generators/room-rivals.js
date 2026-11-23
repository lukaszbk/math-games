import { pick, randInt } from '../../../shared/math.js';
import {
  buildGoalBannerHTML,
  buildGridRoomSVG,
  buildRectBlueprintSVG,
  buildShowdownCardsHTML
} from '../svg-blueprints.js';

const SAME_AREA_PAIRS = [
  [2, 6, 3, 4],
  [2, 8, 4, 4],
  [2, 9, 3, 6],
  [3, 8, 4, 6],
  [2, 10, 4, 5],
  [3, 10, 5, 6],
  [4, 9, 6, 6],
  [2, 12, 4, 6],
  [3, 12, 4, 9]
];

const SAME_PERIM_PAIRS = [
  [2, 8, 4, 6],
  [3, 7, 5, 5],
  [2, 10, 5, 7],
  [3, 9, 6, 6],
  [2, 7, 4, 5],
  [3, 11, 6, 8],
  [4, 10, 7, 7]
];

function roomCardSVG(l, w, unit, useGrid, color) {
  if (useGrid && l <= 10 && w <= 6) {
    return buildGridRoomSVG({
      rows: w,
      cols: l,
      fill: color.fill,
      stroke: color.stroke,
      showDimensions: true,
      unit,
      compact: true
    });
  }
  return buildRectBlueprintSVG({
    length: l,
    width: w,
    unit,
    labelTop: l,
    labelLeft: w,
    fill: color.fill,
    stroke: color.stroke,
    showRightAngles: true,
    compact: true
  });
}

export function genRoomRivals() {
  const roll = Math.random();
  const unit = pick(['m', 'ft']);
  const colorA = { fill: '#FCE7F3', stroke: '#DB2777' };
  const colorB = { fill: '#E0F2FE', stroke: '#0284C7' };

  // 5A: Same Area, Different Perimeter (38%)
  if (roll < 0.38) {
    const [l1, w1, l2, w2] = pick(SAME_AREA_PAIRS);
    const swap = Math.random() < 0.5;
    const roomA = swap ? { l: l2, w: w2 } : { l: l1, w: w1 };
    const roomB = swap ? { l: l1, w: w1 } : { l: l2, w: w2 };
    const pA = 2 * (roomA.l + roomA.w);
    const pB = 2 * (roomB.l + roomB.w);
    const area = roomA.l * roomA.w;
    const wantMore = Math.random() < 0.5;
    const answer = wantMore ? (pA > pB ? 'Room A' : 'Room B') : (pA < pB ? 'Room A' : 'Room B');
    const useGrid = Math.random() < 0.45;

    return {
      dedupeKey: `rr_sadp_${[`${roomA.l}x${roomA.w}`, `${roomB.l}x${roomB.w}`].sort().join('_')}_${wantMore ? 'more' : 'less'}`,
      domainId: 'room-rivals',
      skillKey: 'same_area_diff_perim',
      skillLabel: 'Same Area, Different Perimeter',
      topicLabel: 'Hernado Watch • Perimeter',
      inputType: 'choice',
      fluencySeconds: 26,
      prompt: wantMore
        ? `Both rooms have Area = ${area} sq ${unit}! Tap the room that needs <strong>MORE laser fence (greater Perimeter)</strong>:`
        : `Both rooms have Area = ${area} sq ${unit}! Tap the room that needs <strong>LESS laser fence (smaller Perimeter)</strong>:`,
      promptText: `Compare perimeters of Room A (${roomA.l}×${roomA.w} ${unit}) and Room B (${roomB.l}×${roomB.w} ${unit}) — which has ${wantMore ? 'greater' : 'smaller'} perimeter?`,
      stageHTML: buildShowdownCardsHTML({
        leftTitle: 'Room A',
        rightTitle: 'Room B',
        leftSVG: roomCardSVG(roomA.l, roomA.w, unit, useGrid, colorA),
        rightSVG: roomCardSVG(roomB.l, roomB.w, unit, useGrid, colorB),
        leftSub: `${roomA.l} ${unit} × ${roomA.w} ${unit}`,
        rightSub: `${roomB.l} ${unit} × ${roomB.w} ${unit}`,
        goalHTML: buildGoalBannerHTML(
          wantMore
            ? '🚧 Both Areas match! Which room needs MORE outside fence?'
            : '🚧 Both Areas match! Which room needs LESS outside fence?',
          'perim'
        )
      }),
      choices: [
        { id: 'Room A', label: 'Room A', sub: `${roomA.l} ${unit} × ${roomA.w} ${unit}` },
        { id: 'Room B', label: 'Room B', sub: `${roomB.l} ${unit} × ${roomB.w} ${unit}` }
      ],
      answer,
      helperText: `Add all 4 sides of each room! Room A = ${roomA.l}+${roomA.w}+${roomA.l}+${roomA.w}, Room B = ${roomB.l}+${roomB.w}+${roomB.l}+${roomB.w}.`,
      explanationHTML: `
        Both have Area = <strong>${area} sq ${unit}</strong>, but different Perimeters!<br/>
        • Room A Perimeter: 2 × (${roomA.l} + ${roomA.w}) = <strong>${pA} ${unit}</strong><br/>
        • Room B Perimeter: 2 × (${roomB.l} + ${roomB.w}) = <strong>${pB} ${unit}</strong><br/>
        So <strong>${answer}</strong> wins! (Longer, skinnier rooms need more fence!)
      `
    };
  }

  // 5B: Same Perimeter, Different Area (34%)
  if (roll < 0.72) {
    const [l1, w1, l2, w2] = pick(SAME_PERIM_PAIRS);
    const swap = Math.random() < 0.5;
    const roomA = swap ? { l: l2, w: w2 } : { l: l1, w: w1 };
    const roomB = swap ? { l: l1, w: w1 } : { l: l2, w: w2 };
    const aA = roomA.l * roomA.w;
    const aB = roomB.l * roomB.w;
    const perim = 2 * (roomA.l + roomA.w);
    const wantMore = Math.random() < 0.65;
    const answer = wantMore ? (aA > aB ? 'Room A' : 'Room B') : (aA < aB ? 'Room A' : 'Room B');

    return {
      dedupeKey: `rr_spda_${[`${roomA.l}x${roomA.w}`, `${roomB.l}x${roomB.w}`].sort().join('_')}_${wantMore ? 'more' : 'less'}`,
      domainId: 'room-rivals',
      skillKey: 'same_perim_diff_area',
      skillLabel: 'Same Perimeter, Different Area',
      topicLabel: 'Hernado Watch • Area',
      inputType: 'choice',
      fluencySeconds: 26,
      prompt: wantMore
        ? `Both rooms use ${perim} ${unit} of laser fence! Which room has <strong>MORE floor space (greater Area)</strong>?`
        : `Both rooms use ${perim} ${unit} of laser fence! Which room has <strong>LESS floor space (smaller Area)</strong>?`,
      promptText: `Compare areas of Room A (${roomA.l}×${roomA.w} ${unit}) and Room B (${roomB.l}×${roomB.w} ${unit}) — both have perimeter ${perim} ${unit}.`,
      stageHTML: buildShowdownCardsHTML({
        leftTitle: 'Room A',
        rightTitle: 'Room B',
        leftSVG: roomCardSVG(roomA.l, roomA.w, unit, false, colorA),
        rightSVG: roomCardSVG(roomB.l, roomB.w, unit, false, colorB),
        leftSub: `${roomA.l} ${unit} × ${roomA.w} ${unit}`,
        rightSub: `${roomB.l} ${unit} × ${roomB.w} ${unit}`,
        goalHTML: buildGoalBannerHTML(
          wantMore
            ? '🐾 Both Fences match! Tap the room with MORE floor Area inside!'
            : '🐾 Both Fences match! Tap the room with LESS floor Area inside!',
          'area'
        )
      }),
      choices: [
        { id: 'Room A', label: 'Room A', sub: `${roomA.l} ${unit} × ${roomA.w} ${unit}` },
        { id: 'Room B', label: 'Room B', sub: `${roomB.l} ${unit} × ${roomB.w} ${unit}` }
      ],
      answer,
      helperText: `Multiply Length × Width for both rooms: ${roomA.l} × ${roomA.w} vs ${roomB.l} × ${roomB.w}!`,
      explanationHTML: `
        Both use <strong>${perim} ${unit}</strong> of fence, but hold different floor Areas!<br/>
        • Room A Area: ${roomA.l} × ${roomA.w} = <strong>${aA} sq ${unit}</strong><br/>
        • Room B Area: ${roomB.l} × ${roomB.w} = <strong>${aB} sq ${unit}</strong><br/>
        So <strong>${answer}</strong> wins! (More square-shaped rooms pack in more Area!)
      `
    };
  }

  // 5C: Close-Call Room Watch (with Equal Area! option, 34%)
  const wantTie = Math.random() < 0.34;
  let roomA;
  let roomB;
  if (wantTie) {
    const [l1, w1, l2, w2] = pick(SAME_AREA_PAIRS);
    if (Math.random() < 0.5) {
      roomA = { l: l1, w: w1 };
      roomB = { l: l2, w: w2 };
    } else {
      roomA = { l: l2, w: w2 };
      roomB = { l: l1, w: w1 };
    }
  } else {
    for (let tries = 0; tries < 60; tries++) {
      const l1 = randInt(4, 11);
      const w1 = randInt(3, 9);
      const l2 = randInt(4, 11);
      const w2 = randInt(3, 9);
      const d = Math.abs(l1 * w1 - l2 * w2);
      if (d >= 1 && d <= 6 && (l1 !== l2 || w1 !== w2)) {
        roomA = { l: l1, w: w1 };
        roomB = { l: l2, w: w2 };
        break;
      }
    }
    if (!roomA) {
      roomA = { l: 7, w: 6 };
      roomB = { l: 8, w: 5 };
    }
  }

  const aA = roomA.l * roomA.w;
  const aB = roomB.l * roomB.w;
  const answer = aA === aB ? 'Equal Area!' : (aA > aB ? 'Room A' : 'Room B');

  return {
    dedupeKey: `rr_cmp_${[`${roomA.l}x${roomA.w}`, `${roomB.l}x${roomB.w}`].sort().join('_')}`,
    domainId: 'room-rivals',
    skillKey: 'compare_room_areas',
    skillLabel: 'Comparing Close Room Areas',
    topicLabel: 'Hernado Watch • Compare',
    inputType: 'choice',
    fluencySeconds: 24,
    prompt: 'Help Flame compare both blueprints! Which room has <strong>MORE floor Area</strong>, or are they <strong>Equal Area</strong>?',
    promptText: `Compare areas of Room A (${roomA.l}×${roomA.w} ${unit}) and Room B (${roomB.l}×${roomB.w} ${unit}).`,
    stageHTML: buildShowdownCardsHTML({
      leftTitle: 'Room A',
      rightTitle: 'Room B',
      leftSVG: roomCardSVG(roomA.l, roomA.w, unit, false, colorA),
      rightSVG: roomCardSVG(roomB.l, roomB.w, unit, false, colorB),
      leftSub: `${roomA.l} ${unit} × ${roomA.w} ${unit}`,
      rightSub: `${roomB.l} ${unit} × ${roomB.w} ${unit}`,
      goalHTML: buildGoalBannerHTML('🏆 Multiply BOTH rooms first — watch out for Equal Area ties!', 'area')
    }),
    choices: [
      { id: 'Room A', label: 'Room A', sub: `${roomA.l} ${unit} × ${roomA.w} ${unit}` },
      { id: 'Room B', label: 'Room B', sub: `${roomB.l} ${unit} × ${roomB.w} ${unit}` },
      { id: 'Equal Area!', label: 'Equal Area!', sub: 'Both rooms match' }
    ],
    answer,
    helperText: `Compute ${roomA.l} × ${roomA.w} and ${roomB.l} × ${roomB.w}, then compare!`,
    explanationHTML: aA === aB
      ? `Room A = ${roomA.l} × ${roomA.w} = <strong>${aA} sq ${unit}</strong>, and Room B = ${roomB.l} × ${roomB.w} = <strong>${aB} sq ${unit}</strong> — <strong>Equal Area!</strong>`
      : `Room A = ${roomA.l} × ${roomA.w} = <strong>${aA} sq ${unit}</strong>, Room B = ${roomB.l} × ${roomB.w} = <strong>${aB} sq ${unit}</strong>. <strong>${answer}</strong> has more Area by ${Math.abs(aA - aB)} sq ${unit}!`
  };
}
