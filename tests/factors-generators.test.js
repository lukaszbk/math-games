import test from 'node:test';
import assert from 'node:assert/strict';
import { FACTORS_AND_MULTIPLES_GAME } from '../src/games/factors-and-multiples/index.js';
import {
  genLeftovers,
  genFactors,
  genMultiples,
  genPrimesSquares,
  genGcfLcm,
  genMystery,
  buildRoundQuestions
} from '../src/games/factors-and-multiples/generators/index.js';
import { isPrime } from '../src/shared/math.js';

function assertValidChoiceQuestion(q) {
  assert.ok(Array.isArray(q.choices) && q.choices.length >= 3);
  const ids = q.choices.map(c => c.id);
  const labels = q.choices.map(c => c.label);
  assert.equal(new Set(ids).size, ids.length, `Duplicate choice IDs in ${q.dedupeKey}`);
  assert.equal(new Set(labels).size, labels.length, `Duplicate choice labels in ${q.dedupeKey}`);
  assert.ok(ids.includes(q.answer), `Answer ${q.answer} missing from choices in ${q.dedupeKey}`);
}

function assertCommonQuestionShape(q) {
  assert.equal(typeof q.dedupeKey, 'string');
  assert.equal(typeof q.domainId, 'string');
  assert.equal(typeof q.skillKey, 'string');
  assert.ok(['numpad', 'quot_rem', 'choice', 'multiselect'].includes(q.inputType));
  assert.equal(typeof q.prompt, 'string');
  assert.equal(typeof q.explanationHTML, 'string');
  if (q.stageHTML) {
    assert.equal(/onclick=/i.test(q.stageHTML), false, `Found inline onclick in stageHTML of ${q.dedupeKey}`);
  }
}

test('Factors & Multiples dragon catalog has 43 entries with valid modes, profile assignment, and paths', () => {
  assert.equal(FACTORS_AND_MULTIPLES_GAME.id, 'factors-and-multiples');
  assert.equal(FACTORS_AND_MULTIPLES_GAME.title, 'Factors & Multiples');
  assert.equal(FACTORS_AND_MULTIPLES_GAME.assignedProfileId, 'grade3');

  const dragons = FACTORS_AND_MULTIPLES_GAME.companions;
  assert.equal(dragons.length, 43);
  assert.equal(new Set(dragons.map(d => d.id)).size, 43);
  dragons.forEach((d, idx) => {
    assert.equal(d.orderNum, idx + 1);
    assert.equal(d.image, `./assets/factors-and-multiples/dragons/${d.id}.jpg`);
    assert.ok(d.quotes.length >= 3);
  });
  const counts = {};
  dragons.forEach(d => { counts[d.modeId] = (counts[d.modeId] || 0) + 1; });
  assert.equal(counts.starter, 1);
  for (const m of FACTORS_AND_MULTIPLES_GAME.allModeIds) {
    assert.equal(counts[m], 6, `Expected 6 dragons for mode ${m}`);
  }
});

test('Fuzz-test all 6 Factors & Multiples generators (550 iterations each)', () => {
  const N = 550;

  for (let i = 0; i < N; i++) {
    const q = genLeftovers();
    assertCommonQuestionShape(q);
    assert.equal(q.domainId, 'leftovers');
    if (q.inputType === 'quot_rem') {
      assert.equal(typeof q.answer.q, 'number');
      assert.equal(typeof q.answer.r, 'number');
      assert.ok(q.answer.r >= 0);
      assert.ok(q.stageHTML.includes('data-action="focus-dual-slot"'));
    } else if (q.inputType === 'numpad') {
      assert.ok(Number.isInteger(q.answer) && q.answer >= 2 && q.answer <= 11);
    } else if (q.inputType === 'choice') {
      assertValidChoiceQuestion(q);
    }
  }

  for (let i = 0; i < N; i++) {
    const q = genFactors();
    assertCommonQuestionShape(q);
    assert.equal(q.domainId, 'factors');
    if (q.inputType === 'numpad') {
      assert.ok(Number.isInteger(q.answer) && q.answer >= 2 && q.answer <= 50);
    } else if (q.inputType === 'choice') {
      assertValidChoiceQuestion(q);
    } else if (q.inputType === 'multiselect') {
      assert.ok(Array.isArray(q.answer) && q.answer.length >= 2);
      assert.equal(q.choices.length, 8);
      q.answer.forEach(v => assert.ok(q.choices.includes(v)));
    }
  }

  for (let i = 0; i < N; i++) {
    const q = genMultiples();
    assertCommonQuestionShape(q);
    assert.equal(q.domainId, 'multiples');
    if (q.inputType === 'numpad') {
      assert.ok(Number.isInteger(q.answer) && q.answer >= 6 && q.answer <= 108);
    } else {
      assertValidChoiceQuestion(q);
    }
  }

  for (let i = 0; i < N; i++) {
    const q = genPrimesSquares();
    assertCommonQuestionShape(q);
    assert.equal(q.domainId, 'primes');
    if (q.skillKey === 'prime_tree') {
      assert.ok(isPrime(q.answer), `Expected prime_tree missing factor ${q.answer} to be prime`);
    } else if (q.inputType === 'numpad') {
      assert.ok(Number.isInteger(q.answer) && q.answer >= 4 && q.answer <= 100);
    } else {
      assertValidChoiceQuestion(q);
    }
  }

  for (let i = 0; i < N; i++) {
    const q = genGcfLcm();
    assertCommonQuestionShape(q);
    assert.equal(q.domainId, 'gcflcm');
    assert.ok(Number.isInteger(q.answer) && q.answer >= 1 && q.answer <= 100);
  }

  for (let i = 0; i < N; i++) {
    const q = genMystery();
    assertCommonQuestionShape(q);
    assert.equal(q.domainId, 'mystery');
    assert.equal(q.enableSieve, true);
    assert.ok(Number.isInteger(q.answer) && q.answer >= 1 && q.answer <= 100);
    const matches = [];
    for (let x = 1; x <= 100; x++) {
      if (q.predicates.every(fn => fn(x))) matches.push(x);
    }
    assert.deepEqual(matches, [q.answer], `Expected unique Mystery solution ${q.answer}, got ${matches}`);
  }
});

test('buildRoundQuestions produces 10 valid questions for every Factors & Multiples mode including mix', () => {
  for (const modeId of FACTORS_AND_MULTIPLES_GAME.allModeIds) {
    const round = buildRoundQuestions(modeId);
    assert.equal(round.length, 10);
    round.forEach(q => assertCommonQuestionShape(q));
    if (modeId === 'mix') {
      const domains = new Set(round.map(q => q.domainId));
      assert.equal(domains.size, 6, 'Mix round must cover all 6 domains');
    } else {
      assert.ok(round.every(q => q.domainId === modeId));
    }
  }
});
