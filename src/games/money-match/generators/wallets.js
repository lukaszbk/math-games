import { randInt } from '../../../shared/math.js';
import {
  buildCompareQuestion,
  cashHoard,
  compareSymbol,
  nearbyTotalDollars,
  symbolHTML,
  diffLabel,
  moneyLabel
} from '../money.js';

/** Grade-3 place-value ceiling: everything stays inside $1,000. */
const CEILING = 985;

const PROMPTS = [
  'Which hoard gives you <strong>MORE</strong> money? Tap it to pocket it!',
  'Add up both sides — which one puts <strong>more money</strong> in your purse?',
  'These amounts are close. Do the math and take the hoard with <strong>MORE</strong> money!',
  'You get to choose one hoard. Which holds <strong>more money</strong>?'
];

function explainWallet(left, right) {
  const symbol = compareSymbol(left.total, right.total);
  const leftSolved = left.items.length > 1
    ? `Left: ${left.hero} = <strong>${moneyLabel(left.total)}</strong>`
    : `Left: <strong>${moneyLabel(left.total)}</strong>`;
  const rightSolved = right.items.length > 1
    ? `Right: ${right.hero} = <strong>${moneyLabel(right.total)}</strong>`
    : `Right: <strong>${moneyLabel(right.total)}</strong>`;

  if (symbol === '=') {
    return `${leftSolved} • ${rightSolved}<br/>Both sides give you exactly the same amount of money!`;
  }
  const winner = symbol === '>' ? 'Left' : 'Right';
  return `
    ${leftSolved} &nbsp;•&nbsp; ${rightSolved}<br/>
    <span class="cmp-symbol">${moneyLabel(left.total)} ${symbolHTML(symbol)} ${moneyLabel(right.total)}</span><br/>
    The <strong>${winner} Hoard</strong> gives you the most money — that’s
    <strong>${diffLabel(left.total - right.total)}</strong> more in your purse!
  `;
}

function place(leftHoard, rightHoard) {
  return Math.random() < 0.5
    ? { left: leftHoard, right: rightHoard }
    : { left: rightHoard, right: leftHoard };
}

function pickPrompt() {
  return PROMPTS[randInt(0, PROMPTS.length - 1)];
}

/** Two piggy banks with chunky 2- and 3-digit amounts that stay inside $1,000. */
function twoAddends() {
  for (let attempt = 0; attempt < 50; attempt++) {
    const parts = [randInt(118, 486), randInt(96, 428)];
    if (parts[0] + parts[1] <= CEILING && parts[0] !== parts[1]) return parts;
  }
  return [214, 176];
}

/** Three piggy banks — adding three 3-digit numbers without messing up. */
function threeAddends() {
  for (let attempt = 0; attempt < 60; attempt++) {
    const parts = [randInt(104, 348), randInt(96, 292), randInt(75, 268)];
    if (parts.reduce((s, p) => s + p, 0) <= CEILING) return parts;
  }
  return [186, 154, 137];
}

export function genWallets() {
  const roll = Math.random();

  // 1A — one money bag versus two piggy banks ($478 vs $239 + $245)
  if (roll < 0.45) {
    const parts = twoAddends();
    const sum = parts[0] + parts[1];
    const bag = nearbyTotalDollars(sum, { fraction: 0.08, minGapDollars: 2, tieChance: 0.13 });

    const { left, right } = place(
      cashHoard([bag], 'One money bag'),
      cashHoard(parts, 'Two piggy banks')
    );

    return buildCompareQuestion({
      modeId: 'wallets',
      skillKey: 'money_sum2',
      skillLabel: 'Adding 3-Digit Amounts',
      topicLabel: 'Wallet Showdown',
      prompt: pickPrompt(),
      dedupeKey: `wal2_${left.total}_${right.total}`,
      fluencySeconds: 28,
      left,
      right,
      helperText: 'Add the hundreds first, then the tens and ones — then compare place value, hundreds digit first.',
      explanationHTML: explainWallet(left, right)
    });
  }

  // 1B — one money bag versus three piggy banks ($612 vs $187 + $229 + $196)
  if (roll < 0.75) {
    const parts = threeAddends();
    const sum = parts.reduce((s, p) => s + p, 0);
    const bag = nearbyTotalDollars(sum, { fraction: 0.06, minGapDollars: 2, tieChance: 0.1 });

    const { left, right } = place(
      cashHoard([bag], 'One money bag'),
      cashHoard(parts, 'Three piggy banks')
    );

    return buildCompareQuestion({
      modeId: 'wallets',
      skillKey: 'money_sum3',
      skillLabel: 'Adding Three 3-Digit Amounts',
      topicLabel: 'Wallet Showdown',
      prompt: pickPrompt(),
      dedupeKey: `wal3_${left.total}_${right.total}`,
      fluencySeconds: 34,
      left,
      right,
      helperText: 'Add the two friendliest piggy banks first (look for tens that make 10), then add the third.',
      explanationHTML: explainWallet(left, right)
    });
  }

  // 1C — two money bags whose hundreds digits match (compare the tens next)
  const big = randInt(215, 940);
  const small = nearbyTotalDollars(big, { fraction: 0.045, minGapDollars: 1 });

  const { left, right } = place(
    cashHoard([big], 'One money bag'),
    cashHoard([small], 'One money bag')
  );

  return buildCompareQuestion({
    modeId: 'wallets',
    skillKey: 'money_twodigit',
    skillLabel: 'Comparing Close 3-Digit Amounts',
    topicLabel: 'Wallet Showdown',
    prompt: 'These two money bags are <strong>really close</strong>. Which one holds <strong>MORE</strong> money?',
    dedupeKey: `wal1_${Math.min(big, small)}_${Math.max(big, small)}`,
    fluencySeconds: 20,
    left,
    right,
    helperText: 'If the hundreds digits match, compare the TENS next — then the ones. Never guess by shape!',
    explanationHTML: explainWallet(left, right)
  });
}
