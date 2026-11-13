import test from 'node:test';
import assert from 'node:assert/strict';
import { ADDITION_SUBTRACTION_GAME } from '../src/games/addition-subtraction/index.js';
import {
  genPartners10,
  genMake10Add,
  genMake10Sub,
  genDoubles20,
  genWithin10,
  genFactFamilies,
  buildRoundQuestions
} from '../src/games/addition-subtraction/generators/index.js';

function assertCommonAddSubShape(q, minAns = 0, maxAns = 20) {
  assert.equal(typeof q.dedupeKey, 'string');
  assert.equal(typeof q.domainId, 'string');
  assert.equal(typeof q.skillKey, 'string');
  assert.ok(['numpad', 'choice', 'step_pair'].includes(q.inputType));
  assert.equal(typeof q.prompt, 'string');
  assert.equal(typeof q.explanationHTML, 'string');
  if (q.stageHTML) {
    assert.equal(/onclick=/i.test(q.stageHTML), false);
  }
  if (q.inputType === 'numpad') {
    assert.ok(Number.isInteger(q.answer), `Expected integer answer, got ${q.answer}`);
    assert.ok(q.answer >= minAns && q.answer <= maxAns, `Answer ${q.answer} out of [${minAns}..${maxAns}] in ${q.dedupeKey}`);
  } else if (q.inputType === 'step_pair') {
    assert.equal(typeof q.answer, 'object');
    assert.ok(Number.isInteger(q.answer.a) && q.answer.a >= 1 && q.answer.a <= 9);
    assert.ok(Number.isInteger(q.answer.b) && q.answer.b >= minAns && q.answer.b <= maxAns);
    assert.ok(q.stageHTML.includes('id="slot-a"') && q.stageHTML.includes('id="slot-b"'));
    assert.ok(q.stageHTML.includes('data-action="focus-dual-slot"'));
  } else {
    assert.ok(Array.isArray(q.choices) && q.choices.length === 4);
    const ids = q.choices.map(c => c.id);
    const labels = q.choices.map(c => c.label);
    assert.equal(new Set(ids).size, 4);
    assert.equal(new Set(labels).size, 4);
    assert.ok(ids.includes(q.answer));
  }
}

test('Addition & Subtraction catalog has 29 Dog Man characters with balanced mode distribution and profile assignment', () => {
  assert.equal(ADDITION_SUBTRACTION_GAME.id, 'addition-subtraction');
  assert.equal(ADDITION_SUBTRACTION_GAME.assignedProfileId, 'grade1');
  assert.equal(ADDITION_SUBTRACTION_GAME.defaultPace, 'relaxed');
  assert.equal(ADDITION_SUBTRACTION_GAME.theme, 'meadow');
  assert.equal(ADDITION_SUBTRACTION_GAME.enableReadAloud, true);

  const comps = ADDITION_SUBTRACTION_GAME.companions;
  assert.equal(comps.length, 29);
  assert.equal(new Set(comps.map(c => c.id)).size, 29);
  assert.equal(comps[0].id, '01_dog_man');
  assert.equal(comps[comps.length - 1].id, '29_mayor');

  const validTribes = new Set(ADDITION_SUBTRACTION_GAME.sanctuaryFilters);
  comps.forEach((c, idx) => {
    assert.equal(c.orderNum, idx + 1);
    assert.equal(c.image, `./assets/addition-subtraction/companions/${c.id}.jpg`);
    assert.ok(validTribes.has(c.tribe), `Invalid tribe ${c.tribe} on ${c.id}`);
    assert.ok(typeof c.bio === 'string' && c.bio.length > 20);
    assert.ok(Array.isArray(c.quotes) && c.quotes.length >= 3);
  });

  const counts = {};
  comps.forEach(c => { counts[c.modeId] = (counts[c.modeId] || 0) + 1; });
  assert.equal(counts.starter, 1);
  for (const m of ADDITION_SUBTRACTION_GAME.allModeIds) {
    assert.equal(counts[m], 4, `Expected 4 Dog Man companions for mode ${m}`);
  }
});

test('Fuzz-test all 6 i-Ready Addition & Subtraction generators (550 iterations each)', () => {
  const N = 550;

  for (let i = 0; i < N; i++) {
    const q = genPartners10();
    assertCommonAddSubShape(q, 1, 19);
    assert.equal(q.domainId, 'partners10');
  }

  for (let i = 0; i < N; i++) {
    const q = genMake10Add();
    assertCommonAddSubShape(q, 1, 18);
    assert.equal(q.domainId, 'make10add');
    if (q.skillKey === 'make10_add_steps') {
      assert.equal(q.inputType, 'step_pair');
      assert.equal(10 + q.answer.a, q.answer.b);
    }
  }

  for (let i = 0; i < N; i++) {
    const q = genMake10Sub();
    assertCommonAddSubShape(q, 1, 9);
    assert.equal(q.domainId, 'make10sub');
    if (q.skillKey === 'use10_sub_steps') {
      assert.equal(q.inputType, 'step_pair');
      assert.ok(q.answer.a >= 1 && q.answer.a <= 7);
      assert.ok(q.answer.b >= 2 && q.answer.b <= 9);
    }
  }

  for (let i = 0; i < N; i++) {
    const q = genDoubles20();
    assertCommonAddSubShape(q, 4, 20);
    assert.equal(q.domainId, 'doubles20');
  }

  for (let i = 0; i < N; i++) {
    const q = genWithin10();
    assertCommonAddSubShape(q, 1, 10);
    assert.equal(q.domainId, 'within10');
  }

  for (let i = 0; i < N; i++) {
    const q = genFactFamilies();
    assertCommonAddSubShape(q, 1, 20);
    assert.equal(q.domainId, 'factfamilies');
  }
});

test('buildRoundQuestions builds 10 valid puzzles for every Addition & Subtraction mode', () => {
  for (const modeId of ADDITION_SUBTRACTION_GAME.allModeIds) {
    const round = buildRoundQuestions(modeId);
    assert.equal(round.length, 10);
    round.forEach(q => assertCommonAddSubShape(q, 0, 20));
    if (modeId === 'mix') {
      const domains = new Set(round.map(q => q.domainId));
      assert.equal(domains.size, 6);
    } else {
      assert.ok(round.every(q => q.domainId === modeId));
    }
  }
});
