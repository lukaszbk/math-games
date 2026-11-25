import { escapeHtml } from '../../shared/dom.js';

function svgPillLabel(x, y, text, { bg = '#FFFFFF', border = '#0E6478', fg = '#0F172A', isMystery = false, fontSize = 13 } = {}) {
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

export function buildAnswerBarHTML({ label, unit = '', slotId = 'slot-main' }) {
  return `
    <div class="vol-answer-bar">
      <span class="vol-answer-lbl">${escapeHtml(label)}</span>
      <span id="${escapeHtml(slotId)}" class="answer-slot active">?</span>
      ${unit ? `<span class="vol-unit-pill">${escapeHtml(unit)}</span>` : ''}
    </div>
  `;
}

/* ============================================================
   CAT SHADOW & MAGIC WAND ARTWORK
   ============================================================ */

export function buildCatShadowSVG(variant = 'mystery', { showQuestion = false } = {}) {
  const palettes = {
    misty: { bg1: '#0C2938', bg2: '#1A556B', rim: '#67E8F9', eye: '#FDE68A' },
    fang: { bg1: '#141B2D', bg2: '#2B3A55', rim: '#FBBF24', eye: '#FCD34D' },
    aria: { bg1: '#092234', bg2: '#135773', rim: '#A5F3FC', eye: '#38BDF8' },
    mystery: { bg1: '#0C2534', bg2: '#164B60', rim: '#7DD3FC', eye: '#FDE68A' }
  };
  const pal = palettes[variant] || palettes.mystery;

  const isFang = variant === 'fang';
  const isAria = variant === 'aria';

  // Expressive cat silhouettes (distinct pose/silhouette per cat!)
  const silhouettePath = isFang
    ? // Fierce warrior cat silhouette with tall tufted ears and sweeping tail
      'M 54 146 C 52 122 57 104 68 91 C 62 77 61 60 66 43 L 79 56 C 85 53 95 53 101 56 L 114 42 C 119 59 118 76 112 90 C 122 103 127 120 127 142 C 134 134 142 121 140 105 C 138 93 145 86 151 92 C 158 100 153 128 135 148 Z'
    : (isAria
      ? // Graceful Sea Force cat silhouette with plumed ear tufts & curved ocean tail
        'M 56 146 C 54 121 60 102 72 88 C 65 73 63 54 68 38 L 80 54 C 86 50 96 50 102 54 L 114 38 C 119 54 117 73 110 88 C 122 101 127 120 126 141 C 136 135 145 119 144 103 C 143 92 150 87 154 96 C 158 107 150 135 133 148 Z'
      : // Classic curious hero cat silhouette
        'M 56 146 C 55 123 61 105 71 93 C 64 78 64 60 68 45 L 81 58 C 87 55 95 55 101 58 L 114 45 C 118 60 118 78 111 93 C 121 105 126 122 125 141 C 133 136 141 124 141 109 C 141 99 148 94 152 101 C 157 110 148 135 132 148 Z');

  const crownOrMark = isAria
    ? `<path d="M 85 52 L 91 41 L 97 52 Z" fill="${pal.rim}" opacity="0.85"/>`
    : (isFang
      ? `<path d="M 116 86 L 122 89 L 116 93 Z" fill="${pal.rim}" opacity="0.75"/>`
      : '');

  return `
    <svg class="cat-shadow-svg" viewBox="0 0 180 180" role="img" aria-label="Mystery cat shadow silhouette">
      <defs>
        <radialGradient id="cs-bg-${variant}" cx="50%" cy="42%" r="60%">
          <stop offset="0%" stop-color="${pal.bg2}"/>
          <stop offset="100%" stop-color="${pal.bg1}"/>
        </radialGradient>
        <radialGradient id="cs-aura-${variant}" cx="50%" cy="48%" r="44%">
          <stop offset="0%" stop-color="${pal.rim}" stop-opacity="0.34"/>
          <stop offset="100%" stop-color="${pal.rim}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="180" height="180" fill="url(#cs-bg-${variant})"/>
      <circle cx="92" cy="96" r="68" fill="url(#cs-aura-${variant})"/>
      <circle cx="144" cy="34" r="16" fill="#FEF3C7" opacity="0.22"/>
      <circle cx="150" cy="31" r="14" fill="${pal.bg2}" opacity="0.95"/>
      <circle cx="32" cy="40" r="2.2" fill="#FDE68A" opacity="0.85"/>
      <circle cx="48" cy="24" r="1.6" fill="#A5F3FC" opacity="0.8"/>
      <circle cx="130" cy="60" r="1.8" fill="#FDE68A" opacity="0.75"/>
      <ellipse cx="96" cy="149" rx="46" ry="9" fill="#040C12" opacity="0.55"/>
      <path d="${silhouettePath}" fill="#07131C" stroke="${pal.rim}" stroke-width="2.6" stroke-linejoin="round"/>
      ${crownOrMark}
      <ellipse cx="81" cy="75" rx="4.2" ry="3.2" fill="${pal.eye}"/>
      <ellipse cx="101" cy="75" rx="4.2" ry="3.2" fill="${pal.eye}"/>
      <circle cx="82" cy="74.5" r="1.3" fill="#0F172A"/>
      <circle cx="102" cy="74.5" r="1.3" fill="#0F172A"/>
      ${showQuestion ? '<text x="90" y="128" text-anchor="middle" font-size="26" font-weight="900" fill="#FDE68A" opacity="0.9">?</text>' : ''}
    </svg>
  `;
}

export function buildMysteryPrizeSealSVG(kind = 'Power') {
  const icons = {
    Power: { glyph: '⚡', rim: '#38BDF8', glow: '#67E8F9' },
    Skill: { glyph: '🥋', rim: '#FBBF24', glow: '#FDE68A' },
    Object: { glyph: '💎', rim: '#5EEAD4', glow: '#99F6E4' },
    'Object / Person': { glyph: '🎪', rim: '#F472B6', glow: '#FBCFE8' }
  };
  const cfg = icons[kind] || icons.Power;
  const safeKind = escapeHtml(kind);
  return `
    <svg class="cat-shadow-svg" viewBox="0 0 180 180" role="img" aria-label="Mystery ${safeKind} shadow seal">
      <rect x="0" y="0" width="180" height="180" fill="#0D2938"/>
      <circle cx="90" cy="88" r="56" fill="#134257" stroke="${cfg.rim}" stroke-width="2.5" stroke-dasharray="6 4"/>
      <circle cx="90" cy="88" r="42" fill="#071822" stroke="${cfg.glow}" stroke-width="1.8" opacity="0.9"/>
      <!-- Subtle cat-ear wand silhouette behind seal -->
      <path d="M 65 72 L 73 56 L 83 68 L 97 68 L 107 56 L 115 72 Z" fill="#071822" stroke="${cfg.rim}" stroke-width="2"/>
      <text x="90" y="99" text-anchor="middle" font-size="34">${cfg.glyph}</text>
      <circle cx="42" cy="40" r="2.2" fill="#FDE68A"/>
      <circle cx="140" cy="36" r="2" fill="#A5F3FC"/>
      <circle cx="144" cy="138" r="2.4" fill="#FDE68A"/>
    </svg>
  `;
}

export function buildMagicWandSVG({ withCatShadow = false, catVariant = 'mystery' } = {}) {
  const shadowSnippet = withCatShadow
    ? `
      <g transform="translate(8, 12)">
        <circle cx="52" cy="64" r="46" fill="#0B2433" stroke="#67E8F9" stroke-width="2.4"/>
        <path d="M 24 96 C 24 78 29 66 36 58 C 32 47 32 36 36 26 L 45 35 C 49 33 56 33 60 35 L 69 26 C 73 36 73 47 69 58 C 76 66 80 78 80 96 Z" fill="#050F16" stroke="#A5F3FC" stroke-width="2.2" stroke-linejoin="round"/>
        <ellipse cx="44" cy="49" rx="3.2" ry="2.4" fill="#FDE68A"/>
        <ellipse cx="60" cy="49" rx="3.2" ry="2.4" fill="#FDE68A"/>
        <circle cx="52" cy="64" r="46" fill="none" stroke="#FBBF24" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.8"/>
      </g>
    `
    : `
      <g transform="translate(18, 28)">
        <circle cx="42" cy="48" r="34" fill="#0E6478" opacity="0.14"/>
        <path d="M 42 18 L 48 34 L 66 36 L 52 48 L 56 66 L 42 56 L 28 66 L 32 48 L 18 36 L 36 34 Z" fill="#FDE68A" stroke="#D97706" stroke-width="2" opacity="0.85"/>
      </g>
    `;

  return `
    <svg viewBox="0 0 210 156" role="img" aria-label="Glowing Magic Wand">
      <defs>
        <linearGradient id="mw-shaft" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#0E6478"/>
          <stop offset="55%" stop-color="#1996B0"/>
          <stop offset="100%" stop-color="#67E8F9"/>
        </linearGradient>
        <linearGradient id="mw-star" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FEF08A"/>
          <stop offset="55%" stop-color="#FBBF24"/>
          <stop offset="100%" stop-color="#D97706"/>
        </linearGradient>
      </defs>
      ${shadowSnippet}
      <!-- Swirling aurora ribbon -->
      <path d="M 76 132 Q 112 108 128 74 T 164 38" fill="none" stroke="#67E8F9" stroke-width="4" stroke-linecap="round" stroke-dasharray="6 5" opacity="0.85"/>
      <path d="M 88 140 Q 130 120 144 84" fill="none" stroke="#FBBF24" stroke-width="3" stroke-linecap="round" opacity="0.75"/>
      <!-- Magic Wand shaft -->
      <line x1="92" y1="138" x2="156" y2="52" stroke="url(#mw-shaft)" stroke-width="11" stroke-linecap="round"/>
      <line x1="92" y1="138" x2="156" y2="52" stroke="#E0F2FE" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
      <!-- Pearl & gold handle pommel -->
      <circle cx="92" cy="138" r="8" fill="#F8FAFC" stroke="#D97706" stroke-width="2.5"/>
      <circle cx="144" cy="68" r="6" fill="#FDE68A" stroke="#B45309" stroke-width="2"/>
      <!-- Starlight Cat-Ear Wand Tip -->
      <path d="M 142 36 L 146 21 L 157 31 L 165 29 L 173 19 L 176 34 L 190 42 L 175 51 L 176 68 L 161 58 L 146 65 L 151 49 L 138 40 Z" fill="url(#mw-star)" stroke="#92400E" stroke-width="2.4" stroke-linejoin="round"/>
      <circle cx="163" cy="45" r="7" fill="#FFFFFF" opacity="0.85"/>
      <circle cx="163" cy="45" r="4" fill="#0EA5E9"/>
      <!-- Twinkling sparkles -->
      <path d="M 118 32 L 121 40 L 129 43 L 121 46 L 118 54 L 115 46 L 107 43 L 115 40 Z" fill="#FBBF24"/>
      <path d="M 186 78 L 188 83 L 193 85 L 188 87 L 186 92 L 184 87 L 179 85 L 184 83 Z" fill="#0EA5E9"/>
      <circle cx="132" cy="22" r="2.6" fill="#0EA5E9"/>
      <circle cx="192" cy="24" r="2.8" fill="#F59E0B"/>
    </svg>
  `;
}

/* ============================================================
   3D ISOMETRIC VOLUME DIAGRAMS
   ============================================================ */

const LAYER_PALETTES = [
  { top: '#99F6E4', left: '#2DD4BF', right: '#0D9488', stroke: '#0F766E' },
  { top: '#BAE6FD', left: '#38BDF8', right: '#0284C7', stroke: '#0369A1' },
  { top: '#FDE68A', left: '#FBBF24', right: '#D97706', stroke: '#B45309' },
  { top: '#FBCFE8', left: '#F472B6', right: '#DB2777', stroke: '#9D174D' }
];

function isoPoint(r, c, z, ox, oy, s) {
  const dx = s * 0.866;
  const dy = s * 0.5;
  const dz = s * 0.96;
  return [
    ox + (c - r) * dx,
    oy + (c + r) * dy - z * dz
  ];
}

function polyStr(pts) {
  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}

function drawIsoVoxel(r, c, z, ox, oy, s, pal) {
  const pTop = [
    isoPoint(r, c, z + 1, ox, oy, s),
    isoPoint(r, c + 1, z + 1, ox, oy, s),
    isoPoint(r + 1, c + 1, z + 1, ox, oy, s),
    isoPoint(r + 1, c, z + 1, ox, oy, s)
  ];
  const pLeft = [
    isoPoint(r + 1, c, z + 1, ox, oy, s),
    isoPoint(r + 1, c + 1, z + 1, ox, oy, s),
    isoPoint(r + 1, c + 1, z, ox, oy, s),
    isoPoint(r + 1, c, z, ox, oy, s)
  ];
  const pRight = [
    isoPoint(r, c + 1, z + 1, ox, oy, s),
    isoPoint(r + 1, c + 1, z + 1, ox, oy, s),
    isoPoint(r + 1, c + 1, z, ox, oy, s),
    isoPoint(r, c + 1, z, ox, oy, s)
  ];
  return `
    <polygon points="${polyStr(pLeft)}" fill="${pal.left}" stroke="${pal.stroke}" stroke-width="1.4" stroke-linejoin="round"/>
    <polygon points="${polyStr(pRight)}" fill="${pal.right}" stroke="${pal.stroke}" stroke-width="1.4" stroke-linejoin="round"/>
    <polygon points="${polyStr(pTop)}" fill="${pal.top}" stroke="${pal.stroke}" stroke-width="1.4" stroke-linejoin="round"/>
  `;
}

export function buildCubeStackSVG({ grid, compact = false }) {
  const vbW = compact ? 236 : 360;
  const vbH = compact ? 150 : 216;
  const rows = grid.length;
  const cols = grid[0].length;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const h = grid[r][c];
      for (let z = 0; z < h; z++) {
        for (const dr of [0, 1]) {
          for (const dc of [0, 1]) {
            for (const dz of [0, 1]) {
              const [x, y] = isoPoint(r + dr, c + dc, z + dz, 0, 0, 1);
              minX = Math.min(minX, x);
              maxX = Math.max(maxX, x);
              minY = Math.min(minY, y);
              maxY = Math.max(maxY, y);
            }
          }
        }
      }
    }
  }

  const padX = compact ? 22 : 34;
  const padY = compact ? 16 : 22;
  const availW = vbW - padX * 2;
  const availH = vbH - padY * 2;
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  const s = Math.max(14, Math.min(compact ? 26 : 36, Math.min(availW / spanX, availH / spanY)));

  const ox = vbW / 2 - ((minX + maxX) / 2) * s;
  const oy = vbH / 2 - ((minY + maxY) / 2) * s;

  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] > 0) cells.push({ r, c, h: grid[r][c] });
    }
  }
  cells.sort((a, b) => (a.r + a.c) - (b.r + b.c) || a.r - b.r);

  const polys = [];
  cells.forEach(({ r, c, h }) => {
    for (let z = 0; z < h; z++) {
      polys.push(drawIsoVoxel(r, c, z, ox, oy, s, LAYER_PALETTES[z % LAYER_PALETTES.length]));
    }
  });

  return `
    <svg class="vol-svg ${compact ? 'compact' : ''}" viewBox="0 0 ${vbW} ${vbH}" role="img" aria-label="3D unit cube stack">
      ${polys.join('')}
    </svg>
  `;
}

