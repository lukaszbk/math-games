import { shuffle } from '../../../shared/math.js';
import {
  MAX_AMOUNT_CENTS,
  buildCompareQuestion,
  centsHoard,
  compareSymbol,
  countLineHTML,
  diffLabel,
  moneyLabel,
  nearbyDelta,
  pieceHoardForTotal,
  randomBillStack,
  randomSign,
  symbolHTML
} from '../money.js';

function explainStacks(left, right) {
  const symbol = compareSymbol(left.total, right.total);
  const leftCounted = countLineHTML(left);
  const rightCounted = countLineHTML(right);

  if (symbol === '=') {
    return `${leftCounted} • ${rightCounted}<br/>Two different piles can still give you exactly the same amount of money!`;
  }
  const winner = symbol === '>' ? 'Left' : 'Right';
  return `
    ${leftCounted} &nbsp;•&nbsp; ${rightCounted}<br/>
    <span class="cmp-symbol">${moneyLabel(left.total)} ${symbolHTML(symbol)} ${moneyLabel(right.total)}</span><br/>
    The <strong>${winner} Hoard</strong> gives you the most money — <strong>${diffLabel(left.total - right.total)}</strong> more!
  `;
}

function countNote(hoard) {
  const bills = (hoard.items || []).filter(it => it.cents >= 100).length;
  const coins = (hoard.items || []).filter(it => it.cents < 100).length;
  const parts = [];
  if (bills > 0) parts.push(`${bills} ${bills === 1 ? 'bill' : 'bills'}`);
  if (coins > 0) parts.push(`${coins} ${coins === 1 ? 'coin' : 'coins'}`);
  return parts.join(' and ') || 'money';
}

/** How many coins it takes to make `cents` exactly (99 = too many). */
function coinPieces(cents) {
  let rest = cents;
  let used = 0;
  for (const coin of [25, 10, 5, 1]) {
    while (rest >= coin && used <= 4) {
      rest -= coin;
      used += 1;
    }
  }
  return rest === 0 ? used : 99;
}

/**
 * Amounts only a few percent away from `totalCents` (odd cents included), so
 * counting every bill and coin is the only way to settle it. Candidates whose
 * cents part would need a fistful of coins are dropped — a pile has to be
 * buildable from real money.
 */
function nearbyTargets(totalCents) {
  const step = nearbyDelta(totalCents, {
    minCents: 25, fraction: 0.025, maxCents: 700, stepCents: 5
  });
  const sign = randomSign();
  return shuffle([1, 1, 2, 2, 3, 4, 5])
    .map(k => totalCents + sign * step * k)
    .filter(c => c > 2000 && c <= MAX_AMOUNT_CENTS && coinPieces(c % 100) <= 3);
}

export function genBills() {
  // 2A — two piles of real bills and coins worth nearly the same money (55%)
  if (Math.random() < 0.55) {
    const stackA = randomBillStack(520, true);
    const options = nearbyTargets(stackA.total);

    let stackB = null;
    for (const cents of options) {
      stackB = pieceHoardForTotal(cents, 8);
      if (stackB) break;
    }
    if (!stackB) {
      // Real money can't always hit that exact amount — hand over one money bag
      // of the same nearby value instead of letting the gap drift wide open.
      stackB = centsHoard([options[0] || stackA.total + 315], 'One money bag');
    }

    stackA.caption = countNote(stackA);
    stackB.caption = stackB.items.length > 1 ? countNote(stackB) : stackB.caption;
    const pair = Math.random() < 0.5
      ? { left: stackA, right: stackB }
      : { left: stackB, right: stackA };

    return buildCompareQuestion({
      modeId: 'bills',
      skillKey: 'money_bills',
      skillLabel: 'Counting Big Bill & Coin Piles',
      topicLabel: 'Bill & Coin Stacks',
      prompt: '🎯 Goal: the MOST money! Count every bill and coin — which stack is worth MORE?',
      goal: 'Goal: pick the stack worth the MOST money!',

      dedupeKey: `bil_${pair.left.total}_${pair.right.total}`,
      fluencySeconds: 40,
      left: pair.left,
      right: pair.right,
      helperText: 'Count the $100s, then $50s and $20s, then the $1 bills — and finish with the odd coins.',
      explanationHTML: explainStacks(pair.left, pair.right)
    });
  }

  // 2B — a pile of bills and coins versus one flat amount with odd cents
  const stack = randomBillStack(520, true);
  const options = nearbyTargets(stack.total);
  const flatCents = options[0] || stack.total + 315;
  const flat = centsHoard([flatCents], 'One money bag');
  stack.caption = countNote(stack);

  const pair = Math.random() < 0.5
    ? { left: stack, right: flat }
    : { left: flat, right: stack };

  return buildCompareQuestion({
    modeId: 'bills',
    skillKey: 'money_bills_flat',
    skillLabel: 'Bill Piles Versus One Amount',
    topicLabel: 'Bill & Coin Stacks',
    prompt: '🎯 Goal: the MOST money! Is the pile of money worth more, or the single amount?',
    goal: 'Goal: take whichever one is worth the MOST money!',

    dedupeKey: `bif_${stack.total}_${flatCents}`,
    fluencySeconds: 34,
    left: pair.left,
    right: pair.right,
    helperText: 'Count the pile by its biggest bills first, add the coins last, then compare down to the cents.',
    explanationHTML: explainStacks(pair.left, pair.right)
  });
}
