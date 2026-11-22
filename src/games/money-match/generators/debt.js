import { randInt } from '../../../shared/math.js';
import {
  DEBT_GOAL,
  MINUS_SIGN,
  buildCompareQuestion,
  compareSymbol,
  countLineHTML,
  nearbyTotalDollars,
  splitDollars,
  symbolHTML,
  debtHoard,
  diffLabel,
  moneyLabel
} from '../money.js';

const DEBT_HINT = 'Both hoards are DEBT (money owed). To end with the MOST money, take the debt you owe LESS of — the total closer to $0!';

/** Debts can stack up to a few hundred dollars, but never past $1,000. */
const CEILING = 980;

const PROMPTS = [
  'Both treasure chests are in the red! Which debt leaves you with <strong>MORE</strong> money?',
  'These hoards are money <strong>owed</strong>. Take the debt that hurts LESS — that’s the most money!',
  'Owing less money means keeping MORE. Add both sides: which debt is smaller?',
  'Negative money! Choose the side that leaves you with the <strong>MOST</strong> money.'
];

function explainDebt(left, right) {
  const symbol = compareSymbol(left.total, right.total);
  const oweL = moneyLabel(Math.abs(left.total));
  const oweR = moneyLabel(Math.abs(right.total));

  const leftCounted = countLineHTML(left);
  const rightCounted = countLineHTML(right);

  if (symbol === '=') {
    return `
      ${leftCounted} &nbsp;•&nbsp; ${rightCounted}<br/>
      Both dragons owe exactly <strong>${oweL}</strong>, so you end up with the same money either way!
    `;
  }

  const winner = symbol === '>' ? 'Left' : 'Right';
  const loser = symbol === '>' ? 'Right' : 'Left';
  return `
    ${leftCounted} &nbsp;•&nbsp; ${rightCounted}<br/>
    <span class="cmp-symbol">${moneyLabel(left.total)} ${symbolHTML(symbol)} ${moneyLabel(right.total)}</span><br/>
    Owing <strong>${Math.abs(left.total) > Math.abs(right.total) ? oweR : oweL}</strong> beats owing
    <strong>${Math.abs(left.total) > Math.abs(right.total) ? oweL : oweR}</strong>: the
    <strong>${winner} Hoard</strong> is closer to $0, so you keep <strong>${diffLabel(left.total - right.total)}</strong>
    more money than with the ${loser} debt!
  `;
}

function pickPrompt() {
  return PROMPTS[randInt(0, PROMPTS.length - 1)];
}

function place(leftHoard, rightHoard) {
  return Math.random() < 0.5
    ? { left: leftHoard, right: rightHoard }
    : { left: rightHoard, right: leftHoard };
}

/** Two IOU notes with real 3-digit balances. */
function twoIOUs() {
  for (let attempt = 0; attempt < 50; attempt++) {
    const owed = [randInt(112, 452), randInt(96, 398)];
    if (owed[0] + owed[1] <= CEILING && owed[0] !== owed[1]) return owed;
  }
  return [236, 188];
}

/** Three IOU notes — the dragon borrowed from every merchant at the market. */
function threeIOUs() {
  for (let attempt = 0; attempt < 60; attempt++) {
    const owed = [randInt(104, 336), randInt(88, 288), randInt(72, 254)];
    if (owed.reduce((s, v) => s + v, 0) <= CEILING) return owed;
  }
  return [182, 156, 121];
}

export function genDebt() {
  const roll = Math.random();

  // 3A — one big IOU versus two IOU notes (−$462 vs −$219 + −$248)
  if (roll < 0.45) {
    const owed = twoIOUs();
    const sum = owed[0] + owed[1];
    const single = nearbyTotalDollars(sum, {
      fraction: 0.08, minGapDollars: 2, minDollars: 60, tieChance: 0.12
    });

    const { left, right } = place(
      debtHoard([single], 'One big IOU'),
      debtHoard(owed, 'Two IOU notes')
    );

    return buildCompareQuestion({
      modeId: 'debt',
      skillKey: 'money_debt_sum',
      skillLabel: 'Comparing Big Debts',
      topicLabel: 'Debt Duel',
      prompt: pickPrompt(),
      dedupeKey: `dbt2_${left.total}_${right.total}`,
      fluencySeconds: 32,
      left,
      right,
      goal: DEBT_GOAL,
      debtHint: DEBT_HINT,
      helperText: 'Add the IOUs together, then ask: which total is closer to $0? That one leaves you richer.',
      explanationHTML: explainDebt(left, right)
    });
  }

  // 3B — three IOU notes versus two IOU notes
  if (roll < 0.74) {
    const leftOwed = threeIOUs();
    const leftSum = leftOwed.reduce((s, v) => s + v, 0);
    const rightSum = nearbyTotalDollars(leftSum, {
      fraction: 0.06, minGapDollars: 2, minDollars: 120
    });
    const rightOwed = splitDollars(rightSum, 2, 60);

    const { left, right } = place(
      debtHoard(leftOwed, 'Three IOU notes'),
      debtHoard(rightOwed, 'Two IOU notes')
    );

    return buildCompareQuestion({
      modeId: 'debt',
      skillKey: 'money_debt_pair',
      skillLabel: 'Adding Up Several Debts',
      topicLabel: 'Debt Duel',
      prompt: pickPrompt(),
      dedupeKey: `dbt4_${Math.min(left.total, right.total)}_${Math.max(left.total, right.total)}`,
      fluencySeconds: 40,
      left,
      right,
      goal: DEBT_GOAL,
      debtHint: DEBT_HINT,
      helperText: 'Add each side to its own total. The BIGGER total owed is the WORSE amount of money.',
      explanationHTML: explainDebt(left, right)
    });
  }

  // 3C — one IOU versus one IOU, only a few dollars apart
  const big = randInt(214, 936);
  const small = nearbyTotalDollars(big, { fraction: 0.05, minGapDollars: 1, minDollars: 60 });

  const { left, right } = place(
    debtHoard([big], 'One IOU'),
    debtHoard([small], 'One IOU')
  );

  return buildCompareQuestion({
    modeId: 'debt',
    skillKey: 'money_debt_cmp',
    skillLabel: 'Negative Amounts on a Money Line',
    topicLabel: 'Debt Duel',
    prompt: pickPrompt(),
    dedupeKey: `dbt1_${Math.min(big, small)}_${Math.max(big, small)}`,
    fluencySeconds: 22,
    left,
    right,
    goal: DEBT_GOAL,
    debtHint: DEBT_HINT,
    helperText: `On a money line, ${MINUS_SIGN}$240 sits to the RIGHT of ${MINUS_SIGN}$930 — to the right means more money!`,
    explanationHTML: explainDebt(left, right)
  });
}