function fitPrismDims(length, width, height) {
  const maxD = Math.max(length, width, height, 1);
  const scale = (d) => 1.5 + ((d - 1) / Math.max(1, maxD - 1)) * 2.5;
  return {
    vr: maxD <= 4 ? length : scale(length),
    vc: maxD <= 4 ? width : scale(width),
    vh: maxD <= 4 ? height : scale(height)
  };
}

export function buildPrismBoxSVG({
  length,
  width,
  height,
  unit = 'cm',
  labelL = length,
  labelW = width,
  labelH = height,
  centerBadge = '',
  highlightTopLayer = false,
  showLayerGrid = false,
  fillLevel = null,
  palette = null,
  compact = false
}) {
  const vbW = compact ? 236 : 360;
  const vbH = compact ? 152 : 216;
  const pal = palette || {
    top: '#D7F3F7',
    left: '#67E8F9',
    right: '#1996B0',
    stroke: '#0E6478'
  };

  // Visual proportions: when showLayerGrid is true, keep exact integer grid counts (capped neatly by generators)
  const dims = showLayerGrid
    ? { vr: length, vc: width, vh: height }
    : fitPrismDims(length, width, height);
  const { vr, vc, vh } = dims;

  // Bounding box at s = 1
  const corners = [];
  for (const r of [0, vr]) {
    for (const c of [0, vc]) {
      for (const z of [0, vh]) {
        corners.push(isoPoint(r, c, z, 0, 0, 1));
      }
    }
  }
  const minX = Math.min(...corners.map(p => p[0]));
  const maxX = Math.max(...corners.map(p => p[0]));
  const minY = Math.min(...corners.map(p => p[1]));
  const maxY = Math.max(...corners.map(p => p[1]));

  const padL = compact ? 38 : 60;
  const padR = compact ? 48 : 74;
  const padT = compact ? 16 : 24;
  const padB = compact ? 32 : 42;
  const availW = vbW - padL - padR;
  const availH = vbH - padT - padB;
  const s = Math.min(availW / Math.max(1, maxX - minX), availH / Math.max(1, maxY - minY));

  const ox = padL + availW / 2 - ((minX + maxX) / 2) * s;
  const oy = padT + availH / 2 - ((minY + maxY) / 2) * s;

  const pt = (r, c, z) => isoPoint(r, c, z, ox, oy, s);

  const topFace = [pt(0, 0, vh), pt(0, vc, vh), pt(vr, vc, vh), pt(vr, 0, vh)];
  const leftFace = [pt(vr, 0, vh), pt(vr, vc, vh), pt(vr, vc, 0), pt(vr, 0, 0)];
  const rightFace = [pt(0, vc, vh), pt(vr, vc, vh), pt(vr, vc, 0), pt(0, vc, 0)];

  let bodySVG = '';
  if (fillLevel !== null) {
    const fillRatio = Math.max(0.15, Math.min(1, fillLevel / Math.max(1, height)));
    const wz = vh * fillRatio;
    const wTop = [pt(0, 0, wz), pt(0, vc, wz), pt(vr, vc, wz), pt(vr, 0, wz)];
    const wLeft = [pt(vr, 0, wz), pt(vr, vc, wz), pt(vr, vc, 0), pt(vr, 0, 0)];
    const wRight = [pt(0, vc, wz), pt(vr, vc, wz), pt(vr, vc, 0), pt(0, vc, 0)];
    bodySVG = `
      <polygon points="${polyStr(topFace)}" fill="#F0FDFA" fill-opacity="0.45" stroke="${pal.stroke}" stroke-width="2" stroke-dasharray="5 3"/>
      <polygon points="${polyStr(leftFace)}" fill="#E0F2FE" fill-opacity="0.35" stroke="${pal.stroke}" stroke-width="2"/>
      <polygon points="${polyStr(rightFace)}" fill="#BAE6FD" fill-opacity="0.35" stroke="${pal.stroke}" stroke-width="2"/>
      <polygon points="${polyStr(wLeft)}" fill="#38BDF8" fill-opacity="0.82" stroke="#0284C7" stroke-width="1.8"/>
      <polygon points="${polyStr(wRight)}" fill="#0284C7" fill-opacity="0.85" stroke="#0369A1" stroke-width="1.8"/>
      <polygon points="${polyStr(wTop)}" fill="#A5F3FC" fill-opacity="0.92" stroke="#0284C7" stroke-width="2"/>
      <polygon points="${polyStr(topFace)}" fill="none" stroke="${pal.stroke}" stroke-width="2.4" stroke-linejoin="round"/>
    `;
  } else {
    bodySVG = `
      <polygon points="${polyStr(leftFace)}" fill="${pal.left}" stroke="${pal.stroke}" stroke-width="2.4" stroke-linejoin="round"/>
      <polygon points="${polyStr(rightFace)}" fill="${pal.right}" stroke="${pal.stroke}" stroke-width="2.4" stroke-linejoin="round"/>
      <polygon points="${polyStr(topFace)}" fill="${pal.top}" stroke="${pal.stroke}" stroke-width="2.4" stroke-linejoin="round"/>
    `;
  }

  let gridSVG = '';
  if (showLayerGrid && Number.isInteger(length) && Number.isInteger(width) && Number.isInteger(height)) {
    const lines = [];
    // Top L x W grid lines
    for (let r = 1; r < length; r++) {
      const a = pt(r, 0, vh);
      const b = pt(r, vc, vh);
      lines.push(`<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${pal.stroke}" stroke-width="1.2" opacity="0.55"/>`);
    }
    for (let c = 1; c < width; c++) {
      const a = pt(0, c, vh);
      const b = pt(vr, c, vh);
      lines.push(`<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${pal.stroke}" stroke-width="1.2" opacity="0.55"/>`);
    }
    // Horizontal layer dividers
    for (let z = 1; z < height; z++) {
      const l1 = pt(vr, 0, z);
      const l2 = pt(vr, vc, z);
      const r2 = pt(0, vc, z);
      const isTopSlice = highlightTopLayer && z === height - 1;
      lines.push(`<polyline points="${polyStr([l1, l2, r2])}" fill="none" stroke="${isTopSlice ? '#D97706' : pal.stroke}" stroke-width="${isTopSlice ? 2.8 : 1.3}" ${isTopSlice ? '' : 'opacity="0.5"'}/>`);
    }
    if (highlightTopLayer && height >= 1) {
      const sliceTop = [pt(0, 0, vh), pt(0, vc, vh), pt(vr, vc, vh), pt(vr, 0, vh)];
      const sliceL = [pt(vr, 0, vh), pt(vr, vc, vh), pt(vr, vc, vh - 1), pt(vr, 0, vh - 1)];
      const sliceR = [pt(0, vc, vh), pt(vr, vc, vh), pt(vr, vc, vh - 1), pt(0, vc, vh - 1)];
      lines.unshift(
        `<polygon points="${polyStr(sliceL)}" fill="#FCD34D" fill-opacity="0.72"/>`,
        `<polygon points="${polyStr(sliceR)}" fill="#F59E0B" fill-opacity="0.72"/>`,
        `<polygon points="${polyStr(sliceTop)}" fill="#FEF08A" fill-opacity="0.78"/>`
      );
    }
    gridSVG = lines.join('');
  }

  const labels = [];
  const fmt = (val) => (val === '?' ? '?' : (unit ? `${val} ${unit}` : String(val)));
  const fSize = compact ? 11 : 13;

  if (labelW !== null && labelW !== undefined) {
    const a = pt(vr, 0, 0);
    const b = pt(vr, vc, 0);
    labels.push(svgPillLabel((a[0] + b[0]) / 2 - (compact ? 14 : 20), (a[1] + b[1]) / 2 + (compact ? 14 : 18), fmt(labelW), {
      border: pal.stroke,
      isMystery: labelW === '?',
      fontSize: fSize
    }));
  }
  if (labelL !== null && labelL !== undefined) {
    const a = pt(vr, vc, 0);
    const b = pt(0, vc, 0);
    labels.push(svgPillLabel((a[0] + b[0]) / 2 + (compact ? 14 : 20), (a[1] + b[1]) / 2 + (compact ? 14 : 18), fmt(labelL), {
      border: pal.stroke,
      isMystery: labelL === '?',
      fontSize: fSize
    }));
  }
  if (labelH !== null && labelH !== undefined) {
    const a = pt(0, vc, 0);
    const b = pt(0, vc, vh);
    labels.push(svgPillLabel((a[0] + b[0]) / 2 + (compact ? 24 : 34), (a[1] + b[1]) / 2, fmt(labelH), {
      border: pal.stroke,
      isMystery: labelH === '?',
      fontSize: fSize
    }));
  }

  let centerSVG = '';
  if (centerBadge) {
    const topCenter = pt(vr / 2, vc / 2, vh);
    centerSVG = svgPillLabel(topCenter[0], topCenter[1] - (compact ? 2 : 4), centerBadge, {
      bg: '#FFFFFF',
      border: pal.stroke,
      fg: '#0E6478',
      fontSize: compact ? 11 : 13
    });
  }

  return `
    <svg class="vol-svg ${compact ? 'compact' : ''}" viewBox="0 0 ${vbW} ${vbH}" role="img" aria-label="3D rectangular prism">
      ${bodySVG}
      ${gridSVG}
      ${centerSVG}
      ${labels.join('')}
    </svg>
  `;
}

