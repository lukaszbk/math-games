export function renderSieveDrawerHTML(sieveCrossed) {
  let cells = '<div class="sieve-grid">';
  for (let n = 1; n <= 100; n++) {
    const crossed = sieveCrossed && sieveCrossed.has(n) ? 'crossed' : '';
    cells += `<button type="button" class="sieve-cell ${crossed}" data-action="toggle-sieve-num" data-num="${n}">${n}</button>`;
  }
  cells += '</div><div style="font-size:0.74rem; color:var(--ink-500); margin-top:3px;">Tap numbers to cross out suspects!</div>';
  return cells;
}

export function renderTenFrameDrawerHTML(counterStates) {
  const states = Array.isArray(counterStates) ? counterStates : new Array(20).fill(0);
  let greenCount = 0;
  let goldCount = 0;
  states.forEach(s => {
    if (s === 1) greenCount++;
    else if (s === 2) goldCount++;
  });

  const renderFrame = (offset) => {
    let cells = '';
    for (let i = 0; i < 10; i++) {
      const idx = offset + i;
      const st = states[idx] || 0;
      const dot = st === 1
        ? '<span class="tf-dot green"></span>'
        : (st === 2 ? '<span class="tf-dot gold"></span>' : '');
      cells += `<button type="button" class="tenframe-interactive-cell" data-action="toggle-tenframe-cell" data-index="${idx}" data-state="${st}" aria-label="Counter ${idx + 1}">${dot}</button>`;
    }
    return `<div class="ten-frame-grid">${cells}</div>`;
  };

  return `
    <div class="tenframe-drawer">
      <div class="ten-frames-row">
        ${renderFrame(0)}
        ${renderFrame(10)}
      </div>
      <div class="tenframe-toolbar">
        <span>🟢 ${greenCount} + 🟡 ${goldCount} = <strong>${greenCount + goldCount}</strong> counters</span>
        <button type="button" class="tenframe-clear-btn" data-action="clear-tenframe">Clear Counters</button>
      </div>
    </div>
  `;
}

export function buildStaticTenFrameHTML({ green = 0, red = 0, gold = 0, crossed = 0, qmark = 0, totalSlots = 10 }) {
  const slots = [];
  for (let i = 0; i < red; i++) slots.push('<span class="tf-dot red"></span>');
  for (let i = 0; i < green; i++) slots.push('<span class="tf-dot green"></span>');
  for (let i = 0; i < gold; i++) slots.push('<span class="tf-dot gold"></span>');
  for (let i = 0; i < crossed; i++) slots.push('<span class="tf-dot crossed">✕</span>');
  for (let i = 0; i < qmark; i++) slots.push('<span class="tf-dot qmark"></span>');
  while (slots.length < totalSlots) slots.push('');

  const framesCount = totalSlots > 10 ? 2 : 1;
  let html = '<div class="ten-frames-row">';
  for (let f = 0; f < framesCount; f++) {
    html += '<div class="ten-frame-grid">';
    for (let i = 0; i < 10; i++) {
      html += `<div class="tf-cell">${slots[f * 10 + i] || ''}</div>`;
    }
    html += '</div>';
  }
  html += '</div>';
  return html;
}

export function buildNumberLineHTML(maxVal = 10, startVal = null, highlightVals = []) {
  const hi = new Set(highlightVals);
  let html = '<div class="numberline-strip" aria-hidden="true">';
  for (let n = 0; n <= maxVal; n++) {
    const cls = n === startVal ? 'start' : (hi.has(n) ? 'hop' : '');
    html += `<span class="nl-tick ${cls}">${n}</span>`;
  }
  html += '</div>';
  return html;
}

/**
 * Make-a-Ten Addition Bond:
 * [ a ] + [ b ] where [ b ] splits via SVG lines into [ partToTen ] and [ leftoverPart ],
 * with a blue dashed badge grouping a and partToTen labeled "Makes 10!".
 */
