import { randInt } from '../../../shared/math.js';
import {
  DEBT_GOAL,
  buildCompareQuestion,
  cashHoard,
  compareSymbol,
  countLineHTML,
  groupHoard,
  moneyLabel,
  nearbyTotalDollars,
  splitDollars,
  symbolHTML,
  debtHoard
} from '../money.js';

function explainFair(left, right) {
  const symbol = compareSymbol(left.total, right.total);
  const leftLine = left.items.length === 0 && left.hero
    ? `${left.hero} = <strong>${moneyLabel(left.total)}</strong>`
    : countLineHTML(left);
  const rightLine = right.items.length === 0 && right.hero
    ? `${right.hero} = <strong>${moneyLabel(right.total)}</strong>`
    : countLineHTML(right);

  if (symbol === '=') {
    return `
      ${leftLine} &nbsp;•&nbsp; ${rightLine}<br/>
      <span class="cmp-symbol">${moneyLabel(left.total)} = ${moneyLabel(right.total)}</span><br/>
      Different-looking amounts, exactly the <strong>same</strong> money — you’d get the same
      amount either way, so it’s an <strong>equal</strong> deal!
    `;
  }
  const winner = symbol === '>' ? 'Left' : 'Right';
  return `
    ${leftLine} &nbsp;•&nbsp; ${rightLine}<br/>
    <span class="cmp-symbol">${moneyLabel(left.total)} ${symbolHTML(symbol)} ${moneyLabel(right.total)}</span><br/>
    Not equal! The <strong>${winner} Hoard</strong> gives you the most money.
  `;
}

function place(leftHoard, rightHoard) {
  return Math.random() < 0.5
    ? { left: leftHoard, right: rightHoard }
    : { left: rightHoard, right: leftHoard };
}

/** Two DIFFERENT-looking ways of breaking the same total into two amounts. */
function twinDecompositions(total) {
  const first = splitDollars(total, 2, 60);
  const same = parts => (parts[0] === first[0] && parts[1] === first[1])
    || (parts[0] === first[1] && parts[1] === first[0]);
  let second = splitDollars(total, 2, 60);
  let guard = 0;
  while (same(second) && guard < 25) {
    second = splitDollars(total, 2, 60);
    guard += 1;
  }
  if (same(second)) {
    for (const d of [1, -1, 2, -2]) {
      const cand = [first[0] + d, first[1] - d];
      if (cand[0] >= 1 && cand[1] >= 1 && !same(cand)) {
        second = cand;
        break;
      }
    }
  }
  return [first, second];
}

const GEMS = ['💎 gems', '🪙 gold coins', '👑 crowns', '🦪 pearls', '🧥 capes'];

export function genFairDeals() {
  const wantEqual = Math.random() < 0.45;
  const shape = randInt(0, 3);
  let left;
  let right;

  if (shape === 0) {
    // One money bag versus two piggy banks ($478 vs $239 + $239 …).
    const parts = splitDollars(randInt(210, 880), 2, 70);
    const sum = parts[0] + parts[1];
    const bag = nearbyTotalDollars(sum, {
      fraction: 0.08, minGapDollars: 3, minDollars: 80, tieChance: wantEqual ? 1 : 0
    });
    const pair = place(cashHoard([bag], 'One money bag'), cashHoard(parts, 'Two piggy banks'));
    left = pair.left;
    right = pair.right;
  } else if (shape === 1) {
    // Two pairs of piggy banks — same total or only a few dollars apart.
    const total = randInt(240, 900);
    const otherTotal = wantEqual
      ? total
      : nearbyTotalDollars(total, { fraction: 0.055, minGapDollars: 3, minDollars: 120 });
    const [aParts, bParts] = otherTotal === total
      ? twinDecompositions(total)
      : [splitDollars(total, 2, 70), splitDollars(otherTotal, 2, 70)];
    const pair = place(cashHoard(aParts, 'Two piggy banks'), cashHoard(bParts, 'Two piggy banks'));
    left = pair.left;
    right = pair.right;
  } else if (shape === 2) {
    // Equal groups versus repeated addition: 6 × $58 against $174 + $174.
    const groups = randInt(3, 9);
    const each = randInt(12, 68);
    const product = groups * each;
    const otherTotal = wantEqual
      ? product
      : nearbyTotalDollars(product, { fraction: 0.09, minGapDollars: 3, minDollars: 20 });
    const parts = splitDollars(otherTotal, 2, Math.min(40, Math.floor(otherTotal / 3)));
    const story = groupHoard({
      groups,
      eachDollars: each,
      caption: `${groups} of ${moneyLabel(each * 100)} each`
    });
    const caption = `💎 ${groups} ${GEMS[randInt(0, GEMS.length - 1)]} at ${moneyLabel(each * 100)} each`;
    story.caption = caption;
    const pair = place(story, cashHoard(parts, 'Two piggy banks'));
    left = pair.left;
    right = pair.right;
  } else {
    // Debts can be equal too: −$420 versus −$186 + −$234.
    const parts = splitDollars(randInt(230, 900), 2, 60);
    const sum = parts[0] + parts[1];
    const single = nearbyTotalDollars(sum, {
      fraction: 0.08, minGapDollars: 3, minDollars: 80, tieChance: wantEqual ? 1 : 0
    });
    const pair = place(debtHoard([single], 'One big IOU'), debtHoard(parts, 'Two IOU notes'));
    left = pair.left;
    right = pair.right;
  }

  const anyDebt = left.total < 0 || right.total < 0;

  return buildCompareQuestion({
    modeId: 'fairdeals',
    skillKey: wantEqual ? 'money_equal_yes' : 'money_equal_no',
    skillLabel: wantEqual ? 'Proving Two Amounts Are Equal' : 'Spotting the Bigger Amount',
    topicLabel: 'Equal or Not?',
    prompt: '🎯 Goal: the MOST money! Are these equal, or does one give you more? Tap <strong>Left</strong>, <strong>Right</strong>, or <strong>Equal</strong>!',
    goal: anyDebt ? DEBT_GOAL : 'Goal: take the amount that gives you the MOST money — or both if they match!',
    dedupeKey: `fair_${wantEqual ? 'eq' : 'ne'}_${left.total}_${right.total}`,
    fluencySeconds: 34,
    left,
    right,
    showEqualOption: true,
    debtHint: anyDebt
      ? 'Careful — these amounts are debts, so the debt closer to $0 is the better one.'
      : '',
    helperText: 'Work out each side first (multiply before adding!), then compare the totals with > , < or =.',
    explanationHTML: explainFair(left, right)
  });
}
