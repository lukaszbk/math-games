/**
 * Money helpers for Money Match: Dragon Hoard Duel.
 *
 * Every amount in this game is stored as INTEGER CENTS so that coins and debt
 * stay exact (never floats). A NEGATIVE amount means the dragon is in debt —
 * an IOU note that has to be paid back. The "better" amount is always the
 * GREATER value: owing less money beats owing more money.
 */

import { pick, randInt } from '../../shared/math.js';

export const MINUS_SIGN = '−';

/** The single objective shown on every puzzle and every quest card. */
export const MONEY_GOAL = 'Goal: walk away with the MOST money!';
export const DEBT_GOAL = 'Goal: end with the MOST money — so take the debt you owe the LEAST of!';

export const BILL_NOTES = {
  10000: '$100 bill',
  5000: '$50 bill',
  2000: '$20 bill',
  1000: '$10 bill',
  500: '$5 bill',
  200: '$2 bill',
  100: '$1 bill'
};

/**
 * Every amount stays INSIDE $1,000 — that is the grade-3 place-value ceiling,
 * but the puzzles lean on the top of it: 3-digit sums, awkward cents and
 * near-ties that can only be settled by actually calculating.
 */
export const MAX_AMOUNT_CENTS = 99_900;

export const COIN_NOTES = {
  25: 'quarter',
  10: 'dime',
  5: 'nickel',
  1: 'penny'
};

/** $50, $7.45, 25¢, −$12 — display formatting for a signed cent amount. */
export function moneyLabel(cents) {
  const negative = cents < 0;
  const abs = Math.abs(cents);
  let body;
  if (abs % 100 === 0) {
    body = `$${abs / 100}`;
  } else if (abs < 100) {
    body = `${abs}\u00A2`;
  } else {
    const dollars = Math.floor(abs / 100);
    const rem = String(abs % 100).padStart(2, '0');
    body = `$${dollars}.${rem}`;
  }
  return negative ? `${MINUS_SIGN}${body}` : body;
}

/** Big, friendly version used inside a hoard card ("$50", "−$52"). */
export function moneyHeroLabel(cents) {
  return moneyLabel(cents);
}

export function totalOf(items) {
  return items.reduce((sum, it) => sum + it.cents, 0);
}

/** 'pos' | 'neg' | 'mixed' — drives the colour tone of a hoard card. */
export function amountTone(items) {
  if (!items || items.length === 0) return 'pos';
  const debts = items.filter(it => it.cents < 0).length;
  if (debts === 0) return 'pos';
  if (debts === items.length) return 'neg';
  return 'mixed';
}

/** Render a signed sum the way a kid writes it: "$29 + $29" or "−$25 + −$27". */
export function signedExpression(items) {
  return items.map(it => moneyLabel(it.cents)).join(' + ');
}

/** `<` must be escaped or the browser treats it as the start of a tag. */
export function symbolHTML(symbol) {
  return symbol === '<' ? '&lt;' : symbol;
}

export function compareSymbol(a, b) {
  if (a === b) return '=';
  return a > b ? '>' : '<';
}

export function diffLabel(cents) {
  return moneyLabel(Math.abs(cents));
}

/** "Left: $29 + $29 = $58" (or just "$50" when a hoard is a single amount). */
export function countLineHTML(hoard) {
  const items = hoard && hoard.items ? hoard.items : [];
  if (items.length > 1) {
    return `${signedExpression(items)} = <strong>${moneyLabel(totalOf(items))}</strong>`;
  }
  return `<strong>${moneyLabel(totalOf(items))}</strong>`;
}

/**
 * Compare two hoards and produce a fully-formed `choice` question for the
 * shared arena engine. `left` / `right` are `{ items, total, caption?, hero? }`.
 */
