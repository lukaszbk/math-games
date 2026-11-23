import { pick, randInt, shuffle } from '../../../shared/math.js';
import {
  buildAnswerBarHTML,
  buildGoalBannerHTML,
  buildShapeShieldSVG
} from '../svg-blueprints.js';

const QUAD_CHOICE_NAMES = [
  'Square',
  'Rectangle',
  'Rhombus',
  'Parallelogram',
  'Trapezoid',
  'Quadrilateral'
];

const QUAD_CLASSIFY_POOL = [
  {
    id: 'square',
    name: 'Square',
    focusShape: 'square',
    reason: '4 equal sides (single tick marks) AND 4 right angles (90° corner boxes) make it a Square!'
  },
  {
    id: 'tilted_square',
    name: 'Square',
    focusShape: 'tilted_square',
    reason: 'Even tilted like a diamond, 4 equal sides AND 4 right-angle (90°) corner boxes STILL make it a Square!'
  },
  {
    id: 'rectangle',
    name: 'Rectangle',
    focusShape: 'rectangle',
    reason: '4 right angles (90° corner boxes) and opposite sides equal (long vs short) make it a Rectangle!'
  },
  {
    id: 'rhombus',
    name: 'Rhombus',
    focusShape: 'rhombus',
    reason: '4 equal sides (all single ticks) and 2 pairs of parallel sides, with NO right angles, make it a Rhombus!'
  },
  {
    id: 'parallelogram',
    name: 'Parallelogram',
    focusShape: 'parallelogram',
    reason: '2 pairs of parallel opposite sides (1 pair with single arrows, 1 pair with double arrows) and no right angles make it a Parallelogram!'
  },
  {
    id: 'trapezoid',
    name: 'Trapezoid',
    focusShape: 'trapezoid',
    reason: 'Exactly ONE pair of parallel sides (arrows only on top and bottom) makes it a Trapezoid!'
  },
  {
    id: 'right_trapezoid',
    name: 'Trapezoid',
    focusShape: 'right_trapezoid',
    reason: 'Even with two 90° right corners on the left, having exactly ONE pair of parallel sides makes it a Trapezoid!'
  },
  {
    id: 'general_quad',
    name: 'Quadrilateral',
    focusShape: 'general_quad',
    reason: 'It has 4 sides, NO equal sides, NO parallel sides, and NO right angles — so its best name is Quadrilateral!'
  }
];

const POLYGON_CLASSIFY_POOL = [
  {
    id: 'right_triangle',
    name: 'Right Triangle',
    focusShape: 'right_triangle',
    distractors: ['Equilateral Triangle', 'Isosceles Triangle', 'Trapezoid', 'Pentagon'],
    reason: '3 sides with ONE 90° right-angle corner box make it a Right Triangle!'
  },
  {
    id: 'equilateral_triangle',
    name: 'Equilateral Triangle',
    focusShape: 'equilateral_triangle',
    distractors: ['Right Triangle', 'Isosceles Triangle', 'Square', 'Pentagon'],
    reason: '3 sides that are ALL equal in length (3 single tick marks) make it an Equilateral Triangle!'
  },
  {
    id: 'isosceles_triangle',
    name: 'Isosceles Triangle',
    focusShape: 'isosceles_triangle',
    distractors: ['Equilateral Triangle', 'Right Triangle', 'Trapezoid', 'Hexagon'],
    reason: 'A 3-sided triangle with TWO equal sides (check the 2 tick marks!) and no 90° corner is an Isosceles Triangle!'
  },
  {
    id: 'pentagon',
    name: 'Pentagon',
    focusShape: 'pentagon',
    distractors: ['Hexagon', 'Octagon', 'Quadrilateral', 'Equilateral Triangle'],
    reason: 'Count the edges: 5 sides and 5 vertices make it a Pentagon!'
  },
  {
    id: 'house_pentagon',
    name: 'Pentagon',
    focusShape: 'house_pentagon',
    distractors: ['Hexagon', 'Octagon', 'Quadrilateral', 'Trapezoid'],
    reason: 'Count all 5 edges (2 roof edges + 2 walls + 1 floor = 5 sides)! Any 5-sided polygon is a Pentagon!'
  },
  {
    id: 'hexagon',
    name: 'Hexagon',
    focusShape: 'hexagon',
    distractors: ['Pentagon', 'Octagon', 'Quadrilateral', 'Equilateral Triangle'],
    reason: 'Count the edges: 6 sides and 6 vertices make it a Hexagon!'
  },
  {
    id: 'octagon',
    name: 'Octagon',
    focusShape: 'octagon',
    distractors: ['Hexagon', 'Pentagon', 'Quadrilateral', 'Square'],
    reason: 'Count the edges like a stop sign: 8 sides and 8 vertices make it an Octagon!'
  }
];

