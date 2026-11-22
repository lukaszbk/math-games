import { randInt, shuffle } from '../../../shared/math.js';
import {
  DEBT_GOAL,
  buildCompareQuestion,
  compareSymbol,
  symbolHTML,
  countLineHTML,
  diffLabel,
  mixedHoard,
  moneyLabel,
  nearbyDelta,
  randomSign
} from '../money.js';

const HINT_MIX = 'Money earned is positive (+) and money spent is negative (−). Add each side up, then take the bigger amount!';
const CASH_GOAL = 'Goal: end with the MOST money — earnings count up, spending counts down!';

/** No single amount, and no running total, ever leaves the ±$1,000 zone. */
const MAX_TERM = 960;
const MAX_TOTAL = 880;

function explainMixed(left, right) {
  const symbol = compareSymbol(left.total, right.total);
  const leftCounted = countLineHTML(left);
  const rightCounted = countLineHTML(right);

  if (symbol === '=') {
    return `${leftCounted} &nbsp;•&nbsp; ${rightCounted}<br/>Different earning and spending stories can still land on the same amount!`;
  }

  const winner = symbol === '>' ? 'Left' : 'Right';
  return `
    ${leftCounted} &nbsp;•&nbsp; ${rightCounted}<br/>
    <span class="cmp-symbol">${moneyLabel(left.total)} ${symbolHTML(symbol)} ${moneyLabel(right.total)}</span><br/>
    The <strong>${winner} Hoard</strong> ends with the most money — that’s
    <strong>${diffLabel(left.total - right.total)}</strong> more in the purse!
  `;
}

/**
 * Build an earn/spend story (2 or 3 amounts) that adds up to EXACTLY `total`,
 * so the two sides can be placed a few dollars apart on purpose.
 */
function storyForTotal(total, forceThree = false) {
  const wantThree = forceThree || Math.random() < 0.5;
  const terms = [];

  if (total >= 0) {
    const spendCap = Math.max(60, Math.min(340, MAX_TERM - total));
    const spend = randInt(60, spendCap);
    const extraCap = Math.min(170, MAX_TERM - total - spend);
    const extra = wantThree && extraCap >= 25 ? randInt(25, extraCap) : 0;
    terms.push(total + spend + extra, -spend);
    if (extra) terms.push(-extra);
  } else {
    const owed = -total;
    const earn = (owed < 60 || Math.random() < 0.75)
      ? randInt(40, Math.max(50, Math.min(240, MAX_TERM - owed)))
      : 0;
    const spend = owed + earn;
    if ((earn === 0 || wantThree) && spend >= 60) {
      const part = randInt(25, spend - 25);
      terms.push(-part, -(spend - part));
    } else {
      terms.push(-spend);
    }
    if (earn) terms.push(earn);
  }

  return shuffle(terms);
}

function baseTotal() {
  // Usually a big three-figure balance; occasionally a small one for variety.
  const magnitude = Math.random() < 0.12 ? randInt(25, 120) : randInt(190, MAX_TOTAL);
  return randomSign() * magnitude;
}

export function genPlusMinus() {
  const leftTotal = baseTotal();
  const wantTie = Math.random() < 0.08;
  let rightTotal;
  if (wantTie) {
    rightTotal = leftTotal;
  } else {
    const gap = nearbyDelta(leftTotal * 100, { minCents: 1500, fraction: 0.09, maxCents: 6000 });
    const step = Math.max(15, Math.round(gap / 100));
    const dir = randomSign();
    let candidate = leftTotal + dir * step;
    if (Math.abs(candidate) > MAX_TOTAL) candidate = leftTotal - dir * step;
    rightTotal = candidate;
  }

  const left = mixedHoard(storyForTotal(leftTotal), 'Earn & spend');
  let right = mixedHoard(storyForTotal(rightTotal), 'Earn & spend');
  // Two sides that read the same way are no puzzle at all, so on a tie the
  // right-hand story gets rebuilt until it looks different.
  for (let attempt = 0; attempt < 12 && right.hero === left.hero; attempt++) {
    right = mixedHoard(storyForTotal(rightTotal, attempt >= 4), 'Earn & spend');
  }
  if (right.hero === left.hero && right.items.length >= 2) {
    const adjusted = right.items.map(it => it.cents / 100);
    if (adjusted[0] !== adjusted[adjusted.length - 1]) {
      adjusted.push(adjusted.shift());
    } else if (adjusted[0] > 0) {
      adjusted[0] -= 1;
      adjusted[1] += 1;
    } else {
      adjusted[0] += 1;
      adjusted[1] -= 1;
    }
    right = mixedHoard(adjusted, 'Earn & spend');
  }

  const bothDebt = left.total < 0 && right.total < 0;
  const oneDebt = (left.total < 0) !== (right.total < 0);
  const debtHint = bothDebt
    ? 'Both sides ended below $0 — the dragon closer to $0 owes LESS and wins!'
    : (oneDebt
        ? 'One side ended below $0 — that dragon is in debt, so the positive side has more money.'
        : '');

  return buildCompareQuestion({
    modeId: 'plusminus',
    skillKey: 'money_signed_sum',
    skillLabel: 'Adding Up to Three Signed Amounts',
    topicLabel: 'Earn & Spend Mix',
    prompt: '🎯 Goal: the MOST money! Each dragon earned money and spent money. Which pocket ends up with MORE?',
    goal: bothDebt ? DEBT_GOAL : CASH_GOAL,

    dedupeKey: `pmx_${left.total}_${right.total}`,
    fluencySeconds: 45,
    left,
    right,
    debtHint,
    helperText: 'Add all the earnings together, add all the spending together, then subtract: earnings − spending.',
    explanationHTML: explainMixed(left, right)
  });
}