export function buildCompareQuestion(cfg) {
  const {
    modeId,
    skillKey,
    skillLabel,
    topicLabel,
    prompt,
    dedupeKey,
    left,
    right,
    fluencySeconds = 16,
    helperText = '',
    mistakeSummary = '',
    explanationHTML = '',
    showEqualOption = false,
    debtHint = '',
    goal = MONEY_GOAL
  } = cfg;

  const leftTotal = left.total;
  const rightTotal = right.total;
  const symbol = compareSymbol(leftTotal, rightTotal);

  const leftExpr = left.hero || signedExpression(left.items);
  const rightExpr = right.hero || signedExpression(right.items);

  const leftId = `Left ${leftExpr}`;
  const rightId = `Right ${rightExpr}`;
  const answerId = symbol === '=' ? 'equal' : (symbol === '>' ? leftId : rightId);

  const choices = [
    { id: leftId, label: leftExpr, sub: '👈 Left Hoard' },
    { id: rightId, label: rightExpr, sub: '👉 Right Hoard' }
  ];
  if (showEqualOption || symbol === '=') {
    choices.push({ id: 'equal', label: '🤝 They’re Equal!', sub: 'Both sides match' });
  }

  const diff = Math.abs(leftTotal - rightTotal);
  const leftSolved = (left.items || []).length > 1
    ? `${leftExpr} = <strong>${moneyLabel(leftTotal)}</strong>`
    : `<strong>${moneyLabel(leftTotal)}</strong>`;
  const rightSolved = (right.items || []).length > 1
    ? `${rightExpr} = <strong>${moneyLabel(rightTotal)}</strong>`
    : `<strong>${moneyLabel(rightTotal)}</strong>`;

  let defaultExplanation;
  if (symbol === '=') {
    defaultExplanation = `
      ${leftSolved} &nbsp;•&nbsp; ${rightSolved}<br/>
      Both hoards are worth exactly the <strong>same</strong> money, so
      <strong>${leftExpr} = ${rightExpr}</strong> — neither one gives you more!
    `;
  } else {
    const winner = symbol === '>' ? 'Left' : 'Right';
    defaultExplanation = `
      ${leftSolved} &nbsp;•&nbsp; ${rightSolved}<br/>
      <strong>${moneyLabel(leftTotal)} ${symbolHTML(symbol)} ${moneyLabel(rightTotal)}</strong> — the
      <strong>${winner} Hoard</strong> gives you the most money, with
      <strong>${diffLabel(diff)}</strong> more in your purse.
    `;
  }

  return {
    dedupeKey,
    domainId: modeId,
    skillKey,
    skillLabel,
    topicLabel,
    inputType: 'choice',
    fluencySeconds,
    prompt,
    stageHTML: buildDuelStageHTML({ left, right, debtHint, goal }),
    choices,
    answer: answerId,
    leftTotal,
    rightTotal,
    comparison: symbol,
    helperText,
    mistakeSummary: mistakeSummary || `${leftExpr} vs ${rightExpr}`,
    explanationHTML: explanationHTML || defaultExplanation
  };
}

function chipHTML(item) {
  const tone = item.cents < 0 ? 'chip-debt' : 'chip-cash';
  return `
    <span class="money-chip ${tone}">
      <span class="chip-amt">${moneyLabel(item.cents)}</span>
      <span class="chip-note">${item.note || ''}</span>
    </span>
  `;
}

function hoardCardHTML(side, hoard, opts = {}) {
  const { interactive = false, index = 0 } = opts;
  const tone = hoard.tone || amountTone(hoard.items || []);
  const items = hoard.items || [];
  // Amounts are written as an explicit sum ($29 + $29) so kids see the addition.
  const visual = items.length > 0
    ? `<span class="hoard-chips">${items.map(chipHTML).join('<span class="chip-plus">+</span>')}</span>`
    : `<span class="hoard-hero">${hoard.hero || moneyHeroLabel(hoard.total || 0)}</span>`;
  const caption = hoard.caption
    ? `<span class="hoard-caption">${hoard.caption}</span>`
    : '';
  const tag = side === 'left' ? '👈 Left Hoard' : '👉 Right Hoard';

  if (!interactive) {
    return `
      <div class="hoard-card static tone-${tone}">
        <span class="hoard-tag">${tag}</span>
        ${visual}
        ${caption}
      </div>
    `;
  }

  return `
    <button type="button" class="hoard-card tone-${tone}" data-action="submit-choice" data-index="${index}">
      <span class="hoard-tag">${tag}</span>
      ${visual}
      ${caption}
      <span class="hoard-pick">Tap me!</span>
    </button>
  `;
}

/** The two treasure cards the kid compares. */
export function buildDuelStageHTML({ left, right, debtHint = '', goal = MONEY_GOAL }) {
  const goalBanner = goal ? `<p class="duel-goal">🎯 ${goal}</p>` : '';
  const hint = debtHint ? `<p class="duel-hint">🕳️ ${debtHint}</p>` : '';
  return `
    ${goalBanner}
    <div class="money-duel">
      ${hoardCardHTML('left', left, { interactive: true, index: 0 })}
      <div class="duel-vs"><span>VS</span></div>
      ${hoardCardHTML('right', right, { interactive: true, index: 1 })}
    </div>
    ${hint}
  `;
}