const ATTRIBUTE_CLUES = [
  {
    key: 'rhombus_not_square',
    clue: 'Which shield is a <strong>Rhombus</strong> that is <strong>NOT a square</strong>?',
    promptText: 'Which shield is a rhombus that is not a square?',
    target: 'rhombus',
    distractors: ['square', 'tilted_square', 'rectangle', 'parallelogram', 'trapezoid'],
    explain: 'A Rhombus has 4 equal sides (all single ticks). Unlike a square, its corners are NOT 90° right angles!'
  },
  {
    key: 'tilted_square_match',
    clue: 'Which shield is STILL a <strong>Square</strong> even though it is tilted on a corner?',
    promptText: 'Which tilted shield is still a square?',
    target: 'tilted_square',
    distractors: ['rhombus', 'parallelogram', 'trapezoid', 'general_quad'],
    explain: 'Look for 4 equal single-tick sides AND 4 orange 90° corner boxes! Turning a square does not change its shape!'
  },
  {
    key: 'square_both',
    clue: 'Which shield has <strong>4 equal sides</strong> AND <strong>4 right angles</strong>?',
    promptText: 'Which shield has 4 equal sides and 4 right angles?',
    target: 'square',
    distractors: ['rectangle', 'rhombus', 'parallelogram', 'trapezoid'],
    explain: 'Only the Square has BOTH 4 equal sides (all single ticks) AND 4 right-angle corner boxes!'
  },
  {
    key: 'rect_right_angles',
    clue: 'Which shield has <strong>4 right angles</strong> with <strong>opposite sides equal</strong> (not all 4 sides equal)?',
    promptText: 'Which shield is a rectangle with 4 right angles and opposite sides equal?',
    target: 'rectangle',
    distractors: ['square', 'tilted_square', 'rhombus', 'parallelogram', 'trapezoid'],
    explain: 'The Rectangle has 4 orange 90° corner boxes AND longer top/bottom edges than left/right edges!'
  },
  {
    key: 'trapezoid_one_pair',
    clue: 'Which shield is a <strong>Trapezoid</strong> (exactly <strong>1 pair</strong> of parallel sides, no right angles)?',
    promptText: 'Which shield is a trapezoid with exactly 1 pair of parallel sides and no right angles?',
    target: 'trapezoid',
    distractors: ['square', 'rectangle', 'rhombus', 'parallelogram', 'general_quad'],
    explain: 'Look for parallel arrows on ONLY ONE pair of opposite sides (top and bottom) and slanted sides without 90° corners!'
  },
  {
    key: 'right_trapezoid_match',
    clue: 'Which shield has <strong>exactly 1 pair of parallel sides</strong> AND <strong>2 right-angle (90°) corners</strong>?',
    promptText: 'Which shield has exactly 1 pair of parallel sides and 2 right-angle corners?',
    target: 'right_trapezoid',
    distractors: ['trapezoid', 'rectangle', 'parallelogram', 'rhombus'],
    explain: 'That Right Trapezoid has top & bottom parallel arrows PLUS 2 orange 90° corner boxes on the left!'
  },
  {
    key: 'parallelogram_unequal',
    clue: 'Which shape has <strong>2 pairs of parallel sides</strong>, <strong>NO right angles</strong>, and <strong>unequal adjacent sides</strong>?',
    promptText: 'Which shield is a parallelogram with no right angles and unequal adjacent sides?',
    target: 'parallelogram',
    distractors: ['square', 'rectangle', 'rhombus', 'trapezoid'],
    explain: 'The slanted Parallelogram has 2 pairs of parallel arrows, 1-tick vs 2-tick unequal adjacent sides, and no 90° corners!'
  },
  {
    key: 'general_quad_match',
    clue: 'Which 4-sided shield has <strong>NO parallel sides</strong>, <strong>NO equal sides</strong>, and <strong>NO right angles</strong>?',
    promptText: 'Which quadrilateral shield has no parallel sides, no equal sides, and no right angles?',
    target: 'general_quad',
    distractors: ['trapezoid', 'parallelogram', 'rhombus', 'rectangle'],
    explain: 'Every other choice has parallel arrows or 90° boxes. Only the irregular Quadrilateral has none of them!'
  },
  {
    key: 'right_triangle_1',
    clue: 'Which shield is a <strong>Right Triangle</strong> (3 sides with one 90° corner)?',
    promptText: 'Which shield is a right triangle?',
    target: 'right_triangle',
    distractors: ['equilateral_triangle', 'isosceles_triangle', 'trapezoid', 'pentagon'],
    explain: 'A triangle has 3 sides, and the Right Triangle has a 90° square corner box at the bottom-left!'
  },
  {
    key: 'equilateral_triangle_all',
    clue: 'Which triangle has <strong>ALL 3 sides equal</strong> in length (3 single tick marks)?',
    promptText: 'Which triangle has all 3 sides equal in length?',
    target: 'equilateral_triangle',
    distractors: ['right_triangle', 'isosceles_triangle', 'square', 'pentagon'],
    explain: 'All 3 edges of the Equilateral Triangle show single tick marks because all 3 sides match!'
  },
  {
    key: 'isosceles_triangle_two',
    clue: 'Which triangle has <strong>exactly 2 equal sides</strong> (look for 2 tick marks)?',
    promptText: 'Which triangle has exactly 2 equal sides?',
    target: 'isosceles_triangle',
    distractors: ['equilateral_triangle', 'right_triangle', 'parallelogram', 'pentagon'],
    explain: 'An Isosceles Triangle has 2 matching sides (single ticks on left and right) and 1 different base!'
  },
  {
    key: 'pentagon_5',
    clue: 'Which shield is a regular <strong>Pentagon</strong> (<strong>5 equal sides</strong>)?',
    promptText: 'Which shield is a regular 5-sided pentagon?',
    target: 'pentagon',
    distractors: ['hexagon', 'octagon', 'square', 'rhombus'],
    explain: 'Count the edges: a regular Pentagon has <strong>5 equal sides</strong> and 5 vertices!'
  },
  {
    key: 'house_pentagon_5',
    clue: 'Which shield is a <strong>5-sided Pentagon</strong> shaped like a house with <strong>2 right angles</strong>?',
    promptText: 'Which shield is a house-shaped 5-sided pentagon with 2 right angles?',
    target: 'house_pentagon',
    distractors: ['square', 'trapezoid', 'hexagon', 'octagon'],
    explain: 'Count the edges around the house shape: 5 sides total and two 90° floor corners make it a Pentagon!'
  },
  {
    key: 'hexagon_6',
    clue: 'Which shield is a <strong>Hexagon</strong> (<strong>6 sides</strong>)?',
    promptText: 'Which shield is a 6-sided hexagon?',
    target: 'hexagon',
    distractors: ['pentagon', 'house_pentagon', 'octagon', 'square', 'trapezoid'],
    explain: 'Count the edges: a Hexagon always has <strong>6 sides</strong> and 6 vertices!'
  },
  {
    key: 'octagon_8',
    clue: 'Which shield is an <strong>Octagon</strong> (<strong>8 sides</strong>)?',
    promptText: 'Which shield is an 8-sided octagon?',
    target: 'octagon',
    distractors: ['hexagon', 'pentagon', 'house_pentagon', 'parallelogram'],
    explain: 'Like a stop sign, an Octagon always has <strong>8 sides</strong>!'
  }
];