export function buildTwinBoxesSVG({ boxA, boxB, unit = 'cm', compact = false }) {
  const vbW = compact ? 250 : 380;
  const vbH = compact ? 156 : 220;

  // Box A on back-left (r: 0..rA, c: 0..cA, z: 0..hA)
  // Box B joined on front-right (r: 0..rB, c: cA..cA+cB, z: 0..hB)
  const rA = Math.max(1.5, Math.min(3.5, boxA.l * 0.55));
  const cA = Math.max(1.5, Math.min(3.5, boxA.w * 0.55));
  const hA = Math.max(1.8, Math.min(4.0, boxA.h * 0.65));

  const rB = Math.max(1.4, Math.min(3.2, boxB.l * 0.55));
  const cB = Math.max(1.4, Math.min(3.4, boxB.w * 0.55));
  const hB = Math.max(1.2, Math.min(3.4, boxB.h * 0.65));

  const allPts = [];
  for (const [rMax, cMin, cMax, hMax] of [[rA, 0, cA, hA], [rB, cA, cA + cB, hB]]) {
    for (const r of [0, rMax]) {
      for (const c of [cMin, cMax]) {
        for (const z of [0, hMax]) {
          allPts.push(isoPoint(r, c, z, 0, 0, 1));
        }
      }
    }
  }
  const minX = Math.min(...allPts.map(p => p[0]));
  const maxX = Math.max(...allPts.map(p => p[0]));
  const minY = Math.min(...allPts.map(p => p[1]));
  const maxY = Math.max(...allPts.map(p => p[1]));

  const padX = compact ? 26 : 44;
  const padT = compact ? 22 : 30;
  const padB = compact ? 28 : 38;
  const availW = vbW - padX * 2;
  const availH = vbH - padT - padB;
  const s = Math.min(availW / Math.max(1, maxX - minX), availH / Math.max(1, maxY - minY));

  const ox = vbW / 2 - ((minX + maxX) / 2) * s;
  const oy = padT + availH / 2 - ((minY + maxY) / 2) * s;
  const pt = (r, c, z) => isoPoint(r, c, z, ox, oy, s);

  const drawSolid = (r0, r1, c0, c1, z1, pal) => {
    const fTop = [pt(r0, c0, z1), pt(r0, c1, z1), pt(r1, c1, z1), pt(r1, c0, z1)];
    const fLeft = [pt(r1, c0, z1), pt(r1, c1, z1), pt(r1, c1, 0), pt(r1, c0, 0)];
    const fRight = [pt(r0, c1, z1), pt(r1, c1, z1), pt(r1, c1, 0), pt(r0, c1, 0)];
    return `
      <polygon points="${polyStr(fLeft)}" fill="${pal.left}" stroke="${pal.stroke}" stroke-width="2.2" stroke-linejoin="round"/>
      <polygon points="${polyStr(fRight)}" fill="${pal.right}" stroke="${pal.stroke}" stroke-width="2.2" stroke-linejoin="round"/>
      <polygon points="${polyStr(fTop)}" fill="${pal.top}" stroke="${pal.stroke}" stroke-width="2.2" stroke-linejoin="round"/>
    `;
  };

  const palA = { top: '#D7F3F7', left: '#67E8F9', right: '#1996B0', stroke: '#0E6478' };
  const palB = { top: '#FEF3C7', left: '#FCD34D', right: '#F59E0B', stroke: '#B45309' };

  const aTopMid = pt(rA / 2, cA / 2, hA);
  const bTopMid = pt(rB / 2, cA + cB / 2, hB);
  const seamTop = pt(rB, cA, Math.min(hA, hB));
  const seamBot = pt(rB, cA, 0);

  const badgeA = svgPillLabel(aTopMid[0], aTopMid[1] - 6, 'Box A', {
    bg: '#FFFFFF',
    border: '#0E6478',
    fg: '#0E6478',
    fontSize: compact ? 10 : 12
  });
  const badgeB = svgPillLabel(bTopMid[0], bTopMid[1] - 6, 'Box B', {
    bg: '#FFFFFF',
    border: '#B45309',
    fg: '#B45309',
    fontSize: compact ? 10 : 12
  });

  // Compact dimension labels right under each box
  const aBaseMid = pt(rA, cA / 2, 0);
  const bBaseMid = pt(rB, cA + cB / 2, 0);
  const dimA = svgPillLabel(aBaseMid[0] - 12, aBaseMid[1] + 18, `${boxA.l}×${boxA.w}×${boxA.h} ${unit}`, {
    bg: '#EDFAFC',
    border: '#0E6478',
    fg: '#0E6478',
    fontSize: compact ? 10 : 12
  });
  const dimB = svgPillLabel(bBaseMid[0] + 14, bBaseMid[1] + 18, `${boxB.l}×${boxB.w}×${boxB.h} ${unit}`, {
    bg: '#FFFBEB',
    border: '#B45309',
    fg: '#92400E',
    fontSize: compact ? 10 : 12
  });

  return `
    <svg class="vol-svg ${compact ? 'compact' : ''}" viewBox="0 0 ${vbW} ${vbH}" role="img" aria-label="Composite twin boxes">
      ${drawSolid(0, rA, 0, cA, hA, palA)}
      ${drawSolid(0, rB, cA, cA + cB, hB, palB)}
      <line x1="${seamTop[0].toFixed(1)}" y1="${seamTop[1].toFixed(1)}" x2="${seamBot[0].toFixed(1)}" y2="${seamBot[1].toFixed(1)}" stroke="#0F172A" stroke-width="2" stroke-dasharray="4 3" opacity="0.65"/>
      ${badgeA}
      ${badgeB}
      ${dimA}
      ${dimB}
    </svg>
  `;
}