/** Non-clickable version of the duel, used inside the family guide. */
export function buildStaticDuelHTML({ left, right }) {
  return `
    <div class="money-duel static-duel">
      ${hoardCardHTML('left', left)}
      <div class="duel-vs"><span>VS</span></div>
      ${hoardCardHTML('right', right)}
    </div>
  `;
}

/* ------------------------------------------------------------------ *
 * Random pile builders                                                *
 * ------------------------------------------------------------------ */

/** Build a cash hoard out of whole dollar amounts: [50] or [29, 29]. */
export function cashHoard(dollarAmounts, caption = '') {
  return centsHoard(dollarAmounts.map(d => d * 100), caption);
}

/**
 * Same as cashHoard but the amounts are already cents, so a pile can carry
 * awkward cents like $284.65 instead of only tidy dollars.
 */
export function centsHoard(centsAmounts, caption = '') {
  const items = centsAmounts.map(c => ({ cents: c, note: c < 0 ? 'IOU' : '' }));
  return {
    items,
    total: totalOf(items),
    hero: signedExpression(items),
    tone: amountTone(items),
    caption
  };
}

/**
 * A gap that scales with how big the amounts are. Two piles worth $400 that
 * differ by $7 force real calculating — that is the challenge level here.
 */
export function nearbyDelta(magnitudeCents, opts = {}) {
  const { minCents = 100, fraction = 0.06, maxCents = 3000, stepCents = 100 } = opts;
  const spread = Math.max(minCents, Math.min(maxCents, Math.round(Math.abs(magnitudeCents) * fraction)));
  const raw = randInt(minCents, spread);
  return Math.max(minCents, Math.round(raw / stepCents) * stepCents);
}

/** Random +1 or −1, so the tricky side never sits in the same place. */
export function randomSign() {
  return Math.random() < 0.5 ? -1 : 1;
}

/**
 * A whole-dollar amount that sits CLOSE to `totalDollars` (a small percentage
 * away, never a lazy double-the-amount gap), so the comparison has to be
 * calculated. Pass `tieChance` to allow an exact tie now and then.
 */
export function nearbyTotalDollars(totalDollars, opts = {}) {
  const {
    fraction = 0.07,
    minGapDollars = 1,
    minDollars = 20,
    maxDollars = MAX_AMOUNT_CENTS / 100,
    tieChance = 0
  } = opts;
  if (Math.random() < tieChance) return totalDollars;
  const deltaCents = nearbyDelta(totalDollars * 100, {
    minCents: minGapDollars * 100,
    fraction,
    maxCents: maxDollars * 100
  });
  const step = Math.max(minGapDollars, Math.round(deltaCents / 100));
  const direction = randomSign();
  const forward = totalDollars + direction * step;
  if (forward >= minDollars && forward <= maxDollars) return forward;
  const backward = totalDollars - direction * step;
  if (backward >= minDollars && backward <= maxDollars) return backward;
  return Math.max(minDollars, Math.min(maxDollars, totalDollars + (totalDollars > maxDollars / 2 ? -step : step)));
}

/** Split `total` into `count` unequal-ish parts (each ≥ `minPart` when `total` allows). */
export function splitDollars(total, count, minPart = 40) {
  const effectiveMin = Math.max(1, Math.min(minPart, Math.floor(total / count)));
  const floor = Math.max(effectiveMin, Math.floor(total / (count * 3)));
  const parts = Array.from({ length: count }, () => floor);
  let rest = total - floor * count;
  let guard = 0;
  while (rest > 0) {
    const i = guard % count;
    const add = randInt(1, Math.max(1, Math.min(rest, Math.round(total / 4))));
    parts[i] += Math.min(add, rest);
    rest -= Math.min(add, rest);
    guard += 1;
    if (guard > 200) break;
  }
  if (rest > 0) {
    parts[0] += rest;
    rest = 0;
  }
  return parts;
}

/**
 * A hoard built from real pieces of money given in cents (bills ≥ 100, coins
 * below 100).
 */
export function pieceHoard(pieceCents, caption = '') {
  const items = pieceCents.map(c => ({
    cents: c,
    note: c >= 100 ? (BILL_NOTES[c] || 'bill') : (COIN_NOTES[c] || 'coin')
  }));
  return {
    items,
    total: totalOf(items),
    tone: 'pos',
    caption: caption || `${items.length} pieces of money`
  };
}

