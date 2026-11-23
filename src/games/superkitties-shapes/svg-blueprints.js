import { escapeHtml } from '../../shared/dom.js';

export function buildGoalBannerHTML(text, tone = 'area') {
  return `<div class="sk-goal-banner tone-${escapeHtml(tone)}">${text}</div>`;
}

export function buildAnswerBarHTML({ label, unit = '', slotId = 'slot-main' }) {
  return `
    <div class="sk-answer-bar">
      <span class="sk-answer-lbl">${escapeHtml(label)}</span>
      <span id="${escapeHtml(slotId)}" class="answer-slot active">?</span>
      ${unit ? `<span class="sk-unit-pill">${escapeHtml(unit)}</span>` : ''}
    </div>
  `;
}

export function buildDualAnswerBarHTML(slots) {
  return `
    <div class="sk-dual-bar">
      ${slots.map((s, idx) => `
        <button
          type="button"
          id="mslot-${escapeHtml(s.id)}"
          class="sk-dual-slot-card answer-slot ${idx === 0 ? 'active' : ''}"
          data-action="focus-multi-slot"
          data-slot="${escapeHtml(s.id)}"
          aria-label="${escapeHtml(s.label)}"
        >
          <span class="sk-dual-slot-name">${escapeHtml(s.label)}</span>
          <span class="sk-dual-slot-val-row">
            <span class="cross-slot-val">?</span>
            ${s.unit ? `<span class="sk-dual-unit">${escapeHtml(s.unit)}</span>` : ''}
          </span>
        </button>
      `).join('')}
    </div>
  `;
}

function svgPillLabel(x, y, text, { bg = '#FFFFFF', border = '#0F172A', fg = '#0F172A', isMystery = false, fontSize = 14 } = {}) {
  const safe = escapeHtml(String(text));
  const boxBg = isMystery ? '#FEF3C7' : bg;
  const boxBorder = isMystery ? '#D97706' : border;
  const boxFg = isMystery ? '#B45309' : fg;
  const charW = fontSize * 0.62;
  const w = Math.max(28, Math.round(safe.length * charW + 16));
  const h = fontSize + 10;
  return `
    <g transform="translate(${x.toFixed(1)}, ${y.toFixed(1)})">
      <rect x="${(-w / 2).toFixed(1)}" y="${(-h / 2).toFixed(1)}" width="${w}" height="${h}" rx="9" fill="${boxBg}" stroke="${boxBorder}" stroke-width="2"/>
      <text x="0" y="${(fontSize * 0.36).toFixed(1)}" text-anchor="middle" font-size="${fontSize}" font-weight="900" fill="${boxFg}">${safe}</text>
    </g>
  `;
}