export function buildPotionBeakerSVG({
  capacityMl = 500,
  fillMl = 300,
  title = '',
  liquidColor = 'teal',
  showTopValue = true,
  compact = false
}) {
  const vbW = compact ? 140 : 180;
  const vbH = compact ? 168 : 206;
  const bx = compact ? 38 : 50;
  const bw = compact ? 64 : 78;
  const topY = compact ? 34 : 40;
  const botY = compact ? 146 : 178;
  const bh = botY - topY;

  const colors = {
    teal: { fill: '#2DD4BF', dark: '#0D9488', top: '#99F6E4', stroke: '#0E6478' },
    sky: { fill: '#38BDF8', dark: '#0284C7', top: '#BAE6FD', stroke: '#0369A1' },
    gold: { fill: '#FBBF24', dark: '#D97706', top: '#FEF08A', stroke: '#B45309' },
    rose: { fill: '#F472B6', dark: '#DB2777', top: '#FBCFE8', stroke: '#9D174D' }
  };
  const pal = colors[liquidColor] || colors.teal;

  const ratio = Math.max(0, Math.min(1, fillMl / Math.max(1, capacityMl)));
  const liqH = bh * ratio;
  const liqY = botY - liqH;

  const step = capacityMl >= 1000 ? 200 : 100;
  const ticks = [];
  for (let v = step; v <= capacityMl; v += step) {
    const ty = botY - (v / capacityMl) * bh;
    const isMajor = v === capacityMl || v % (step * 2) === 0 || capacityMl <= 500;
    ticks.push(`<line x1="${bx + 4}" y1="${ty.toFixed(1)}" x2="${bx + (isMajor ? 22 : 14)}" y2="${ty.toFixed(1)}" stroke="#0F172A" stroke-width="${isMajor ? 1.8 : 1.2}" opacity="0.7"/>`);
    if (isMajor) {
      const lbl = v === 1000 ? '1,000' : String(v);
      ticks.push(`<text x="${bx - 5}" y="${(ty + 4).toFixed(1)}" text-anchor="end" font-size="${compact ? 9.5 : 10.5}" font-weight="800" fill="#334155">${lbl}</text>`);
    }
  }

  const badgeText = showTopValue
    ? `${fillMl === 1000 ? '1,000' : fillMl} mL`
    : (title || `${capacityMl} mL Flask`);

  return `
    <svg class="vol-svg ${compact ? 'compact' : ''}" viewBox="0 0 ${vbW} ${vbH}" role="img" aria-label="Graduated potion beaker">
      ${svgPillLabel(vbW / 2, 17, badgeText, { border: pal.stroke, fg: pal.stroke, fontSize: compact ? 11 : 12 })}
      <!-- Glass body -->
      <rect x="${bx}" y="${topY}" width="${bw}" height="${bh}" rx="10" fill="#F8FAFC" stroke="#64748B" stroke-width="2.5"/>
      <!-- Liquid column -->
      ${ratio > 0 ? `
        <rect x="${bx + 2}" y="${liqY.toFixed(1)}" width="${bw - 4}" height="${Math.max(4, liqH - 2).toFixed(1)}" rx="6" fill="${pal.fill}" opacity="0.88"/>
        <ellipse cx="${(bx + bw / 2).toFixed(1)}" cy="${liqY.toFixed(1)}" rx="${((bw - 4) / 2).toFixed(1)}" ry="5.5" fill="${pal.top}" stroke="${pal.dark}" stroke-width="1.5"/>
        <circle cx="${bx + bw * 0.65}" cy="${(liqY + liqH * 0.45).toFixed(1)}" r="3" fill="#FFFFFF" opacity="0.65"/>
        <circle cx="${bx + bw * 0.4}" cy="${(liqY + liqH * 0.7).toFixed(1)}" r="2.2" fill="#FFFFFF" opacity="0.55"/>
      ` : ''}
      <!-- Beaker rim & scale ticks -->
      <ellipse cx="${(bx + bw / 2).toFixed(1)}" cy="${topY}" rx="${(bw / 2).toFixed(1)}" ry="6" fill="#FFFFFF" fill-opacity="0.7" stroke="#475569" stroke-width="2.2"/>
      ${ticks.join('')}
      ${title && showTopValue ? `<text x="${vbW / 2}" y="${vbH - 6}" text-anchor="middle" font-size="11" font-weight="800" fill="#475569">${escapeHtml(title)}</text>` : ''}
    </svg>
  `;
}

export function buildBeakerPairSVG({ left, right }) {
  return `
    <div style="display:flex; align-items:center; justify-content:center; gap:8px; flex-wrap:wrap; width:100%;">
      <div style="width:155px;">${buildPotionBeakerSVG({ ...left, compact: true })}</div>
      <span style="font-size:1.8rem; font-weight:900; color:var(--jade-700);">+</span>
      <div style="width:155px;">${buildPotionBeakerSVG({ ...right, compact: true })}</div>
    </div>
  `;
}