const RIGHT_ANGLE_SHAPES = [
  { id: 'square', name: 'Square', count: 4 },
  { id: 'tilted_square', name: 'Tilted Square', count: 4 },
  { id: 'rectangle', name: 'Rectangle', count: 4 },
  { id: 'right_trapezoid', name: 'Right Trapezoid', count: 2 },
  { id: 'house_pentagon', name: 'House Pentagon', count: 2 },
  { id: 'right_triangle', name: 'Right Triangle', count: 1 },
  { id: 'rhombus', name: 'Rhombus', count: 0 },
  { id: 'parallelogram', name: 'Parallelogram', count: 0 },
  { id: 'trapezoid', name: 'Trapezoid', count: 0 },
  { id: 'hexagon', name: 'Regular Hexagon', count: 0 },
  { id: 'equilateral_triangle', name: 'Equilateral Triangle', count: 0 }
];

const PARALLEL_PAIR_SHAPES = [
  { id: 'square', name: 'Square', pairs: 2 },
  { id: 'rectangle', name: 'Rectangle', pairs: 2 },
  { id: 'rhombus', name: 'Rhombus', pairs: 2 },
  { id: 'parallelogram', name: 'Parallelogram', pairs: 2 },
  { id: 'trapezoid', name: 'Trapezoid', pairs: 1 },
  { id: 'right_trapezoid', name: 'Right Trapezoid', pairs: 1 },
  { id: 'general_quad', name: 'Quadrilateral', pairs: 0 },
  { id: 'right_triangle', name: 'Right Triangle', pairs: 0 },
  { id: 'equilateral_triangle', name: 'Equilateral Triangle', pairs: 0 }
];

