import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { GAMES } from '../src/games/registry.js';
import { MONEY_MATCH_GAME } from '../src/games/money-match/index.js';
import { FACTORS_AND_MULTIPLES_GAME } from '../src/games/factors-and-multiples/index.js';
import {
  genWallets,
  genBills,
  genDebt,
  genPlusMinus,
  genFairDeals,
  genMarket,
  buildRoundQuestions
} from '../src/games/money-match/generators/index.js';
import {
  moneyLabel,
  signedExpression,
  cashHoard,
  debtHoard,
  splitDollars,
  buildCompareQuestion
} from '../src/games/money-match/money.js';
import { formatCorrectAnswer } from '../src/shared/round-engine.js';
import { applyRoundCompletion, calculateRoundStars } from '../src/shared/progression.js';
import { createDefaultGameSave } from '../src/shared/storage.js';

const MODE_IDS = ['wallets', 'bills', 'debt', 'plusminus', 'fairdeals', 'market'];
const GENERATORS = { wallets: genWallets, bills: genBills, debt: genDebt, plusminus: genPlusMinus, fairdeals: genFairDeals, market: genMarket };

function assertValidDuelQuestion(q, modeId) {
  assert.equal(typeof q.dedupeKey, 'string', 'dedupeKey must be a string');
  assert.equal(q.domainId, modeId, `domainId should be ${modeId}`);
  assert.equal(typeof q.skillKey, 'string');
  assert.equal(typeof q.skillLabel, 'string');
  assert.equal(typeof q.topicLabel, 'string');
  assert.equal(q.inputType, 'choice');
  assert.equal(typeof q.prompt, 'string');
  assert.ok(q.prompt.length > 10, `Prompt too short in ${q.dedupeKey}`);
  assert.equal(typeof q.explanationHTML, 'string');
  assert.ok(q.explanationHTML.length > 20, `Thin explanation in ${q.dedupeKey}`);
  assert.equal(typeof q.mistakeSummary, 'string');
  assert.equal(typeof q.helperText, 'string');
  assert.ok(typeof q.fluencySeconds === 'number' && q.fluencySeconds >= 18 && q.fluencySeconds <= 60,
    `Fluency window must match the harder numbers (${q.fluencySeconds} in ${q.dedupeKey})`);

  // Stage: two tappable treasure cards, no inline JS handlers.
  assert.equal(/onclick=/i.test(q.stageHTML), false, `Inline onclick in ${q.dedupeKey}`);
  assert.ok(q.stageHTML.includes('data-action="submit-choice"'), `Stage needs tappable hoards: ${q.dedupeKey}`);
  assert.ok(q.stageHTML.includes('data-index="0"') && q.stageHTML.includes('data-index="1"'));

  // Raw "<" would be parsed as a tag by the browser, so comparisons must be escaped.
  for (const field of ['prompt', 'stageHTML', 'explanationHTML']) {
    const offender = q[field].match(/.{0,30}<(?![a-zA-Z/!]).{0,30}/);
    assert.equal(offender, null, `Unescaped < in ${field} of ${q.dedupeKey}: ${offender && offender[0]}`);
  }
  if (q.comparison === '<') {
    assert.ok(q.explanationHTML.includes('&lt;'), `Missing escaped < in ${q.dedupeKey}`);
  }

  // The stated objective is always "get the most money".
  assert.match(q.prompt, /MOST|MORE/i, `Prompt must state the money goal: ${q.dedupeKey}`);
  assert.ok(q.stageHTML.includes('duel-goal'), `Missing goal banner in ${q.dedupeKey}`);
  assert.match(q.stageHTML, /MOST money/i, `Goal banner must mention the most money: ${q.dedupeKey}`);
  if (q.leftTotal < 0 && q.rightTotal < 0) {
    assert.ok(q.stageHTML.includes('owe the LEAST'), `Debt duel should restate the goal for debt: ${q.dedupeKey}`);
  }

  // Choices are well-formed and every answer id exists exactly once.
  const ids = q.choices.map(c => c.id);
  const labels = q.choices.map(c => c.label);
  assert.ok(ids.length >= 2 && ids.length <= 3, `Choices out of range in ${q.dedupeKey}`);
  assert.equal(new Set(ids).size, ids.length, `Duplicate choice ids in ${q.dedupeKey}`);
  assert.equal(new Set(labels).size, labels.length, `Duplicate choice labels in ${q.dedupeKey}`);
  assert.ok(ids.includes(q.answer), `Answer "${q.answer}" missing from choices in ${q.dedupeKey}`);
  q.choices.forEach(c => {
    assert.equal(typeof c.id, 'string');
    assert.equal(typeof c.label, 'string');
    assert.ok(c.label.length > 0);
  });

  // The heart of the game: the answer must be the mathematically better amount.
  assert.ok(Number.isInteger(q.leftTotal) && Number.isInteger(q.rightTotal), `Totals must be integer cents in ${q.dedupeKey}`);
  // Advanced grade-3 numbers: 3-digit money, but everything stays INSIDE $1,000.
  assert.ok(Math.abs(q.leftTotal) <= 100000 && Math.abs(q.rightTotal) <= 100000, `Amount out of range in ${q.dedupeKey}`);

  if (q.answer === 'equal') {
    assert.equal(q.leftTotal, q.rightTotal, `equal answer but ${q.leftTotal} != ${q.rightTotal} in ${q.dedupeKey}`);
  } else if (q.answer.startsWith('Left')) {
    assert.ok(q.leftTotal > q.rightTotal, `Left is not better (${q.leftTotal} vs ${q.rightTotal}) in ${q.dedupeKey}`);
  } else {
    assert.ok(q.rightTotal > q.leftTotal, `Right is not better (${q.leftTotal} vs ${q.rightTotal}) in ${q.dedupeKey}`);
  }

  // A two-option question must never be a tie, and only the equal quest
  // may offer the “They’re Equal!” button when the totals differ.
  const offersEqual = q.choices.some(c => c.id === 'equal');
  if (q.leftTotal === q.rightTotal) {
    assert.ok(offersEqual, `Tie without an equal option in ${q.dedupeKey}`);
    assert.equal(q.answer, 'equal');
  } else if (offersEqual) {
    assert.equal(modeId, 'fairdeals', `Unexpected equal option in ${modeId}: ${q.dedupeKey}`);
  }

  assert.equal(q.comparison, q.leftTotal === q.rightTotal ? '=' : (q.leftTotal > q.rightTotal ? '>' : '<'));
}