export function buildMakeTenAddBondHTML({ a, b, partToTen, leftoverPart, hidePart = null }) {
  const leftVal = (hidePart === 'left' || hidePart === 'both') ? '?' : partToTen;
  const rightVal = (hidePart === 'right' || hidePart === 'both') ? '?' : leftoverPart;
  return `
    <div class="iready-bond-card" aria-label="Break apart ${b} to make 10">
      <div class="bond-top-row">
        <div class="bond-ten-group">
          <span class="bond-make10-badge">Makes 10!</span>
          <span class="bond-num-box primary">${a}</span>
          <span class="bond-op">+</span>
          <span class="bond-part-anchor">
            <span class="bond-num-box">${b}</span>
            <svg class="bond-lines-svg" viewBox="0 0 110 34" aria-hidden="true">
              <line x1="55" y1="2" x2="22" y2="32" stroke="#0284C7" stroke-width="3" stroke-linecap="round"/>
              <line x1="55" y1="2" x2="88" y2="32" stroke="#64748B" stroke-width="3" stroke-linecap="round"/>
            </svg>
            <div class="bond-children-row">
              <span class="bond-split-box ${leftVal === '?' ? 'mystery' : 'ten-partner'}">${leftVal}</span>
              <span class="bond-split-box ${rightVal === '?' ? 'mystery' : ''}">${rightVal}</span>
            </div>
          </span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Use-a-Ten Subtraction Bond:
 * teen - [ sub ] where [ sub ] branches to [ partToTen ] ("to make 10") and [ leftoverPart ] ("left").
 */
export function buildUseTenSubBondHTML({ teen, sub, partToTen, leftoverPart, hidePart = null }) {
  const leftVal = (hidePart === 'left' || hidePart === 'both') ? '?' : partToTen;
  const rightVal = (hidePart === 'right' || hidePart === 'both') ? '?' : leftoverPart;
  return `
    <div class="iready-bond-card" aria-label="Break apart ${sub} to subtract to 10">
      <div class="bond-top-row">
        <span class="bond-num-box primary">${teen}</span>
        <span class="bond-op">−</span>
        <span class="bond-part-anchor">
          <span class="bond-num-box">${sub}</span>
          <svg class="bond-lines-svg" viewBox="0 0 120 34" aria-hidden="true">
            <line x1="60" y1="2" x2="26" y2="32" stroke="#0284C7" stroke-width="3" stroke-linecap="round"/>
            <line x1="60" y1="2" x2="94" y2="32" stroke="#EA580C" stroke-width="3" stroke-linecap="round"/>
          </svg>
          <div class="bond-children-row wide">
            <div class="bond-child-col">
              <span class="bond-split-box ${leftVal === '?' ? 'mystery' : 'ten-partner'}">${leftVal}</span>
              <span class="bond-caption">to make 10</span>
            </div>
            <div class="bond-child-col">
              <span class="bond-split-box ${rightVal === '?' ? 'mystery' : 'leftover'}">${rightVal}</span>
              <span class="bond-caption">left</span>
            </div>
          </div>
        </span>
      </div>
    </div>
  `;
}

/**
 * Make-a-Ten Counter Slide visual:
 * 10-frame with `a` red counters, `(10 - a)` yellow counters inside remaining slots,
 * plus dotted slide indicators below showing those moved up from `b` yellow counters,
 * leaving `a + b - 10` yellow counters below the frame.
 */
export function buildMakeTenCounterSlideHTML(a, b) {
  const toTen = Math.max(0, 10 - a);
  const leftover = Math.max(0, a + b - 10);

  let frameCells = '';
  for (let i = 0; i < 10; i++) {
    if (i < a) {
      frameCells += '<div class="tf-cell"><span class="tf-dot red"></span></div>';
    } else {
      frameCells += '<div class="tf-cell slide-filled"><span class="tf-dot gold"></span></div>';
    }
  }

  let movedRow = '';
  for (let i = 0; i < toTen; i++) {
    movedRow += '<span class="slide-ghost-wrap"><span class="tf-dot ghost"></span><span class="slide-arrow">↗</span></span>';
  }
  let leftoverRow = '';
  for (let i = 0; i < leftover; i++) {
    leftoverRow += '<span class="tf-dot gold"></span>';
  }

  return `
    <div class="counter-slide-box">
      <div class="ten-frame-grid">${frameCells}</div>
      <div class="slide-below-row">
        ${movedRow}
        ${leftoverRow ? `<span class="slide-divider">|</span>${leftoverRow}` : ''}
      </div>
      <div class="slide-caption">Slide <strong>${toTen}</strong> yellow into the frame to make <strong>10</strong>, with <strong>${leftover}</strong> below → <strong>10 + ${leftover}</strong></div>
    </div>
  `;
}

/**
 * Use-a-Ten Stacked Double 10-Frame Subtraction visual:
 * Top frame: 10 red counters (last `sub - (teen - 10)` crossed out).
 * Bottom frame: `teen - 10` red counters (all crossed out first to reach 10).
 */
export function buildUseTenSubFramesHTML(teen, sub) {
  const ones = Math.max(0, teen - 10);
  const crossTop = Math.max(0, sub - ones);
  const keepTop = Math.max(0, 10 - crossTop);

  let topCells = '';
  for (let i = 0; i < 10; i++) {
    if (i < keepTop) {
      topCells += '<div class="tf-cell"><span class="tf-dot red"></span></div>';
    } else {
      topCells += '<div class="tf-cell"><span class="tf-dot crossed">✕</span></div>';
    }
  }

  let botCells = '';
  for (let i = 0; i < 10; i++) {
    if (i < ones) {
      botCells += '<div class="tf-cell"><span class="tf-dot crossed">✕</span></div>';
    } else {
      botCells += '<div class="tf-cell"></div>';
    }
  }

  return `
    <div class="sub-frames-stack">
      <div class="ten-frame-grid">${topCells}</div>
      <div class="ten-frame-grid">${botCells}</div>
      <div class="slide-caption">Cross out <strong>${ones}</strong> to get to 10, then cross out <strong>${crossTop}</strong> more!</div>
    </div>
  `;
}

/**
 * Contiguous boxed horizontal Number Path with inline SVG curved jump arcs above.
 */
export function buildNumberPathHopsHTML({
  min = 1,
  max = 20,
  start,
  mid = 10,
  end,
  showEndQuestion = false,
  benchmarkAfter10 = false
}) {
  const count = max - min + 1;
  const colW = 40;
  const svgW = count * colW;
  const svgH = 54;

  const xOf = (val) => ((val - min) + 0.5) * colW;
  const hasArcs = typeof start === 'number' && typeof end === 'number';

  let arcsSVG = '';
  if (hasArcs) {
    const xStart = xOf(start);
    const xMid = xOf(mid);
    const xEnd = xOf(end);
    const diff1 = mid - start;
    const diff2 = end - mid;

    if (diff1 !== 0) {
      const lbl1 = diff1 > 0 ? `+${diff1}` : `${diff1}`;
      const cx1 = (xStart + xMid) / 2;
      arcsSVG += `
        <path d="M ${xStart} 48 Q ${cx1} 8 ${xMid} 48" fill="none" stroke="#0284C7" stroke-width="3" stroke-linecap="round"/>
        <polygon points="${xMid},48 ${xMid + (diff1 < 0 ? 6 : -6)},41 ${xMid + (diff1 < 0 ? 1 : -1)},39" fill="#0284C7"/>
        <rect x="${cx1 - 15}" y="2" width="30" height="17" rx="8" fill="#E0F2FE" stroke="#0284C7" stroke-width="1.5"/>
        <text x="${cx1}" y="14" text-anchor="middle" font-size="11" font-weight="900" fill="#0369A1">${lbl1}</text>
      `;
    }

    if (diff2 !== 0) {
      const lbl2 = diff2 > 0 ? `+${diff2}` : `${diff2}`;
      const cx2 = (xMid + xEnd) / 2;
      arcsSVG += `
        <path d="M ${xMid} 48 Q ${cx2} 14 ${xEnd} 48" fill="none" stroke="#EA580C" stroke-width="3" stroke-dasharray="5 4" stroke-linecap="round"/>
        <polygon points="${xEnd},48 ${xEnd + (diff2 < 0 ? 6 : -6)},41 ${xEnd + (diff2 < 0 ? 1 : -1)},39" fill="#EA580C"/>
        <rect x="${cx2 - 15}" y="6" width="30" height="17" rx="8" fill="#FFEDD5" stroke="#EA580C" stroke-width="1.5"/>
        <text x="${cx2}" y="18" text-anchor="middle" font-size="11" font-weight="900" fill="#C2410C">${lbl2}</text>
      `;
    }
  }

  let tilesHTML = '';
  for (let n = min; n <= max; n++) {
    const classes = ['np-tile'];
    if (n === start) classes.push('np-start');
    if (n === mid) classes.push('np-mid');
    if (n === end) classes.push(showEndQuestion ? 'np-end-q' : 'np-end');
    if (benchmarkAfter10 && n === 10) classes.push('np-ten-divider');
    const display = (n === end && showEndQuestion) ? '?' : n;
    tilesHTML += `<div class="${classes.join(' ')}" title="${n}">${display}</div>`;
  }

  return `
    <div class="number-path-wrap">
      ${hasArcs ? `<svg class="number-path-arcs" viewBox="0 0 ${svgW} ${svgH}" preserveAspectRatio="none" aria-hidden="true">${arcsSVG}</svg>` : ''}
      <div class="number-path-row" style="grid-template-columns: repeat(${count}, 1fr);">
        ${tilesHTML}
      </div>
    </div>
  `;
}