const VERTEX_COUNT_SHAPES = [
  { id: 'equilateral_triangle', name: 'Triangle', vertices: 3 },
  { id: 'isosceles_triangle', name: 'Isosceles Triangle', vertices: 3 },
  { id: 'general_quad', name: 'Quadrilateral', vertices: 4 },
  { id: 'pentagon', name: 'Pentagon', vertices: 5 },
  { id: 'house_pentagon', name: 'House Pentagon', vertices: 5 },
  { id: 'hexagon', name: 'Hexagon', vertices: 6 },
  { id: 'octagon', name: 'Octagon', vertices: 8 }
];

const BADGE_SIDE_COUNTS = [
  { id: 'equilateral_triangle', name: 'Triangle', sides: 3 },
  { id: 'square', name: 'Square', sides: 4 },
  { id: 'pentagon', name: 'Pentagon', sides: 5 },
  { id: 'hexagon', name: 'Hexagon', sides: 6 },
  { id: 'octagon', name: 'Octagon', sides: 8 }
];

export function genShapeAcademy() {
  const roll = Math.random();

  // 6A: Quadrilateral Shield Detective (22%)
  if (roll < 0.22) {
    const target = pick(QUAD_CLASSIFY_POOL);
    const distractors = shuffle(QUAD_CHOICE_NAMES.filter(n => n !== target.name)).slice(0, 3);
    const ordered = shuffle([target.name, ...distractors]);

    return {
      dedupeKey: `sa_quad_${target.id}`,
      focusShape: target.focusShape,
      domainId: 'shape-academy',
      skillKey: 'quad_classify',
      skillLabel: 'Classifying Quadrilateral Shields',
      topicLabel: 'Quadrilateral Detective',
      inputType: 'choice',
      fluencySeconds: 20,
      prompt: 'Check the corner boxes (90°), tick marks (equal sides), and arrows (parallel)! What is the <strong>MOST SPECIFIC name</strong> for this shield?',
      promptText: `What is the most specific name for this ${target.name} quadrilateral shield?`,
      stageHTML: `
        ${buildGoalBannerHTML('💎 Blue arrows = parallel • Tick marks = equal length • Corner box = 90° right angle!', 'shape')}
        ${buildShapeShieldSVG({ shapeId: target.id, showTicks: true, showRightAngles: true, showParallel: true })}
      `,
      choices: ordered.map(name => ({ id: name, label: name })),
      answer: target.name,
      helperText: 'Check 3 clues: (1) How many pairs of parallel arrows? (2) Which sides have matching ticks? (3) Are there 90° corner boxes?',
      explanationHTML: `This shield is a <strong>${target.name}</strong>! ${target.reason}`
    };
  }

  // 6B: Triangles & Polygons Classifier (18%)
  if (roll < 0.40) {
    const target = pick(POLYGON_CLASSIFY_POOL);
    const distractors = shuffle(target.distractors).slice(0, 3);
    const ordered = shuffle([target.name, ...distractors]);

    return {
      dedupeKey: `sa_poly_${target.id}`,
      focusShape: target.focusShape,
      domainId: 'shape-academy',
      skillKey: 'polygon_classify',
      skillLabel: 'Identifying Triangles & Polygons',
      topicLabel: 'Polygon Patrol',
      inputType: 'choice',
      fluencySeconds: 18,
      prompt: 'Count the sides and check any tick marks or 90° corner boxes! What <strong>polygon</strong> is this SuperKitty shield?',
      promptText: `Identify the polygon shield (${target.name}).`,
      stageHTML: `
        ${buildGoalBannerHTML('🛡️ Count every side carefully, and look for equal-side ticks or a 90° right corner!', 'shape')}
        ${buildShapeShieldSVG({ shapeId: target.id, showTicks: true, showRightAngles: true, showParallel: true })}
      `,
      choices: ordered.map(name => ({ id: name, label: name })),
      answer: target.name,
      helperText: 'Triangles have 3 sides, Pentagons have 5 sides, Hexagons have 6 sides, and Octagons have 8 sides!',
      explanationHTML: `This shield is a <strong>${target.name}</strong>! ${target.reason}`
    };
  }

  // 6C: Tap the Matching Shield (4 clickable SVG cards on stage, 22%)
  if (roll < 0.62) {
    const spec = pick(ATTRIBUTE_CLUES);
    const pickedDistractors = shuffle(spec.distractors).slice(0, 3);
    const cards = shuffle([spec.target, ...pickedDistractors]);
    const letters = ['A', 'B', 'C', 'D'];
    const targetIdx = cards.indexOf(spec.target);
    const answerLabel = `Shield ${letters[targetIdx]}`;

    return {
      dedupeKey: `sa_match_${spec.key}`,
      focusShape: spec.target,
      domainId: 'shape-academy',
      skillKey: 'shape_attribute_match',
      skillLabel: 'Matching Polygons by Attributes',
      topicLabel: 'Shield Matcher',
      inputType: 'choice',
      fluencySeconds: 22,
      prompt: spec.clue,
      promptText: spec.promptText,
      stageHTML: `
        ${buildGoalBannerHTML('🛡️ Tap the matching SuperKitty Shield below!', 'shape')}
        <div class="sk-shields-grid">
          ${cards.map((sid, idx) => `
            <button type="button" class="sk-shield-card" data-action="submit-choice" data-index="${idx}">
              <span class="sk-shield-letter">Shield ${letters[idx]}</span>
              ${buildShapeShieldSVG({ shapeId: sid, showTicks: true, showRightAngles: true, showParallel: true, compact: true })}
            </button>
          `).join('')}
        </div>
      `,
      choices: letters.map(L => ({ id: `Shield ${L}`, label: `Shield ${L}` })),
      answer: answerLabel,
      helperText: 'Check the number of sides, tick marks, orange 90° right-angle boxes, and blue parallel arrows on all 4 shields!',
      explanationHTML: `<strong>${answerLabel}</strong> is the right match! ${spec.explain}`
    };
  }

  // 6D: Right Angles, Parallel Side Pairs & Vertices (numpad, 20%)
  if (roll < 0.82) {
    const subRoll = Math.random();
    if (subRoll < 0.45) {
      const spec = pick(RIGHT_ANGLE_SHAPES);
      return {
        dedupeKey: `sa_rangles_${spec.id}`,
        focusShape: spec.id,
        domainId: 'shape-academy',
        skillKey: 'polygon_sides_angles',
        skillLabel: 'Right Angles, Parallel Sides & Vertices',
        topicLabel: 'Right-Angle Hunt',
        inputType: 'numpad',
        fluencySeconds: 18,
        prompt: `How many <strong>right-angle (90°)</strong> square corners does this <strong>${spec.name}</strong> have?`,
        promptText: `How many 90-degree right angles does a ${spec.name} have?`,
        stageHTML: `
          ${buildGoalBannerHTML('📐 A right angle looks like an exact square L-corner (like the corner of a card)!', 'shape')}
          ${buildShapeShieldSVG({ shapeId: spec.id, showTicks: false, showRightAngles: false, showParallel: false })}
          ${buildAnswerBarHTML({ label: 'Right Angles =', unit: 'corners' })}
        `,
        answer: spec.count,
        helperText: 'Test each corner with the square corner of an index card in your mind — slanted corners are NOT 90°!',
        explanationHTML: `A <strong>${spec.name}</strong> has <strong>${spec.count}</strong> right-angle (90°) corner${spec.count === 1 ? '' : 's'}!`
      };
    }

    if (subRoll < 0.75) {
      const spec = pick(PARALLEL_PAIR_SHAPES);
      return {
        dedupeKey: `sa_parallel_${spec.id}`,
        focusShape: spec.id,
        domainId: 'shape-academy',
        skillKey: 'polygon_sides_angles',
        skillLabel: 'Right Angles, Parallel Sides & Vertices',
        topicLabel: 'Parallel Side Pairs',
        inputType: 'numpad',
        fluencySeconds: 18,
        prompt: `How many <strong>pairs of parallel sides</strong> (opposite sides that stay the same distance apart forever) does this <strong>${spec.name}</strong> have?`,
        promptText: `How many pairs of parallel sides does a ${spec.name} have?`,
        stageHTML: `
          ${buildGoalBannerHTML('🛤️ Parallel sides run like train tracks and never cross even if you extend them!', 'shape')}
          ${buildShapeShieldSVG({ shapeId: spec.id, showTicks: false, showRightAngles: false, showParallel: false })}
          ${buildAnswerBarHTML({ label: 'Parallel Pairs =', unit: 'pairs' })}
        `,
        answer: spec.pairs,
        helperText: 'Imagine extending opposite sides past the shield — do top & bottom stay evenly spaced? What about left & right?',
        explanationHTML: `A <strong>${spec.name}</strong> has <strong>${spec.pairs}</strong> pair${spec.pairs === 1 ? '' : 's'} of parallel sides!`
      };
    }

    const spec = pick(VERTEX_COUNT_SHAPES);
    return {
      dedupeKey: `sa_vertices_${spec.id}`,
      focusShape: spec.id,
      domainId: 'shape-academy',
      skillKey: 'polygon_sides_angles',
      skillLabel: 'Right Angles, Parallel Sides & Vertices',
      topicLabel: 'Vertex Counter',
      inputType: 'numpad',
      fluencySeconds: 16,
      prompt: `How many <strong>vertices (corner points)</strong> does this <strong>${spec.name}</strong> shield have?`,
      promptText: `How many vertices does a ${spec.name} have?`,
      stageHTML: `
        ${buildGoalBannerHTML('✨ A vertex is a corner point where two straight sides meet!', 'shape')}
        ${buildShapeShieldSVG({ shapeId: spec.id, showTicks: false, showRightAngles: false, showParallel: false })}
        ${buildAnswerBarHTML({ label: 'Vertices =', unit: 'corners' })}
      `,
      answer: spec.vertices,
      helperText: 'Count around the shield one corner at a time — polygons always have the same number of vertices as sides!',
      explanationHTML: `A <strong>${spec.name}</strong> has <strong>${spec.vertices}</strong> vertices (corners) and ${spec.vertices} sides!`
    };
  }

  // 6E: Multi-Shield Side Sums & Crystal Rod Division (numpad, 18%)
  if (Math.random() < 0.55) {
    const s1 = pick(BADGE_SIDE_COUNTS);
    let s2 = pick(BADGE_SIDE_COUNTS);
    while (s2.id === s1.id) s2 = pick(BADGE_SIDE_COUNTS);
    const count1 = randInt(2, 5);
    const count2 = randInt(2, 4);
    const totalSides = count1 * s1.sides + count2 * s2.sides;
    const collector = pick(['Oliva', 'Kiki', 'Cori', 'Misha', 'Anna']);
    const canonicalTerms = [`${count1}_${s1.id}`, `${count2}_${s2.id}`].sort();

    return {
      dedupeKey: `sa_multi_${canonicalTerms[0]}__${canonicalTerms[1]}`,
      focusShape: 'multi_shields',
      domainId: 'shape-academy',
      skillKey: 'polygon_multi_and_div',
      skillLabel: 'Multi-Shield Sums & Crystal Rod Division',
      topicLabel: 'Polygon Side Count',
      inputType: 'numpad',
      fluencySeconds: 22,
      prompt: `${collector} collects <strong>${count1} ${s1.name}</strong> shields and <strong>${count2} ${s2.name}</strong> shields. How many <strong>total sides</strong> do they have altogether?`,
      promptText: `Total sides of ${count1} ${s1.name} shields and ${count2} ${s2.name} shields.`,
      stageHTML: `
        ${buildGoalBannerHTML('💎 Count the sides on each shield type, multiply, and add!', 'shape')}
        <div class="sk-pair-shields">
          <div class="sk-mini-badge-card">
            <span class="sk-mini-count">${count1} × ${s1.name}</span>
            ${buildShapeShieldSVG({ shapeId: s1.id, showTicks: false, showRightAngles: false, showParallel: false, compact: true })}
          </div>
          <span class="sk-plus-big">+</span>
          <div class="sk-mini-badge-card">
            <span class="sk-mini-count">${count2} × ${s2.name}</span>
            ${buildShapeShieldSVG({ shapeId: s2.id, showTicks: false, showRightAngles: false, showParallel: false, compact: true })}
          </div>
        </div>
        ${buildAnswerBarHTML({ label: 'Total Sides =', unit: 'sides' })}
      `,
      answer: totalSides,
      helperText: `${s1.name} has ${s1.sides} sides; ${s2.name} has ${s2.sides} sides. Compute (${count1} × ${s1.sides}) + (${count2} × ${s2.sides})!`,
      explanationHTML: `
        • ${count1} ${s1.name}s: ${count1} × ${s1.sides} = <strong>${count1 * s1.sides}</strong> sides<br/>
        • ${count2} ${s2.name}s: ${count2} × ${s2.sides} = <strong>${count2 * s2.sides}</strong> sides<br/>
        Total = ${count1 * s1.sides} + ${count2 * s2.sides} = <strong>${totalSides} sides</strong>!
      `
    };
  }

  // Crystal Rod Division
  const spec = pick(BADGE_SIDE_COUNTS);
  const numShields = randInt(3, 9);
  const totalRods = spec.sides * numShields;
  const builder = pick(['Kiki', 'Cuzi', 'Meow-Meow', 'Oliva', 'Cori']);

  return {
    dedupeKey: `sa_div_${spec.id}_${numShields}`,
    focusShape: spec.id,
    domainId: 'shape-academy',
    skillKey: 'polygon_multi_and_div',
    skillLabel: 'Multi-Shield Sums & Crystal Rod Division',
    topicLabel: 'Crystal Rod Division',
    inputType: 'numpad',
    fluencySeconds: 20,
    prompt: `${builder} has <strong>${totalRods} crystal side-rods</strong>. If each <strong>${spec.name}</strong> shield uses <strong>${spec.sides} equal rods</strong>, how many <strong>${spec.name}</strong> shields can ${builder} build?`,
    promptText: `${builder} has ${totalRods} rods and each ${spec.name} uses ${spec.sides} rods. How many shields can be built?`,
    stageHTML: `
      ${buildGoalBannerHTML('💎 Divide total crystal rods by the number of sides on ONE shield!', 'shape')}
      <div class="sk-pair-shields">
        <div class="sk-mini-badge-card">
          <span class="sk-mini-count">1 ${spec.name} = ${spec.sides} rods</span>
          ${buildShapeShieldSVG({ shapeId: spec.id, showTicks: true, showRightAngles: false, showParallel: false, compact: true })}
        </div>
        <div class="sk-mini-badge-card">
          <span class="sk-mini-count">Total Stash</span>
          <span class="sk-plus-big">${totalRods} rods</span>
        </div>
      </div>
      ${buildAnswerBarHTML({ label: 'Shields Built =', unit: 'shields' })}
    `,
    answer: numShields,
    helperText: `A ${spec.name} needs ${spec.sides} rods. Compute ${totalRods} ÷ ${spec.sides}!`,
    explanationHTML: `
      Each <strong>${spec.name}</strong> uses <strong>${spec.sides}</strong> rods.<br/>
      ${totalRods} ÷ ${spec.sides} = <strong>${numShields} shields</strong>!
    `
  };
}