test('Money Match is registered as a 3rd-grade game with a 22-dragon hoard catalog', () => {
  assert.ok(GAMES.includes(MONEY_MATCH_GAME), 'Game must be in the registry');
  assert.equal(MONEY_MATCH_GAME.id, 'money-match');
  assert.equal(MONEY_MATCH_GAME.assignedProfileId, 'grade3');
  assert.equal(MONEY_MATCH_GAME.gradeId, 'grade3');
  assert.equal(MONEY_MATCH_GAME.gradeLabel, '3rd Grade');
  assert.equal(MONEY_MATCH_GAME.theme, 'hoard');

  const comps = MONEY_MATCH_GAME.companions;
  assert.equal(comps.length, 22);
  assert.equal(new Set(comps.map(c => c.id)).size, 22, 'Companion ids must be unique');

  const perMode = {};
  comps.forEach((c, idx) => {
    assert.equal(c.orderNum, idx + 1, `orderNum must run 1..22 (bad at ${c.id})`);
    assert.ok(c.quotes.length >= 3, `${c.id} needs at least 3 quotes`);
    assert.ok(c.bio.length > 40, `${c.id} needs a real bio`);
    assert.ok(c.image.startsWith('./assets/'), `${c.id} image path must be relative`);
    const imagePath = fileURLToPath(new URL(`../${c.image.slice(2)}`, import.meta.url));
    assert.ok(existsSync(imagePath), `Missing companion art: ${c.image}`);
    perMode[c.modeId] = (perMode[c.modeId] || 0) + 1;
  });

  assert.equal(perMode.starter, 1);
  assert.equal(MONEY_MATCH_GAME.starterId, comps.find(c => c.modeId === 'starter').id);
  MODE_IDS.concat(['mix']).forEach(m => {
    assert.equal(perMode[m], 3, `Expected 3 dragons for quest ${m}`);
  });

  // Sanctuary filters must cover every tribe present in the catalog.
  const tribes = new Set(comps.map(c => c.tribe));
  tribes.forEach(tribe => {
    const covered = MONEY_MATCH_GAME.sanctuaryFilters.some(f => tribe.includes(f) && f !== 'All' && f !== 'Unlocked');
    assert.ok(covered, `Tribe "${tribe}" has no sanctuary filter`);
  });
});