export function buildGridRoomSVG({
  rows,
  cols,
  cellMap = null,
  fill = '#FCE7F3',
  stroke = '#DB2777',
  highlightPerimeter = false,
  showDimensions = false,
  unit = 'units',
  cutoutLabel = '',
  compact = false
}) {
  const vbW = compact ? 236 : 360;
  const vbH = compact ? 156 : 220;
  const padL = showDimensions ? 66 : 20;
  const padR = 20;
  const padT = showDimensions ? 40 : 18;
  const padB = 18;

  const availW = vbW - padL - padR;
  const availH = vbH - padT - padB;
  const cellSize = Math.max(12, Math.min(34, Math.floor(Math.min(availW / cols, availH / rows))));
  const gridW = cols * cellSize;
  const gridH = rows * cellSize;
  const ox = padL + (availW - gridW) / 2;
  const oy = padT + (availH - gridH) / 2;

  const isActive = (r, c) => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
    return cellMap ? Boolean(cellMap[r][c]) : true;
  };

  const tiles = [];
  const perimeterLines = [];
  const interiorCutouts = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = ox + c * cellSize;
      const y = oy + r * cellSize;
      if (isActive(r, c)) {
        tiles.push(
          `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${fill}" stroke="${stroke}" stroke-width="1.6"/>`
        );
        if (cellSize >= 18) {
          tiles.push(
            `<circle cx="${(x + cellSize / 2).toFixed(1)}" cy="${(y + cellSize / 2).toFixed(1)}" r="${Math.max(2, cellSize * 0.1).toFixed(1)}" fill="${stroke}" opacity="0.22"/>`
          );
        }
        if (highlightPerimeter) {
          const edges = [
            [!isActive(r - 1, c), x, y, x + cellSize, y],
            [!isActive(r + 1, c), x, y + cellSize, x + cellSize, y + cellSize],
            [!isActive(r, c - 1), x, y, x, y + cellSize],
            [!isActive(r, c + 1), x + cellSize, y, x + cellSize, y + cellSize]
          ];
          edges.forEach(([draw, x1, y1, x2, y2]) => {
            if (draw) {
              perimeterLines.push(
                `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#EA580C" stroke-width="5" stroke-linecap="round"/>`
              );
              perimeterLines.push(
                `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#FDE047" stroke-width="2" stroke-dasharray="4 3" stroke-linecap="round"/>`
              );
            }
          });
        }
      } else if (cellMap && isActive(r - 1, c) && isActive(r + 1, c) && isActive(r, c - 1) && isActive(r, c + 1)) {
        interiorCutouts.push(
          `<rect x="${x + 1}" y="${y + 1}" width="${cellSize - 2}" height="${cellSize - 2}" rx="4" fill="#E0F2FE" stroke="#0284C7" stroke-width="1.5" stroke-dasharray="3 2"/>`
        );
        if (cutoutLabel) {
          interiorCutouts.push(
            `<text x="${(x + cellSize / 2).toFixed(1)}" y="${(y + cellSize / 2 + 4).toFixed(1)}" text-anchor="middle" font-size="${Math.max(10, Math.round(cellSize * 0.48))}">${escapeHtml(cutoutLabel)}</text>`
          );
        }
      }
    }
  }

  let dimBadges = '';
  if (showDimensions) {
    dimBadges += svgPillLabel(ox + gridW / 2, oy - 18, `${cols} ${unit}`, { border: stroke, fg: '#1E293B', fontSize: 13 });
    dimBadges += svgPillLabel(ox - 34, oy + gridH / 2, `${rows} ${unit}`, { border: stroke, fg: '#1E293B', fontSize: 13 });
  }

  return `
    <svg class="sk-blueprint-svg ${compact ? 'compact' : ''}" viewBox="0 0 ${vbW} ${vbH}" role="img" aria-label="Grid blueprint">
      ${tiles.join('')}
      ${interiorCutouts.join('')}
      ${perimeterLines.join('')}
      ${dimBadges}
    </svg>
  `;
}

export function buildRectBlueprintSVG({
  length,
  width,
  unit = 'm',
  labelTop = null,
  labelLeft = null,
  labelBottom = null,
  labelRight = null,
  centerBadge = '',
  fill = '#E0F2FE',
  stroke = '#0284C7',
  showRightAngles = false,
  highlightBorder = false,
  compact = false
}) {
  const vbW = compact ? 236 : 360;
  const vbH = compact ? 154 : 210;
  const maxBoxW = compact ? 136 : 206;
  const maxBoxH = compact ? 84 : 118;

  // Keep proportions recognizable while preventing paper-thin shapes
  const ratio = Math.max(0.42, Math.min(2.35, length / Math.max(1, width)));
  let rw = maxBoxW;
  let rh = rw / ratio;
  if (rh > maxBoxH) {
    rh = maxBoxH;
    rw = rh * ratio;
  }
  rw = Math.max(66, Math.round(rw));
  rh = Math.max(48, Math.round(rh));

  const x = Math.round((vbW - rw) / 2);
  const y = Math.round((vbH - rh) / 2);

  let corners = '';
  if (showRightAngles) {
    const cs = 10;
    corners = `
      <polyline points="${x + cs},${y} ${x + cs},${y + cs} ${x},${y + cs}" fill="none" stroke="${stroke}" stroke-width="2"/>
      <polyline points="${x + rw - cs},${y} ${x + rw - cs},${y + cs} ${x + rw},${y + cs}" fill="none" stroke="${stroke}" stroke-width="2"/>
      <polyline points="${x + cs},${y + rh} ${x + cs},${y + rh - cs} ${x},${y + rh - cs}" fill="none" stroke="${stroke}" stroke-width="2"/>
      <polyline points="${x + rw - cs},${y + rh} ${x + rw - cs},${y + rh - cs} ${x + rw},${y + rh - cs}" fill="none" stroke="${stroke}" stroke-width="2"/>
    `;
  }

  const formatSide = (val) => (val === '?' ? '?' : `${val} ${unit}`);
  const labels = [];
  if (labelTop !== null) {
    labels.push(svgPillLabel(x + rw / 2, y - 16, formatSide(labelTop), { border: stroke, isMystery: labelTop === '?', fontSize: compact ? 12 : 14 }));
  }
  if (labelBottom !== null) {
    labels.push(svgPillLabel(x + rw / 2, y + rh + 16, formatSide(labelBottom), { border: stroke, isMystery: labelBottom === '?', fontSize: compact ? 12 : 14 }));
  }
  if (labelLeft !== null) {
    labels.push(svgPillLabel(x - 32, y + rh / 2, formatSide(labelLeft), { border: stroke, isMystery: labelLeft === '?', fontSize: compact ? 12 : 14 }));
  }
  if (labelRight !== null) {
    labels.push(svgPillLabel(x + rw + 32, y + rh / 2, formatSide(labelRight), { border: stroke, isMystery: labelRight === '?', fontSize: compact ? 12 : 14 }));
  }

  const centerHTML = centerBadge
    ? svgPillLabel(x + rw / 2, y + rh / 2, centerBadge, { bg: '#FFFFFF', border: stroke, fg: '#0F172A', fontSize: compact ? 12 : 14 })
    : '';

  return `
    <svg class="sk-blueprint-svg ${compact ? 'compact' : ''}" viewBox="0 0 ${vbW} ${vbH}" role="img" aria-label="Rectangle blueprint">
      <rect x="${x}" y="${y}" width="${rw}" height="${rh}" rx="6" fill="${fill}" stroke="${highlightBorder ? '#EA580C' : stroke}" stroke-width="${highlightBorder ? 4.5 : 3}" ${highlightBorder ? 'stroke-dasharray="9 5"' : ''}/>
      ${corners}
      ${centerHTML}
      ${labels.join('')}
    </svg>
  `;
}

