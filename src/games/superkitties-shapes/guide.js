import {
  buildGridRoomSVG,
  buildLShapeSVG,
  buildRectBlueprintSVG,
  buildShapeShieldSVG
} from './svg-blueprints.js';

export const GUIDE_TITLE = '📐 Kiki’s Builder & Shape Guide';
export const GUIDE_SUBTITLE = 'Hero secrets from Kiki, Meow-Meow, Cuzi, Cagura, Flame, Oliva, Cori, Misha & Anna for Area vs. Perimeter, L-Shape Castles, Mystery Sides, and Quadrilateral Shields!';

export const GUIDE_HTML = `
  <div class="guide-grid">
    <article class="guide-card full-span">
      <h3>🐾 Area (Inside Tiles) vs. 🚧 Perimeter (Outside Fence)</h3>
      <p style="margin:0 0 8px; font-size:0.9rem; color:var(--ink-700);">
        <strong>Area</strong> is how many <strong>square units</strong> cover the <em>inside</em> floor (multiply <strong>Length × Width</strong>).
        <strong>Perimeter</strong> is the total distance <em>around the outside edge</em> (add <strong>all outer sides</strong>).
      </p>
      <div class="sk-guide-split">
        <div class="guide-example-box sk-guide-box">
          <strong>Area = Inside Floor Squares</strong>
          ${buildGridRoomSVG({ rows: 3, cols: 5, showDimensions: true, unit: 'm', compact: true })}
          <div>3 × 5 = <strong>15 sq m</strong> (square meters)</div>
        </div>
        <div class="guide-example-box sk-guide-box">
          <strong>Perimeter = Outside Fence Edge</strong>
          ${buildRectBlueprintSVG({ length: 5, width: 3, unit: 'm', labelTop: 5, labelLeft: 3, highlightBorder: true, compact: true })}
          <div>5 + 3 + 5 + 3 = <strong>16 m</strong> (meters)</div>
        </div>
      </div>
    </article>

    <article class="guide-card">
      <h3>🏰 Splitting L-Shape Castles</h3>
      <p style="margin:0 0 6px; font-size:0.9rem; color:var(--ink-700);">
        Never fear an L-shape! Slice along the dotted cut into <strong>2 friendly rectangles</strong>, multiply each, and add!
      </p>
      <div class="guide-example-box sk-guide-box">
        ${buildLShapeSVG({
          orient: 'top-right',
          w1: 4,
          w2: 5,
          h1: 3,
          h2: 4,
          unit: 'm',
          labels: { top: 4, stepV: 3, stepH: 5, right: 4, bottom: 9, left: 7 },
          showSplit: true
        })}
        <div style="font-size:0.86rem;">
          • <strong>Area:</strong> Top (4 × 3 = 12) + Bottom (9 × 4 = 36) = <strong>48 sq m</strong><br/>
          • <strong>Opposite Walls:</strong> 4 + 5 = <strong>9 m</strong> &amp; 3 + 4 = <strong>7 m</strong><br/>
          • <strong>Perimeter:</strong> 4 + 3 + 5 + 4 + 9 + 7 = <strong>32 m</strong>
        </div>
      </div>
    </article>

    <article class="guide-card">
      <h3>🏆 Same Area, Different Perimeter!</h3>
      <p style="margin:0 0 6px; font-size:0.9rem; color:var(--ink-700);">
        Two rooms can hold the <strong>exact same Area</strong> inside, yet need very different amounts of fence outside!
      </p>
      <div class="sk-guide-split">
        <div class="guide-example-box sk-guide-box">
          ${buildGridRoomSVG({ rows: 2, cols: 6, fill: '#FCE7F3', stroke: '#DB2777', showDimensions: true, unit: 'ft', compact: true })}
          <div style="font-size:0.84rem;">Area = <strong>12 sq ft</strong><br/>Perimeter = <strong>16 ft</strong></div>
        </div>
        <div class="guide-example-box sk-guide-box">
          ${buildGridRoomSVG({ rows: 3, cols: 4, fill: '#E0F2FE', stroke: '#0284C7', showDimensions: true, unit: 'ft', compact: true })}
          <div style="font-size:0.84rem;">Area = <strong>12 sq ft</strong><br/>Perimeter = <strong>14 ft</strong></div>
        </div>
      </div>
      <p style="margin:6px 0 0; font-size:0.84rem; color:var(--ink-700);">
        <strong>Builder Secret:</strong> Long, skinny shapes use MORE fence; square-like shapes use LESS fence (and trap MORE Area for the same fence)!
      </p>
    </article>

    <article class="guide-card full-span">
      <h3>💎 Quadrilateral &amp; Polygon Shield Guide</h3>
      <p style="margin:0 0 8px; font-size:0.9rem; color:var(--ink-700);">
        Blue <strong>arrows</strong> mark parallel sides that never meet. Black <strong>ticks</strong> mark equal lengths. Orange <strong>corner boxes</strong> mark 90° right angles!
      </p>
      <div class="sk-guide-shields">
        <div class="guide-example-box sk-guide-box">
          ${buildShapeShieldSVG({ shapeId: 'square', compact: true })}
          <strong>Square</strong>
          <small>4 equal sides + 4 right angles</small>
        </div>
        <div class="guide-example-box sk-guide-box">
          ${buildShapeShieldSVG({ shapeId: 'rectangle', compact: true })}
          <strong>Rectangle</strong>
          <small>4 right angles + opposite sides equal</small>
        </div>
        <div class="guide-example-box sk-guide-box">
          ${buildShapeShieldSVG({ shapeId: 'rhombus', compact: true })}
          <strong>Rhombus</strong>
          <small>4 equal sides + 2 parallel pairs</small>
        </div>
        <div class="guide-example-box sk-guide-box">
          ${buildShapeShieldSVG({ shapeId: 'parallelogram', compact: true })}
          <strong>Parallelogram</strong>
          <small>2 pairs of parallel sides</small>
        </div>
        <div class="guide-example-box sk-guide-box">
          ${buildShapeShieldSVG({ shapeId: 'trapezoid', compact: true })}
          <strong>Trapezoid</strong>
          <small>Exactly 1 pair of parallel sides</small>
        </div>
      </div>
      <div style="margin-top:8px; font-size:0.86rem; color:var(--ink-700); font-weight:700; text-align:center;">
        Polygon Side Counts: Triangle = <strong>3</strong> • Quadrilateral = <strong>4</strong> • Pentagon = <strong>5</strong> • Hexagon = <strong>6</strong> • Octagon = <strong>8</strong>
      </div>
    </article>
  </div>
`;