test('Fuzz-test all 6 Money Match generators (700 iterations each)', () => {
  const N = 700;
  const stats = {};

  for (const [modeId, gen] of Object.entries(GENERATORS)) {
    stats[modeId] = { left: 0, right: 0, equal: 0, choices: {} };
    for (let i = 0; i < N; i++) {
      const q = gen();
      assertValidDuelQuestion(q, modeId);
      if (q.answer === 'equal') stats[modeId].equal += 1;
      else if (q.answer.startsWith('Left')) stats[modeId].left += 1;
      else stats[modeId].right += 1;
      const key = String(q.choices.length);
      stats[modeId].choices[key] = (stats[modeId].choices[key] || 0) + 1;
    }
  }

  // Every quest should be reachable and roughly side-balanced over many draws.
  for (const modeId of MODE_IDS) {
    const s = stats[modeId];
    assert.ok(s.left > N * 0.2, `${modeId} almost never answers Left (${s.left})`);
    assert.ok(s.right > N * 0.2, `${modeId} almost never answers Right (${s.right})`);
  }

  // The Equal-or-Not quest must actually produce ties often.
  assert.ok(stats.fairdeals.equal > N * 0.3, `fairdeals produced too few ties (${stats.fairdeals.equal})`);
  assert.ok(stats.fairdeals.choices['3'] > 0, 'fairdeals should always offer 3 buttons');
  assert.equal(stats.bills.choices['3'], undefined, 'bills rounds should never hinge on a tie');
});

function percentile(sorted, p) {
  return sorted[Math.floor(p * (sorted.length - 1))];
}

/**
 * Challenge level: the numbers are supposed to be advanced-for-grade-3 — big
 * (3-digit) amounts whose totals sit CLOSE together, so a kid cannot win by
 * eyeballing "which pile looks longer". This test is the guard rail that keeps
 * the generators from sliding back to $20 vs $10 + $10 territory.
 */
test('Numbers are challenge-level: 3-digit money with close calls in every quest', () => {
  const N = 900;

  for (const [modeId, gen] of Object.entries(GENERATORS)) {
    const magnitudes = [];
    const gapFractions = [];
    let bigAmounts = 0;
    let oddCents = 0;

    for (let i = 0; i < N; i++) {
      const q = gen();
      const magnitude = Math.max(Math.abs(q.leftTotal), Math.abs(q.rightTotal));
      magnitudes.push(magnitude);
      if (magnitude >= 10000) bigAmounts += 1;
      if (q.leftTotal % 100 !== 0 || q.rightTotal % 100 !== 0) oddCents += 1;

      const gap = Math.abs(q.leftTotal - q.rightTotal);
      if (gap > 0) gapFractions.push(gap / magnitude);

      // Nothing on screen may leave grade-3 place value: every printed amount
      // (chip, hero, or story price) stays below $1,000.
      const shown = [...q.stageHTML.matchAll(/\$(\d{1,4})(?:\.\d{2})?/g)].map(m => Number(m[1]));
      assert.ok(shown.length > 0 && shown.every(v => v < 1000),
        `${modeId}: an amount of $${Math.max(...shown)} leaked past the $1,000 ceiling in ${q.dedupeKey}`);
    }

    magnitudes.sort((a, b) => a - b);

    assert.ok(percentile(magnitudes, 0.5) >= 10000,
      `${modeId}: half the puzzles should involve at least $100 (median is $${percentile(magnitudes, 0.5) / 100})`);
    assert.ok(bigAmounts / N >= 0.6,
      `${modeId}: only ${((bigAmounts / N) * 100).toFixed(0)}% of puzzles reach $100+`);

    // Close calls: most comparisons must be settled by calculating, not glancing.
    gapFractions.sort((a, b) => a - b);
    assert.ok(percentile(gapFractions, 0.75) <= 0.12,
      `${modeId}: too many gaps are wide enough to guess (p75 gap is ${(percentile(gapFractions, 0.75) * 100).toFixed(1)}%)`);
    assert.ok(percentile(gapFractions, 0.9) <= 0.2,
      `${modeId}: the easy tail got too easy (p90 gap is ${(percentile(gapFractions, 0.9) * 100).toFixed(1)}%)`);
  }

  // Bill piles must include awkward cents, and $100 bills, to stay tricky.
  let withCents = 0;
  let withHundreds = 0;
  const BILLS_N = 300;
  for (let i = 0; i < BILLS_N; i++) {
    const q = genBills();
    if (q.leftTotal % 100 !== 0 || q.rightTotal % 100 !== 0) withCents += 1;
    if (/\$100 bill/.test(q.stageHTML)) withHundreds += 1;
  }
  assert.ok(withCents / BILLS_N >= 0.5, `Bill piles lost their odd cents (${withCents}/${BILLS_N})`);
  assert.ok(withHundreds / BILLS_N >= 0.2, `Bill piles stopped using $100 bills (${withHundreds}/${BILLS_N})`);

  // Market stories are 2-digit × 1-digit (e.g. 7 × $34), not tiny tables.
  let twoDigitPrices = 0;
  const MARKET_N = 300;
  for (let i = 0; i < MARKET_N; i++) {
    const q = genMarket();
    if (/× \$\d{2}/.test(q.stageHTML)) twoDigitPrices += 1;
  }
  assert.ok(twoDigitPrices / MARKET_N >= 0.7,
    `Market stories should multiply by 2-digit prices (${twoDigitPrices}/${MARKET_N})`);
});