export function buildPolygonPerimeterSVG({
  kind,
  sides,
  unit = 'ft',
  fill = '#FEF3C7',
  stroke = '#D97706'
}) {
  const vbW = 360;
  const vbH = 224;
  let polyPts = [];
  let labelCoords = [];

  if (kind === 'triangle') {
    polyPts = [[180, 38], [282, 180], [78, 180]];
    labelCoords = [
      [252, 102, `${sides[0]} ${unit}`],
      [180, 198, `${sides[1]} ${unit}`],
      [108, 102, `${sides[2]} ${unit}`]
    ];
  } else if (kind === 'trapezoid') {
    polyPts = [[124, 52], [236, 52], [286, 174], [74, 174]];
    labelCoords = [
      [180, 32, `${sides[0]} ${unit}`],
      [284, 112, `${sides[1]} ${unit}`],
      [180, 194, `${sides[2]} ${unit}`],
      [76, 112, `${sides[3]} ${unit}`]
    ];
  } else if (kind === 'house') {
    polyPts = [[180, 34], [268, 96], [268, 182], [92, 182], [92, 96]];
    labelCoords = [
      [246, 58, `${sides[1]} ${unit}`],
      [298, 140, `${sides[2]} ${unit}`],
      [180, 200, `${sides[3]} ${unit}`],
      [62, 140, `${sides[4]} ${unit}`],
      [114, 58, `${sides[0]} ${unit}`]
    ];
  } else {
    const n = kind === 'pentagon' ? 5 : (kind === 'hexagon' ? 6 : 8);
    const cx = 180;
    const cy = 112;
    const r = 74;
    const startAngle = -Math.PI / 2 - (n % 2 === 0 ? Math.PI / n : 0);
    for (let i = 0; i < n; i++) {
      const a = startAngle + (2 * Math.PI * i) / n;
      polyPts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    for (let i = 0; i < n; i++) {
      const p1 = polyPts[i];
      const p2 = polyPts[(i + 1) % n];
      const mx = (p1[0] + p2[0]) / 2;
      const my = (p1[1] + p2[1]) / 2;
      const vx = mx - cx;
      const vy = my - cy;
      const dist = Math.hypot(vx, vy) || 1;
      const pad = 24;
      labelCoords.push([mx + (vx / dist) * pad, my + (vy / dist) * pad, `${sides[i % sides.length]} ${unit}`]);
    }
  }

  const ptsStr = polyPts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const labelsHTML = labelCoords.map(([lx, ly, txt]) => svgPillLabel(lx, ly, txt, { border: stroke, fontSize: 13 })).join('');

  return `
    <svg class="sk-blueprint-svg" viewBox="0 0 ${vbW} ${vbH}" role="img" aria-label="Polygon perimeter diagram">
      <polygon points="${ptsStr}" fill="${fill}" stroke="#EA580C" stroke-width="4" stroke-linejoin="round" stroke-dasharray="9 5"/>
      ${labelsHTML}
    </svg>
  `;
}

export function buildLShapeSVG({
  orient = 'top-right',
  w1,
  w2,
  h1,
  h2,
  unit = 'm',
  labels = {},
  showSplit = false,
  highlightPerimeter = false,
  fill = '#EDE9FE',
  stroke = '#7C3AED'
}) {
  const W = w1 + w2;
  const H = h1 + h2;
  const vbW = 390;
  const vbH = 248;
  const padX = 64;
  const padY = 40;
  const scale = Math.min((vbW - padX * 2) / W, (vbH - padY * 2) / H);
  const drawW = W * scale;
  const drawH = H * scale;
  const ox = (vbW - drawW) / 2;
  const oy = (vbH - drawH) / 2;
  const px = (gx) => ox + gx * scale;
  const py = (gy) => oy + gy * scale;

  let verts = [];
  let splitLine = '';
  let edgeDefs = [];

  if (orient === 'top-right') {
    verts = [[0, 0], [w1, 0], [w1, h1], [W, h1], [W, H], [0, H]];
    splitLine = `<line x1="${px(0).toFixed(1)}" y1="${py(h1).toFixed(1)}" x2="${px(w1).toFixed(1)}" y2="${py(h1).toFixed(1)}" stroke="${stroke}" stroke-width="2.5" stroke-dasharray="6 4"/>`;
    edgeDefs = [
      { key: 'top', x: px(w1 / 2), y: py(0) - 18, val: labels.top },
      { key: 'stepV', x: px(w1) + 28, y: py(h1 / 2), val: labels.stepV },
      { key: 'stepH', x: px(w1 + w2 / 2), y: py(h1) - 18, val: labels.stepH },
      { key: 'right', x: px(W) + 32, y: py(h1 + h2 / 2), val: labels.right },
      { key: 'bottom', x: px(W / 2), y: py(H) + 18, val: labels.bottom },
      { key: 'left', x: px(0) - 32, y: py(H / 2), val: labels.left }
    ];
  } else if (orient === 'top-left') {
    verts = [[w1, 0], [W, 0], [W, H], [0, H], [0, h1], [w1, h1]];
    splitLine = `<line x1="${px(w1).toFixed(1)}" y1="${py(h1).toFixed(1)}" x2="${px(W).toFixed(1)}" y2="${py(h1).toFixed(1)}" stroke="${stroke}" stroke-width="2.5" stroke-dasharray="6 4"/>`;
    edgeDefs = [
      { key: 'top', x: px(w1 + w2 / 2), y: py(0) - 18, val: labels.top },
      { key: 'right', x: px(W) + 32, y: py(H / 2), val: labels.right },
      { key: 'bottom', x: px(W / 2), y: py(H) + 18, val: labels.bottom },
      { key: 'left', x: px(0) - 32, y: py(h1 + h2 / 2), val: labels.left },
      { key: 'stepH', x: px(w1 / 2), y: py(h1) - 18, val: labels.stepH },
      { key: 'stepV', x: px(w1) - 28, y: py(h1 / 2), val: labels.stepV }
    ];
  } else if (orient === 'bottom-right') {
    verts = [[0, 0], [W, 0], [W, h1], [w1, h1], [w1, H], [0, H]];
    splitLine = `<line x1="${px(0).toFixed(1)}" y1="${py(h1).toFixed(1)}" x2="${px(w1).toFixed(1)}" y2="${py(h1).toFixed(1)}" stroke="${stroke}" stroke-width="2.5" stroke-dasharray="6 4"/>`;
    edgeDefs = [
      { key: 'top', x: px(W / 2), y: py(0) - 18, val: labels.top },
      { key: 'right', x: px(W) + 32, y: py(h1 / 2), val: labels.right },
      { key: 'stepH', x: px(w1 + w2 / 2), y: py(h1) + 18, val: labels.stepH },
      { key: 'stepV', x: px(w1) + 28, y: py(h1 + h2 / 2), val: labels.stepV },
      { key: 'bottom', x: px(w1 / 2), y: py(H) + 18, val: labels.bottom },
      { key: 'left', x: px(0) - 32, y: py(H / 2), val: labels.left }
    ];
  } else {
    // bottom-left
    verts = [[0, 0], [W, 0], [W, H], [w1, H], [w1, h1], [0, h1]];
    splitLine = `<line x1="${px(w1).toFixed(1)}" y1="${py(h1).toFixed(1)}" x2="${px(W).toFixed(1)}" y2="${py(h1).toFixed(1)}" stroke="${stroke}" stroke-width="2.5" stroke-dasharray="6 4"/>`;
    edgeDefs = [
      { key: 'top', x: px(W / 2), y: py(0) - 18, val: labels.top },
      { key: 'right', x: px(W) + 32, y: py(H / 2), val: labels.right },
      { key: 'bottom', x: px(w1 + w2 / 2), y: py(H) + 18, val: labels.bottom },
      { key: 'stepV', x: px(w1) - 28, y: py(h1 + h2 / 2), val: labels.stepV },
      { key: 'stepH', x: px(w1 / 2), y: py(h1) + 18, val: labels.stepH },
      { key: 'left', x: px(0) - 32, y: py(h1 / 2), val: labels.left }
    ];
  }

  const ptsStr = verts.map(([vx, vy]) => `${px(vx).toFixed(1)},${py(vy).toFixed(1)}`).join(' ');
  const pillsHTML = edgeDefs
    .filter(e => e.val !== undefined && e.val !== null)
    .map(e => {
      const txt = e.val === '?' ? '?' : `${e.val} ${unit}`;
      return svgPillLabel(e.x, e.y, txt, { border: stroke, isMystery: e.val === '?', fontSize: 13 });
    })
    .join('');

  return `
    <svg class="sk-blueprint-svg" viewBox="0 0 ${vbW} ${vbH}" role="img" aria-label="L-shape blueprint">
      <polygon
        points="${ptsStr}"
        fill="${fill}"
        stroke="${highlightPerimeter ? '#EA580C' : stroke}"
        stroke-width="${highlightPerimeter ? 4.5 : 3}"
        stroke-linejoin="round"
        ${highlightPerimeter ? 'stroke-dasharray="9 5"' : ''}
      />
      ${showSplit ? splitLine : ''}
      ${pillsHTML}
    </svg>
  `;
}

export function buildShowdownCardsHTML({ leftTitle, rightTitle, leftSVG, rightSVG, leftSub = '', rightSub = '', goalHTML = '' }) {
  return `
    ${goalHTML}
    <div class="sk-duel-grid">
      <button type="button" class="sk-duel-card" data-action="submit-choice" data-index="0">
        <span class="sk-duel-tag">${escapeHtml(leftTitle)}</span>
        <div class="sk-duel-svg-wrap">${leftSVG}</div>
        ${leftSub ? `<span class="sk-duel-sub">${escapeHtml(leftSub)}</span>` : ''}
        <span class="sk-duel-pick">Tap Room A!</span>
      </button>
      <div class="sk-duel-vs"><span>VS</span></div>
      <button type="button" class="sk-duel-card" data-action="submit-choice" data-index="1">
        <span class="sk-duel-tag">${escapeHtml(rightTitle)}</span>
        <div class="sk-duel-svg-wrap">${rightSVG}</div>
        ${rightSub ? `<span class="sk-duel-sub">${escapeHtml(rightSub)}</span>` : ''}
        <span class="sk-duel-pick">Tap Room B!</span>
      </button>
    </div>
  `;
}

function tickMark(x1, y1, x2, y2, count = 1, color = '#0F172A') {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const ux = dx / len;
  const uy = dy / len;
  const out = [];
  const offsets = count === 1 ? [0] : [-4, 4];
  for (const off of offsets) {
    const cx = mx + ux * off;
    const cy = my + uy * off;
    out.push(`<line x1="${(cx - nx * 6).toFixed(1)}" y1="${(cy - ny * 6).toFixed(1)}" x2="${(cx + nx * 6).toFixed(1)}" y2="${(cy + ny * 6).toFixed(1)}" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/>`);
  }
  return out.join('');
}

function parallelChevron(x1, y1, x2, y2, count = 1, color = '#0284C7') {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;
  const mx = (x1 + x2) / 2 + ux * 12;
  const my = (y1 + y2) / 2 + uy * 12;
  const out = [];
  const offsets = count === 1 ? [0] : [-4, 4];
  for (const off of offsets) {
    const px = mx + ux * off;
    const py = my + uy * off;
    const p1x = px - ux * 6 + nx * 5;
    const p1y = py - uy * 6 + ny * 5;
    const p2x = px - ux * 6 - nx * 5;
    const p2y = py - uy * 6 - ny * 5;
    out.push(`<polyline points="${p1x.toFixed(1)},${p1y.toFixed(1)} ${px.toFixed(1)},${py.toFixed(1)} ${p2x.toFixed(1)},${p2y.toFixed(1)}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`);
  }
  return out.join('');
}

function rightAngleBox(vx, vy, p1x, p1y, p2x, p2y, size = 12, color = '#EA580C') {
  const d1 = Math.hypot(p1x - vx, p1y - vy) || 1;
  const d2 = Math.hypot(p2x - vx, p2y - vy) || 1;
  const u1x = ((p1x - vx) / d1) * size;
  const u1y = ((p1y - vy) / d1) * size;
  const u2x = ((p2x - vx) / d2) * size;
  const u2y = ((p2y - vy) / d2) * size;
  const a = [vx + u1x, vy + u1y];
  const b = [vx + u1x + u2x, vy + u1y + u2y];
  const c = [vx + u2x, vy + u2y];
  return `<polyline points="${a[0].toFixed(1)},${a[1].toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)} ${c[0].toFixed(1)},${c[1].toFixed(1)}" fill="none" stroke="${color}" stroke-width="2.3"/>`;
}

export function buildShapeShieldSVG({
  shapeId,
  showTicks = true,
  showRightAngles = true,
  showParallel = true,
  compact = false
}) {
  const vbW = compact ? 140 : 280;
  const vbH = compact ? 110 : 196;
  const s = compact ? 0.52 : 1;
  const tx = (x) => (x * s);
  const ty = (y) => (y * s);

  const specs = {
    square: {
      pts: [[84, 34], [204, 34], [204, 154], [84, 154]],
      fill: '#FEF3C7',
      stroke: '#D97706',
      ticks: [[0, 1], [1, 1], [2, 1], [3, 1]],
      parallel: [[0, 1], [2, 1], [1, 2], [3, 2]],
      rightAngles: [0, 1, 2, 3]
    },
    rectangle: {
      pts: [[52, 46], [228, 46], [228, 146], [52, 146]],
      fill: '#E0F2FE',
      stroke: '#0284C7',
      ticks: [[0, 1], [2, 1], [1, 2], [3, 2]],
      parallel: [[0, 1], [2, 1], [1, 2], [3, 2]],
      rightAngles: [0, 1, 2, 3]
    },
    rhombus: {
      pts: [[140, 40], [228, 96], [140, 152], [52, 96]],
      fill: '#FCE7F3',
      stroke: '#DB2777',
      ticks: [[0, 1], [1, 1], [2, 1], [3, 1]],
      parallel: [[0, 1], [2, 1], [1, 2], [3, 2]],
      rightAngles: []
    },
    tilted_square: {
      pts: [[140, 32], [204, 96], [140, 160], [76, 96]],
      fill: '#FEF3C7',
      stroke: '#D97706',
      ticks: [[0, 1], [1, 1], [2, 1], [3, 1]],
      parallel: [[0, 1], [2, 1], [1, 2], [3, 2]],
      rightAngles: [0, 1, 2, 3]
    },
    parallelogram: {
      pts: [[84, 44], [234, 44], [196, 148], [46, 148]],
      fill: '#EDE9FE',
      stroke: '#7C3AED',
      ticks: [[0, 1], [2, 1], [1, 2], [3, 2]],
      parallel: [[0, 1], [2, 1], [1, 2], [3, 2]],
      rightAngles: []
    },
    trapezoid: {
      pts: [[94, 44], [186, 44], [234, 148], [46, 148]],
      fill: '#DCFCE7',
      stroke: '#16A34A',
      ticks: [],
      parallel: [[0, 1], [2, 1]],
      rightAngles: []
    },
    right_trapezoid: {
      pts: [[72, 44], [182, 44], [228, 148], [72, 148]],
      fill: '#FFEDD5',
      stroke: '#EA580C',
      ticks: [],
      parallel: [[0, 1], [2, 1]],
      rightAngles: [0, 3]
    },
    right_triangle: {
      pts: [[74, 38], [218, 152], [74, 152]],
      fill: '#E0F2FE',
      stroke: '#0284C7',
      ticks: [],
      parallel: [],
      rightAngles: [2]
    },
    equilateral_triangle: {
      pts: [[140, 32], [216, 160], [64, 160]],
      fill: '#FEF3C7',
      stroke: '#D97706',
      ticks: [[0, 1], [1, 1], [2, 1]],
      parallel: [],
      rightAngles: []
    },
    isosceles_triangle: {
      pts: [[140, 28], [202, 162], [78, 162]],
      fill: '#DCFCE7',
      stroke: '#16A34A',
      ticks: [[0, 1], [2, 1]],
      parallel: [],
      rightAngles: []
    },
    general_quad: {
      pts: [[84, 68], [188, 30], [236, 154], [44, 128]],
      fill: '#F1F5F9',
      stroke: '#475569',
      ticks: [],
      parallel: [],
      rightAngles: []
    },
    house_pentagon: {
      pts: [[140, 42], [216, 88], [216, 162], [64, 162], [64, 88]],
      fill: '#FFE4E6',
      stroke: '#E11D48',
      ticks: [],
      parallel: [],
      rightAngles: [2, 3]
    },
    pentagon: {
      pts: [[140, 28], [214, 82], [186, 164], [94, 164], [66, 82]],
      fill: '#FCE7F3',
      stroke: '#DB2777',
      ticks: [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]],
      parallel: [],
      rightAngles: []
    },
    hexagon: {
      pts: [[102, 34], [178, 34], [218, 98], [178, 162], [102, 162], [62, 98]],
      fill: '#EDE9FE',
      stroke: '#7C3AED',
      ticks: [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1]],
      parallel: [],
      rightAngles: []
    },
    octagon: {
      pts: [[112, 28], [168, 28], [208, 68], [208, 126], [168, 166], [112, 166], [72, 126], [72, 68]],
      fill: '#CCFBF1',
      stroke: '#0D9488',
      ticks: [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1]],
      parallel: [],
      rightAngles: []
    }
  };

  const spec = specs[shapeId] || specs.square;
  const pts = spec.pts.map(([x, y]) => [tx(x), ty(y)]);
  const n = pts.length;
  const ptsStr = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

  const annotations = [];
  if (showRightAngles) {
    spec.rightAngles.forEach(idx => {
      const prev = pts[(idx - 1 + n) % n];
      const cur = pts[idx];
      const next = pts[(idx + 1) % n];
      annotations.push(rightAngleBox(cur[0], cur[1], prev[0], prev[1], next[0], next[1], compact ? 9 : 14));
    });
  }
  if (showTicks) {
    spec.ticks.forEach(([edgeIdx, count]) => {
      const p1 = pts[edgeIdx];
      const p2 = pts[(edgeIdx + 1) % n];
      annotations.push(tickMark(p1[0], p1[1], p2[0], p2[1], count, '#0F172A'));
    });
  }
  if (showParallel) {
    spec.parallel.forEach(([edgeIdx, count]) => {
      const p1 = pts[edgeIdx];
      const p2 = pts[(edgeIdx + 1) % n];
      const useReversed = edgeIdx === 2 || edgeIdx === 3;
      annotations.push(
        useReversed
          ? parallelChevron(p2[0], p2[1], p1[0], p1[1], count, '#0284C7')
          : parallelChevron(p1[0], p1[1], p2[0], p2[1], count, '#0284C7')
      );
    });
  }

  return `
    <svg class="sk-shield-svg ${compact ? 'compact' : ''}" viewBox="0 0 ${vbW} ${vbH}" role="img" aria-label="Shape shield">
      <polygon points="${ptsStr}" fill="${spec.fill}" stroke="${spec.stroke}" stroke-width="${compact ? 2.5 : 3.5}" stroke-linejoin="round"/>
      ${annotations.join('')}
    </svg>
  `;
}