const PIECE_DENOMS = [10000, 5000, 2000, 1000, 500, 200, 100, 25, 10, 5, 1];

/**
 * Build a pile of bills and coins worth EXACTLY `totalCents`, or return null if
 * that needs more than `maxPieces` pieces.
 */
export function pieceHoardForTotal(totalCents, maxPieces = 7, caption = '') {
  if (!Number.isInteger(totalCents) || totalCents <= 0 || totalCents > MAX_AMOUNT_CENTS) return null;
  const pieces = [];
  let rest = totalCents;
  for (const denom of PIECE_DENOMS) {
    while (rest >= denom && pieces.length < maxPieces) {
      pieces.push(denom);
      rest -= denom;
    }
    if (rest === 0) break;
  }
  return rest === 0 ? pieceHoard(pieces, caption) : null;
}

/** `6 × $58` — equal groups of treasure, optionally with loose money added on. */
export function groupHoard({ groups, eachDollars, extraDollars = 0, caption = '' }) {
  const eachCents = eachDollars * 100;
  const extraCents = extraDollars * 100;
  return {
    items: [],
    total: groups * eachCents + extraCents,
    hero: extraCents > 0
      ? `${groups} × ${moneyLabel(eachCents)} + ${moneyLabel(extraCents)}`
      : `${groups} × ${moneyLabel(eachCents)}`,
    tone: 'pos',
    caption
  };
}

/** Build a debt hoard (all amounts are owed, so all negative). */
export function debtHoard(owedDollars, caption = '') {
  const items = owedDollars.map(d => ({ cents: -Math.abs(d) * 100, note: 'IOU' }));
  return {
    items,
    total: totalOf(items),
    hero: signedExpression(items),
    tone: 'neg',
    caption
  };
}

/** Build a hoard that mixes earning (+) and spending (−). */
export function mixedHoard(signedDollars, caption = '') {
  const items = signedDollars.map(d => ({
    cents: d * 100,
    note: d < 0 ? 'spent' : 'earned'
  }));
  return {
    items,
    total: totalOf(items),
    hero: signedExpression(items),
    tone: amountTone(items),
    caption
  };
}

/** Build a hoard from real US bills (and optionally coins). */
export function billHoard(billValues, coinValues = [], caption = '') {
  const items = [
    ...billValues.map(v => ({ cents: v * 100, note: BILL_NOTES[v * 100] || 'bill' })),
    ...coinValues.map(c => ({ cents: c, note: COIN_NOTES[c] || 'coin' }))
  ];
  return {
    items,
    total: totalOf(items),
    tone: 'pos',
    caption: caption || `${items.length} pieces of money`
  };
}

const BIG_BILLS = [100, 100, 100, 50, 50, 50, 20, 20, 20, 10];
const SMALL_BILLS = [20, 10, 10, 5, 5, 2, 1];
const COMMON_COINS = [25, 25, 25, 10, 10, 10, 5, 1, 1];

/**
 * A real-looking pile: 3–6 bills (up through $100s, sometimes a sneaky $2 bill)
 * plus 1–2 coins most of the time, so totals land on awkward cents like
 * $386.65. Kept comfortably inside the $1,000 ceiling.
 */
export function randomBillStack(maxDollars = 520, allowCoins = true) {
  for (let attempt = 0; attempt < 80; attempt++) {
    const count = randInt(3, 6);
    const bills = [];
    let smallOnes = 0;
    for (let i = 0; i < count; i++) {
      let value = pick(Math.random() < 0.65 ? BIG_BILLS : SMALL_BILLS);
      if (value <= 2) {
        smallOnes += 1;
        if (smallOnes > 2) value = 5;
      }
      bills.push(value);
    }
    const coins = allowCoins && Math.random() < 0.7
      ? Array.from({ length: randInt(1, 2) }, () => pick(COMMON_COINS))
      : [];
    const dollars = bills.reduce((s, b) => s + b, 0);
    const cents = coins.reduce((s, c) => s + c, 0);
    if (dollars + cents / 100 <= maxDollars && dollars >= 90) {
      bills.sort((a, b) => b - a);
      coins.sort((a, b) => b - a);
      return billHoard(bills, coins);
    }
  }
  return billHoard([100, 50, 20, 5], [25, 10]);
}