test('Debt quest really drills negative money (−$50 vs −$25 + −$27 style)', () => {
  const N = 400;
  let negativeBoth = 0;
  let bigDebt = 0;

  for (let i = 0; i < N; i++) {
    const q = genDebt();
    assert.ok(q.leftTotal < 0 && q.rightTotal < 0, `Debt hoards must be negative in ${q.dedupeKey}`);
    assert.ok(q.stageHTML.includes('chip-debt'), `Debt chips should render as IOUs in ${q.dedupeKey}`);
    assert.equal(/−\$/.test(q.stageHTML), true, `Stage should show minus signs in ${q.dedupeKey}`);
    if (q.leftTotal < 0 && q.rightTotal < 0) negativeBoth += 1;
    if (Math.abs(q.leftTotal) >= 20000 || Math.abs(q.rightTotal) >= 20000) bigDebt += 1;

    // The better debt is the one closer to zero.
    if (q.answer.startsWith('Left')) assert.ok(Math.abs(q.leftTotal) < Math.abs(q.rightTotal));
    else if (q.answer.startsWith('Right')) assert.ok(Math.abs(q.rightTotal) < Math.abs(q.leftTotal));
  }

  assert.equal(negativeBoth, N);
  assert.ok(bigDebt / N >= 0.6, `Debts should usually reach into the hundreds ($200+): ${bigDebt}/${N}`);

  // Hand-built check of the exact example from the request.
  const left = debtHoard([50]);
  const right = debtHoard([25, 27]);
  assert.equal(left.total, -5000);
  assert.equal(right.total, -5200);
  assert.equal(signedExpression(right.items), '−$25 + −$27');
  assert.ok(left.total > right.total, '−$50 must beat −$52');
});

test('Money labels, hoard builders, and 10-question rounds stay well-formed', () => {
  assert.equal(moneyLabel(5000), '$50');
  assert.equal(moneyLabel(-5200), '−$52');
  assert.equal(moneyLabel(745), '$7.45');
  assert.equal(moneyLabel(25), '25\u00A2');
  assert.equal(moneyLabel(-30000), '−$300');
  assert.equal(moneyLabel(0), '$0');

  const bag = cashHoard([50], 'One money bag');
  assert.equal(bag.total, 5000);
  assert.equal(bag.hero, '$50');
  assert.equal(cashHoard([29, 29]).hero, '$29 + $29');
  assert.equal(debtHoard([25, 27]).hero, '−$25 + −$27');

  for (const modeId of MODE_IDS.concat(['mix'])) {
    for (let round = 0; round < 12; round++) {
      const questions = buildRoundQuestions(modeId);
      assert.equal(questions.length, 10, `${modeId} rounds must hold 10 puzzles`);
      assert.equal(new Set(questions.map(q => q.dedupeKey)).size, 10, `Duplicate puzzles in ${modeId}`);
      questions.forEach(q => {
        assertValidDuelQuestion(q, modeId === 'mix' ? q.domainId : modeId);
        assert.ok(MODE_IDS.includes(q.domainId));
      });
    }
  }

  // Daily Mix should mix several skills, not repeat a single one.
  const mix = buildRoundQuestions('mix');
  assert.ok(new Set(mix.map(q => q.domainId)).size >= 4, 'Daily Mix feels too repetitive');
});

test('Ten first-try matches hatches exactly one dragon egg (Money Match star rule)', () => {
  const def = MONEY_MATCH_GAME;
  const save = createDefaultGameSave(def);
  assert.deepEqual(save.unlockedDragons, [def.starterId]);
  assert.equal(save.pace, 'brisk');

  // Standard games keep the classic award scheme.
  assert.equal(calculateRoundStars('factors', 10, 'x', FACTORS_AND_MULTIPLES_GAME).starsEarned, 5);
  assert.equal(calculateRoundStars('mix', 10, 'x', FACTORS_AND_MULTIPLES_GAME).starsEarned, 6);

  // Money Match: 1 ⭐ per first-try match.
  assert.equal(calculateRoundStars('wallets', 7, 'x', def).starsEarned, 7);
  assert.equal(calculateRoundStars('wallets', 10, 'x', def).starsEarned, 10);

  // 9/10 first try banks 9 ⭐ but hatches nothing.
  const nearMiss = applyRoundCompletion({ gameSave: save, gameDef: def, modeId: 'wallets', firstTryCount: 9 });
  assert.equal(nearMiss.starsEarned, 9);
  assert.equal(nearMiss.pendingUnlocks.length, 0);
  assert.equal(save.modeBank.wallets, 9);

  // 10/10 first try fills the egg bar and hatches one dragon.
  const flawless = applyRoundCompletion({ gameSave: save, gameDef: def, modeId: 'wallets', firstTryCount: 10 });
  assert.equal(flawless.starsEarned, 10);
  assert.equal(flawless.pendingUnlocks.length, 1);
  assert.equal(flawless.pendingUnlocks[0].modeId, 'wallets');
  // 9 banked ⭐ + 10 fresh ⭐ = 19 -> one egg hatches, 9 ⭐ carry over.
  assert.equal(save.modeBank.wallets, 9);
  assert.equal(save.stars, 19);
  assert.equal(save.unlockedDragons.length, 2);

  // A flawless Daily Mix hatches too (with its mix bonus banked).
  const mixRound = applyRoundCompletion({ gameSave: save, gameDef: def, modeId: 'mix', firstTryCount: 10 });
  assert.equal(mixRound.starsEarned, 11);
  assert.equal(mixRound.pendingUnlocks.length, 1);
  assert.equal(save.modeBank.mix, 1);

  // Every egg in the catalog is reachable through its own quest.
  const reachable = new Set(
    def.companions.map(c => (c.modeId === 'starter' ? 'starter' : c.modeId))
  );
  assert.equal(reachable.size, def.allModeIds.length + 1);
});

test('Regression invariants: splitDollars, fairdeals alignment, market no-ties/explanations, plusminus bounds, and tie formatting', () => {
  // 1. splitDollars exact-sum invariant even when total < minPart * count
  for (const [total, count, minPart] of [[36, 2, 40], [20, 2, 40], [75, 2, 40], [45, 3, 40], [240, 2, 70]]) {
    for (let i = 0; i < 40; i++) {
      const parts = splitDollars(total, count, minPart);
      assert.equal(parts.length, count);
      assert.equal(parts.reduce((s, p) => s + p, 0), total, `splitDollars(${total}, ${count}, ${minPart}) summed to ${parts}`);
      assert.ok(parts.every(p => Number.isInteger(p) && p >= 1));
    }
  }

  // 2. genFairDeals strict alignment between skillKey and equality across 500 draws
  for (let i = 0; i < 500; i++) {
    const q = genFairDeals();
    assertValidDuelQuestion(q, 'fairdeals');
    if (q.skillKey === 'money_equal_yes') {
      assert.equal(q.leftTotal, q.rightTotal, `money_equal_yes had unequal totals in ${q.dedupeKey}`);
      assert.equal(q.answer, 'equal');
    } else {
      assert.equal(q.skillKey, 'money_equal_no');
      assert.notEqual(q.leftTotal, q.rightTotal, `money_equal_no had equal totals in ${q.dedupeKey}`);
      assert.notEqual(q.answer, 'equal');
    }
  }

  // 3. genMarket never produces ties and never emits redundant $X = <strong>$X</strong> in explanationHTML
  for (let i = 0; i < 500; i++) {
    const q = genMarket();
    assertValidDuelQuestion(q, 'market');
    assert.notEqual(q.leftTotal, q.rightTotal, `genMarket produced tie in ${q.dedupeKey}`);
    assert.equal(q.choices.length, 2, `genMarket should have 2 choices in ${q.dedupeKey}`);
    assert.equal(/(?:^|[\s>])(\$\d+(?:\.\d{2})?) = <strong>\1<\/strong>/.test(q.explanationHTML), false,
      `Redundant flat equation in explanationHTML: ${q.explanationHTML}`);
  }

  // 4. genPlusMinus stays within ±88000 cents, uses "owe the LEAST" only when both < 0, and has >= 2 chips per side
  for (let i = 0; i < 500; i++) {
    const q = genPlusMinus();
    assertValidDuelQuestion(q, 'plusminus');
    assert.ok(Math.abs(q.leftTotal) <= 88000 && Math.abs(q.rightTotal) <= 88000,
      `genPlusMinus total exceeded ±88000 cents in ${q.dedupeKey}: ${q.leftTotal}, ${q.rightTotal}`);
    const bothNeg = q.leftTotal < 0 && q.rightTotal < 0;
    assert.equal(q.stageHTML.includes('owe the LEAST'), bothNeg,
      `"owe the LEAST" mismatch (bothNeg=${bothNeg}) in ${q.dedupeKey}`);
    const [leftStage, rightStage] = q.stageHTML.split('duel-vs');
    assert.ok((leftStage.match(/class="money-chip /g) || []).length >= 2, `Left side < 2 chips in ${q.dedupeKey}`);
    assert.ok((rightStage.match(/class="money-chip /g) || []).length >= 2, `Right side < 2 chips in ${q.dedupeKey}`);
  }

  // 5. formatCorrectAnswer returns friendly label for tie questions and keeps Left/Right prefixes otherwise
  const tieQ = buildCompareQuestion({
    modeId: 'fairdeals',
    skillKey: 'money_equal_yes',
    skillLabel: 'Proving Two Amounts Are Equal',
    topicLabel: 'Equal or Not?',
    prompt: 'Which gives MOST money?',
    dedupeKey: 'test_tie',
    left: cashHoard([100]),
    right: cashHoard([45, 55]),
    showEqualOption: true
  });
  assert.equal(tieQ.answer, 'equal');
  assert.equal(formatCorrectAnswer(tieQ), '🤝 They’re Equal!');

  const leftWinQ = buildCompareQuestion({
    modeId: 'wallets',
    skillKey: 'money_sum2',
    skillLabel: 'Adding 3-Digit Amounts',
    topicLabel: 'Wallet Showdown',
    prompt: 'Which gives MOST money?',
    dedupeKey: 'test_left',
    left: cashHoard([250]),
    right: cashHoard([110, 120])
  });
  assert.equal(formatCorrectAnswer(leftWinQ), 'Left $250');

  const rightWinQ = buildCompareQuestion({
    modeId: 'wallets',
    skillKey: 'money_sum2',
    skillLabel: 'Adding 3-Digit Amounts',
    topicLabel: 'Wallet Showdown',
    prompt: 'Which gives MOST money?',
    dedupeKey: 'test_right',
    left: cashHoard([200]),
    right: cashHoard([110, 120])
  });
  assert.equal(formatCorrectAnswer(rightWinQ), 'Right $110 + $120');
});
