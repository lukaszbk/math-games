import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { GAMES, getGameById } from '../src/games/registry.js';
import { MEOW_TRAINING_GAME } from '../src/games/meow-training/index.js';
import {
  genCubeStacks,
  genLayerSlices,
  genBoxBuilder,
  genTwinTowers,
  genTankRivals,
  genPotionBeakers,
  buildRoundQuestions
} from '../src/games/meow-training/generators/index.js';
import {
  applyRoundCompletion,
  calculateRoundStars,
  getActiveBuddy,
  getNextCompanionSpotlight,
  getNextSequentialPrize,
  isCompanionUnlocked,
  resolveStudyBuddyId
} from '../src/shared/progression.js';
import {
  PARENT_PIN,
  createDefaultFamilyState,
  createDefaultGameSave,
  getGameSave,
  normalizeAndMigrateGameSave
} from '../src/shared/storage.js';
import { renderArcadeView } from '../src/shared/views/arcade-view.js';
import { renderGameHubShell } from '../src/shared/views/game-hub-view.js';
import { createArenaController } from '../src/shared/views/arena-view.js';
import { createParentsController } from '../src/shared/views/parents-view.js';

const MODE_IDS = [
  'cube-stacks',
  'layer-slices',
  'box-builder',
  'twin-towers',
  'tank-rivals',
  'potion-beakers'
];

const GENERATORS = {
  'cube-stacks': genCubeStacks,
  'layer-slices': genLayerSlices,
  'box-builder': genBoxBuilder,
  'twin-towers': genTwinTowers,
  'tank-rivals': genTankRivals,
  'potion-beakers': genPotionBeakers
};

const EXPECTED_PRIZES = [
  { id: '01_misty', name: 'Misty', kind: 'Cat', isCat: true },
  { id: '02_misty_transforming', name: 'Transforming', kind: 'Power', isCat: false },
  { id: '03_misty_funniness', name: 'Funniness', kind: 'Skill', isCat: false },
  { id: '04_misty_flexibility', name: 'Flexibility', kind: 'Skill', isCat: false },
  { id: '05_misty_sabretooth', name: 'Sabretooth Cat Tooth (Not That Pointy)', kind: 'Object', isCat: false },
  { id: '06_misty_clown_friend', name: 'Clown Friend', kind: 'Object / Person', isCat: false },
  { id: '07_fang', name: 'Fang', kind: 'Cat', isCat: true },
  { id: '08_fang_telekinesis', name: 'Making Things Float with Her Mind', kind: 'Power', isCat: false },
  { id: '09_fang_pointy_tooth', name: 'Sabretooth Cat Tooth (Pointy)', kind: 'Object', isCat: false },
  { id: '10_fang_shard', name: 'Glowing Shard', kind: 'Object', isCat: false },
  { id: '11_fang_flerie_rush', name: 'Flerie-Rush', kind: 'Skill', isCat: false },
  { id: '12_fang_parry', name: 'Parry', kind: 'Skill', isCat: false },
  { id: '13_fang_mind_shield', name: 'Monster Mind-Shield', kind: 'Power', isCat: false },
  { id: '14_aria', name: 'Aria', kind: 'Cat', isCat: true },
  { id: '15_aria_sea_force_leader', name: 'Leader of the Sea Force', kind: 'Skill', isCat: false },
  { id: '16_aria_pearl_bracelet', name: 'Blue Pearl Bracelet', kind: 'Object', isCat: false },
  { id: '17_aria_revive_cats', name: 'Bring Cats from the Dead', kind: 'Power', isCat: false },
  { id: '18_aria_breathe_underwater', name: 'Breathe Underwater', kind: 'Power', isCat: false },
  { id: '19_aria_all_good_powers', name: 'All the Powers! (Not the Super Evil Ones)', kind: 'Power', isCat: false }
];

function assertValidVolumeQuestion(q, modeId) {
  assert.equal(typeof q.dedupeKey, 'string');
  assert.ok(q.dedupeKey.length > 0);
  assert.equal(q.domainId, modeId, `Expected domainId=${modeId}, got ${q.domainId}`);
  assert.equal(typeof q.skillKey, 'string');
  assert.equal(typeof q.skillLabel, 'string');
  assert.equal(typeof q.topicLabel, 'string');
  assert.ok(['numpad', 'step_pair', 'choice'].includes(q.inputType), `Unexpected inputType ${q.inputType}`);
  assert.equal(typeof q.prompt, 'string');
  assert.ok(q.prompt.length > 10);
  assert.equal(typeof q.promptText, 'string');
  assert.ok(q.promptText.length > 10);
  assert.equal(typeof q.helperText, 'string');
  assert.ok(q.helperText.length > 10);
  assert.equal(typeof q.explanationHTML, 'string');
  assert.ok(q.explanationHTML.length > 15);
  assert.equal(typeof q.stageHTML, 'string');
  assert.ok(q.stageHTML.includes('<svg'), `Expected inline SVG diagram in ${q.dedupeKey}`);
  assert.equal(/onclick=/i.test(q.stageHTML), false, `Inline onclick forbidden in ${q.dedupeKey}`);

  // No unescaped raw '<' outside HTML tags
  for (const field of ['prompt', 'stageHTML', 'explanationHTML']) {
    const offender = q[field].match(/.{0,25}<(?![a-zA-Z/!]).{0,25}/);
    assert.equal(offender, null, `Unescaped < in ${field} of ${q.dedupeKey}: ${offender && offender[0]}`);
  }

  if (q.inputType === 'numpad') {
    assert.ok(Number.isInteger(q.answer) && q.answer >= 1 && q.answer <= 999,
      `Numpad answer ${q.answer} out of [1..999] in ${q.dedupeKey}`);
    assert.ok(q.stageHTML.includes('id="slot-main"'));
  } else if (q.inputType === 'step_pair') {
    assert.equal(typeof q.answer, 'object');
    assert.ok(Number.isInteger(q.answer.a) && q.answer.a >= 1 && q.answer.a <= 99,
      `step_pair answer.a=${q.answer.a} exceeds 2-digit arena limit in ${q.dedupeKey}`);
    assert.ok(Number.isInteger(q.answer.b) && q.answer.b >= 1 && q.answer.b <= 99,
      `step_pair answer.b=${q.answer.b} exceeds 2-digit arena limit in ${q.dedupeKey}`);
    assert.ok(q.stageHTML.includes('id="slot-a"') && q.stageHTML.includes('id="slot-b"'));
    assert.ok(q.stageHTML.includes('data-action="focus-dual-slot"'));
  } else {
    assert.ok(Array.isArray(q.choices) && q.choices.length >= 2);
    const ids = q.choices.map(c => c.id);
    const labels = q.choices.map(c => c.label);
    assert.equal(new Set(ids).size, ids.length, `Duplicate choice IDs in ${q.dedupeKey}`);
    assert.equal(new Set(labels).size, labels.length, `Duplicate choice labels in ${q.dedupeKey}`);
    assert.ok(ids.includes(q.answer), `Answer ${q.answer} missing from choices in ${q.dedupeKey}`);
    if (modeId === 'tank-rivals') {
      assert.equal(q.choices.length, 2);
      assert.ok(q.stageHTML.includes('data-action="submit-choice" data-index="0"'));
      assert.ok(q.stageHTML.includes('data-action="submit-choice" data-index="1"'));
    }
  }
}

test('Meow Training metadata and 19-prize catalog match Hanna BK specification exactly', () => {
  assert.ok(GAMES.includes(MEOW_TRAINING_GAME));
  assert.equal(getGameById('meow-training'), MEOW_TRAINING_GAME);
  assert.equal(MEOW_TRAINING_GAME.id, 'meow-training');
  assert.equal(MEOW_TRAINING_GAME.title, 'Meow Training');
  assert.equal(MEOW_TRAINING_GAME.authorCredit, 'By Hanna BK');
  assert.equal(MEOW_TRAINING_GAME.assignedProfileId, 'grade3');
  assert.equal(MEOW_TRAINING_GAME.gradeLabel, '3rd Grade');
  assert.equal(MEOW_TRAINING_GAME.theme, 'wand');
  assert.equal(MEOW_TRAINING_GAME.defaultPace, 'relaxed');
  assert.equal(MEOW_TRAINING_GAME.enableReadAloud, true);
  assert.equal(MEOW_TRAINING_GAME.progressionType, 'sequential');
  assert.equal(MEOW_TRAINING_GAME.onlyCatsAsBuddy, true);
  assert.equal(MEOW_TRAINING_GAME.unlockPodType, 'wand');
  assert.equal(MEOW_TRAINING_GAME.victoryBannerText, 'queen monster defeated!!!');
  assert.deepEqual(MEOW_TRAINING_GAME.starterUnlockedIds, ['01_misty', '02_misty_transforming']);

  const prizes = MEOW_TRAINING_GAME.companions;
  assert.equal(prizes.length, 19);
  prizes.forEach((p, idx) => {
    const exp = EXPECTED_PRIZES[idx];
    assert.equal(p.orderNum, idx + 1);
    assert.equal(p.id, exp.id);
    assert.equal(p.name, exp.name);
    assert.equal(p.kind, exp.kind);
    assert.equal(Boolean(p.isCat), exp.isCat);
    assert.equal(p.image, `./assets/meow-training/prizes/${exp.id}.jpg`);
    const imagePath = fileURLToPath(new URL(`../${p.image.slice(2)}`, import.meta.url));
    assert.ok(existsSync(imagePath), `Missing Meow Training asset: ${p.image}`);
    const bytes = readFileSync(imagePath);
    assert.ok(bytes.length > 1000, `Empty asset: ${p.image}`);
    assert.equal(bytes[0], 0xff, `Invalid JPEG byte 0 in ${p.image}`);
    assert.equal(bytes[1], 0xd8, `Invalid JPEG byte 1 in ${p.image}`);
    assert.equal(bytes[2], 0xff, `Invalid JPEG byte 2 in ${p.image}`);
    assert.ok(typeof p.bio === 'string' && p.bio.length > 20);
    assert.ok(Array.isArray(p.quotes) && p.quotes.length >= 1);
  });

  const flerie = prizes.find(p => p.id === '11_fang_flerie_rush');
  assert.ok(flerie.bio.includes('Hanna and Ada'));
  assert.ok(flerie.bio.includes('jump sideways and punch at the exact same time'));

  const parry = prizes.find(p => p.id === '12_fang_parry');
  assert.ok(parry.bio.includes('bounced right back'));

  const mindShield = prizes.find(p => p.id === '13_fang_mind_shield');
  assert.ok(mindShield.bio.includes('read or control your mind'));
});

test('Default save starts with Misty + Transforming and enforces cats-only Study Buddy', () => {
  const save = createDefaultGameSave(MEOW_TRAINING_GAME);
  assert.equal(save.activeBuddyId, '01_misty');
  assert.equal(save.pace, 'relaxed');
  assert.equal(save.trainingBank, 0);
  assert.deepEqual(save.unlockedDragons, ['01_misty', '02_misty_transforming']);
  assert.equal(getActiveBuddy(save, MEOW_TRAINING_GAME).id, '01_misty');

  // Cannot assign a non-cat skill/power as activeBuddyId; resolves to owner cat
  assert.equal(resolveStudyBuddyId(save, MEOW_TRAINING_GAME, '02_misty_transforming'), '01_misty');
  const corrupted = normalizeAndMigrateGameSave({
    stars: 10,
    activeBuddyId: '02_misty_transforming',
    unlockedDragons: ['01_misty', '02_misty_transforming'],
    trainingBank: 4
  }, MEOW_TRAINING_GAME);
  assert.equal(corrupted.activeBuddyId, '01_misty');
  assert.equal(corrupted.trainingBank, 4);
  assert.equal(getActiveBuddy(corrupted, MEOW_TRAINING_GAME).id, '01_misty');
});

test('Sequential Magic Wand progression unlocks all 19 prizes and auto-awakens Fang and Aria', () => {
  const stars10 = calculateRoundStars('box-builder', 10, undefined, MEOW_TRAINING_GAME);
  assert.equal(stars10.starsEarned, 10);
  const starsMix = calculateRoundStars('mix', 8, undefined, MEOW_TRAINING_GAME);
  assert.equal(starsMix.starsEarned, 9);

  const family = createDefaultFamilyState(GAMES);
  const save = getGameSave(family, 'grade3', MEOW_TRAINING_GAME);
  const roundModes = ['cube-stacks', 'layer-slices', 'box-builder', 'twin-towers', 'tank-rivals', 'potion-beakers'];

  // Rounds 1..3: unlock Misty's skills & sabretooth
  const r1 = applyRoundCompletion({ gameSave: save, gameDef: MEOW_TRAINING_GAME, modeId: roundModes[0], firstTryCount: 10 });
  assert.deepEqual(r1.pendingUnlocks.map(p => p.id), ['03_misty_funniness']);

  const r2 = applyRoundCompletion({ gameSave: save, gameDef: MEOW_TRAINING_GAME, modeId: roundModes[1], firstTryCount: 10 });
  assert.deepEqual(r2.pendingUnlocks.map(p => p.id), ['04_misty_flexibility']);

  const r3 = applyRoundCompletion({ gameSave: save, gameDef: MEOW_TRAINING_GAME, modeId: roundModes[2], firstTryCount: 10 });
  assert.deepEqual(r3.pendingUnlocks.map(p => p.id), ['05_misty_sabretooth']);

  // Round 4: unlock Clown Friend -> AUTO-UNLOCKS Fang + Making Things Float with Her Mind!
  const r4 = applyRoundCompletion({ gameSave: save, gameDef: MEOW_TRAINING_GAME, modeId: roundModes[3], firstTryCount: 10 });
  assert.deepEqual(r4.pendingUnlocks.map(p => p.id), ['06_misty_clown_friend', '07_fang']);
  assert.ok(isCompanionUnlocked(save, '07_fang'));
  assert.ok(isCompanionUnlocked(save, '08_fang_telekinesis'));
  assert.equal(resolveStudyBuddyId(save, MEOW_TRAINING_GAME, '08_fang_telekinesis'), '07_fang');

  // Rounds 5..8: unlock Fang's objects & skills
  const r5 = applyRoundCompletion({ gameSave: save, gameDef: MEOW_TRAINING_GAME, modeId: roundModes[4], firstTryCount: 10 });
  const r6 = applyRoundCompletion({ gameSave: save, gameDef: MEOW_TRAINING_GAME, modeId: roundModes[5], firstTryCount: 10 });
  const r7 = applyRoundCompletion({ gameSave: save, gameDef: MEOW_TRAINING_GAME, modeId: roundModes[0], firstTryCount: 10 });
  const r8 = applyRoundCompletion({ gameSave: save, gameDef: MEOW_TRAINING_GAME, modeId: roundModes[1], firstTryCount: 10 });
  assert.deepEqual(r5.pendingUnlocks.map(p => p.id), ['09_fang_pointy_tooth']);
  assert.deepEqual(r6.pendingUnlocks.map(p => p.id), ['10_fang_shard']);
  assert.deepEqual(r7.pendingUnlocks.map(p => p.id), ['11_fang_flerie_rush']);
  assert.deepEqual(r8.pendingUnlocks.map(p => p.id), ['12_fang_parry']);

  // Round 9: unlock Monster Mind-Shield -> AUTO-UNLOCKS Aria + Leader of the Sea Force!
  const r9 = applyRoundCompletion({ gameSave: save, gameDef: MEOW_TRAINING_GAME, modeId: roundModes[2], firstTryCount: 10 });
  assert.deepEqual(r9.pendingUnlocks.map(p => p.id), ['13_fang_mind_shield', '14_aria']);
  assert.ok(isCompanionUnlocked(save, '14_aria'));
  assert.ok(isCompanionUnlocked(save, '15_aria_sea_force_leader'));

  // Rounds 10..12: unlock Aria's bracelet, revive, breathe underwater
  const r10 = applyRoundCompletion({ gameSave: save, gameDef: MEOW_TRAINING_GAME, modeId: roundModes[3], firstTryCount: 10 });
  const r11 = applyRoundCompletion({ gameSave: save, gameDef: MEOW_TRAINING_GAME, modeId: roundModes[4], firstTryCount: 10 });
  const r12 = applyRoundCompletion({ gameSave: save, gameDef: MEOW_TRAINING_GAME, modeId: roundModes[5], firstTryCount: 10 });
  assert.deepEqual(r10.pendingUnlocks.map(p => p.id), ['16_aria_pearl_bracelet']);
  assert.deepEqual(r11.pendingUnlocks.map(p => p.id), ['17_aria_revive_cats']);
  assert.deepEqual(r12.pendingUnlocks.map(p => p.id), ['18_aria_breathe_underwater']);

  // Round 13: unlock final power -> all 19 unlocked!
  const r13 = applyRoundCompletion({ gameSave: save, gameDef: MEOW_TRAINING_GAME, modeId: roundModes[0], firstTryCount: 10 });
  assert.deepEqual(r13.pendingUnlocks.map(p => p.id), ['19_aria_all_good_powers']);
  assert.equal(save.unlockedDragons.length, 19);
  assert.equal(save.trainingBank, 0);
  assert.equal(getNextSequentialPrize(save, MEOW_TRAINING_GAME), null);
  assert.equal(getNextCompanionSpotlight(save, MEOW_TRAINING_GAME, 'mix'), null);
});

test('Wand pod, Cat Shadow SVGs, Dojo victory text, and zero egg/hatch strings in Meow Training views', () => {
  const family = createDefaultFamilyState(GAMES);
  const arcadeContainer = { innerHTML: '' };
  renderArcadeView({ container: arcadeContainer, familyState: family, games: GAMES });
  assert.ok(arcadeContainer.innerHTML.includes('data-game-id="meow-training"'));
  assert.ok(arcadeContainer.innerHTML.includes('data-card-theme="wand"'));
  assert.ok(arcadeContainer.innerHTML.includes('By Hanna BK'));

  const save = getGameSave(family, 'grade3', MEOW_TRAINING_GAME);
  const hubContainer = { innerHTML: '' };
  for (const tab of ['play', 'sanctuary', 'guide']) {
    renderGameHubShell({
      container: hubContainer,
      gameDef: MEOW_TRAINING_GAME,
      gameSave: save,
      profile: family.profiles[0],
      soundOn: true,
      currentTab: tab,
      activeFilter: 'All'
    });
    assert.equal(/\beggs?\b|\bhatch(ing|ed)?\b/i.test(hubContainer.innerHTML), false,
      `Found egg/hatch wording in ${tab} tab of Meow Training`);
  }

  // Sanctuary renders Cat Shadow SVGs for locked cats and Magic Wand pod renders wand + shadow for cats
  assert.ok(hubContainer.innerHTML.includes('cat-shadow-svg'));
  assert.ok(hubContainer.innerHTML.includes('Cat Shadow'));
  assert.ok(hubContainer.innerHTML.includes('has-shadow-svg'));

  const fangPod = MEOW_TRAINING_GAME.renderUnlockPodHTML(MEOW_TRAINING_GAME.companions[6]);
  assert.ok(fangPod.includes('Glowing Magic Wand'));
  assert.ok(fangPod.includes('#050F16')); // cat shadow silhouette inside wand pod

  const skillPod = MEOW_TRAINING_GAME.renderUnlockPodHTML(MEOW_TRAINING_GAME.companions[2]);
  assert.ok(skillPod.includes('Glowing Magic Wand'));

  // Unlock all 19 and verify Grand Victory proclamation
  save.unlockedDragons = MEOW_TRAINING_GAME.companions.map(c => c.id);
  save.trainingBank = 0;
  renderGameHubShell({
    container: hubContainer,
    gameDef: MEOW_TRAINING_GAME,
    gameSave: save,
    profile: family.profiles[0],
    soundOn: true,
    currentTab: 'sanctuary',
    activeFilter: 'All'
  });
  assert.ok(hubContainer.innerHTML.includes('queen monster defeated!!!'));
  assert.ok(hubContainer.innerHTML.includes('meow-victory-banner'));
});

test('Parent controller protects both Misty and Transforming starters on Meow Training', () => {
  const family = createDefaultFamilyState(GAMES);
  const container = { innerHTML: '' };
  const controller = createParentsController({
    games: GAMES,
    getFamilyState: () => family,
    setFamilyState: () => {},
    onSave: () => {},
    onStartModeForProfile: () => {},
    onBackToGameOrArcade: () => {}
  });
  const rerender = () => controller.render(container, { showContextHeader: false });

  const prevDocument = globalThis.document;
  globalThis.document = {
    getElementById(id) {
      if (id === 'parent-pin-input') return { value: PARENT_PIN, focus() {} };
      if (id === 'parent-pin-error') return { textContent: '', classList: { add() {}, remove() {} } };
      return null;
    }
  };
  try {
    controller.setContext('grade3', 'meow-training');
    controller.render(container, { showContextHeader: false });
    controller.handleAction({ dataset: { action: 'parent-pin-submit' } }, rerender);
  } finally {
    if (prevDocument === undefined) delete globalThis.document;
    else globalThis.document = prevDocument;
  }

  assert.ok(container.innerHTML.includes('btn-parent-dragon-01_misty" class="parent-toggle-btn is-unlocked" disabled'));
  assert.ok(container.innerHTML.includes('btn-parent-dragon-02_misty_transforming" class="parent-toggle-btn is-unlocked" disabled'));

  controller.handleAction({ dataset: { action: 'parent-unlock-all' } }, rerender);
  assert.equal(family.saves.grade3['meow-training'].unlockedDragons.length, 19);

  controller.handleAction({ dataset: { action: 'parent-lock-all' } }, rerender);
  assert.deepEqual(
    family.saves.grade3['meow-training'].unlockedDragons,
    ['01_misty', '02_misty_transforming']
  );
});

test('Fuzz-test all 6 Meow Training Volume generators (350 iterations each) and buildRoundQuestions', () => {
  const N = 350;
  for (const modeId of MODE_IDS) {
    const gen = GENERATORS[modeId];
    for (let i = 0; i < N; i++) {
      const q = gen();
      assertValidVolumeQuestion(q, modeId);
    }
  }

  for (const modeId of MEOW_TRAINING_GAME.allModeIds) {
    const round = buildRoundQuestions(modeId);
    assert.equal(round.length, 10);
    round.forEach(q => {
      assertValidVolumeQuestion(q, q.domainId);
    });
    if (modeId === 'mix') {
      const domains = new Set(round.map(q => q.domainId));
      assert.equal(domains.size, 6, 'Mix round must include all 6 Volume domains');
    } else {
      assert.ok(round.every(q => q.domainId === modeId));
    }
  }
});

function makeMockEl(id = '') {
  const classes = new Set();
  return {
    id,
    innerHTML: '',
    textContent: '',
    src: '',
    style: {},
    className: '',
    children: [],
    classList: {
      add(...xs) { xs.forEach(x => classes.add(x)); },
      remove(...xs) { xs.forEach(x => classes.delete(x)); },
      toggle(x, force) {
        if (force === undefined) {
          if (classes.has(x)) classes.delete(x);
          else classes.add(x);
        } else if (force) classes.add(x);
        else classes.delete(x);
      },
      contains(x) { return classes.has(x); }
    },
    querySelector() { return makeMockEl('query'); },
    appendChild(child) { this.children.push(child); },
    removeChild() {}
  };
}

test('Arena controller renders Magic Wand pod, Cat Shadow for Fang, and queen monster defeated!!! on final unlock', () => {
  const prevDocument = globalThis.document;
  const prevSetTimeout = globalThis.setTimeout;
  const elements = new Map();
  const getEl = (id) => {
    if (!elements.has(id)) elements.set(id, makeMockEl(id));
    return elements.get(id);
  };

  globalThis.document = {
    getElementById: getEl,
    querySelectorAll: () => [],
    createElement: (tag) => makeMockEl(tag)
  };
  globalThis.setTimeout = (fn) => {
    fn();
    return 1;
  };

  try {
    const family = createDefaultFamilyState(GAMES);
    const save = getGameSave(family, 'grade3', MEOW_TRAINING_GAME);
    // Position right before unlocking 06_misty_clown_friend -> triggers auto-unlock of 07_fang + 08_fang_telekinesis
    save.unlockedDragons = [
      '01_misty',
      '02_misty_transforming',
      '03_misty_funniness',
      '04_misty_flexibility',
      '05_misty_sabretooth'
    ];
    save.trainingBank = 0;

    const arenaEl = getEl('arena-screen');
    const shellEl = getEl('shell-main');
    const confettiLayerEl = getEl('confetti-layer');
    const modalResultsEl = getEl('modal-results');
    const modalUnlockEl = getEl('modal-unlock');
    modalUnlockEl.querySelector = () => getEl('unlock-modal-card');
    const modalDetailEl = getEl('modal-dragon-detail');
    modalDetailEl.querySelector = () => getEl('detail-modal-card');

    const ctrl = createArenaController({
      arenaEl,
      shellEl,
      confettiLayerEl,
      modalResultsEl,
      modalUnlockEl,
      modalDetailEl,
      getContext: () => ({
        familyState: family,
        profile: family.profiles[0],
        gameDef: MEOW_TRAINING_GAME,
        gameSave: save
      }),
      onSave: () => {},
      onRenderHub: () => {}
    });

    ctrl.startRound('box-builder');
    assert.equal(ctrl.isActive(), true);

    // Solve all 10 numpad puzzles cleanly on first try
    for (let i = 0; i < 10; i++) {
      const promptHtml = getEl('question-stage').innerHTML;
      assert.ok(promptHtml.includes('<svg'));
      // Compute box dimensions from buildPrismBoxSVG / story / cube crate via generator replay:
      // Instead, inspect slot-main / stage or submit digits by matching prompt numbers? Even simpler:
      // test solving via box-builder answer extraction from mistakeSummary/explanation? No, read from prompt/stage:
      // Wait: box-builder always renders 3 dimensions or cube edge in promptText/prompt!
      // Even simpler: use pressDigit/pressEnterKey? We don't expose roundState directly, so let's parse dimensions!
      const mRect = promptHtml.match(/(\d+)\s+(?:cm|in|ft)\s+×\s+(\d+)\s+(?:cm|in|ft)\s+×\s+(\d+)\s+(?:cm|in|ft)/);
      const mCube = promptHtml.match(/Every edge of this glowing cube box is <strong>(\d+)/);
      const mStory = promptHtml.match(/(\d+)\s+(?:cm|in|ft)\s+long,\s+(\d+)\s+(?:cm|in|ft)\s+wide,\s+and\s+(\d+)\s+(?:cm|in|ft)\s+tall/);
      const m = mRect || mStory;
      let ans;
      if (m) {
        ans = Number(m[1]) * Number(m[2]) * Number(m[3]);
      } else if (mCube) {
        const s = Number(mCube[1]);
        ans = s * s * s;
      } else {
        throw new Error('Could not parse box-builder answer from: ' + promptHtml);
      }
      for (const ch of String(ans)) {
        ctrl.handleAction({ dataset: { action: 'press-digit', digit: ch } });
      }
      ctrl.handleAction({ dataset: { action: 'press-enter' } });
    }

    // First pending unlock: 06_misty_clown_friend (wand without cat shadow)
    assert.equal(modalUnlockEl.classList.contains('hidden'), false);
    assert.equal(getEl('unlock-pod-emoji').className, 'magic-wand-pod');
    assert.ok(getEl('unlock-pod-emoji').innerHTML.includes('Glowing Magic Wand'));
    assert.ok(getEl('unlock-heading').textContent.includes('Magic Training Wand'));
    assert.equal(/\begg\b|\bhatch/i.test(getEl('unlock-tap-prompt').textContent), false);

    ctrl.handleAction({ dataset: { action: 'crack-egg' } });
    assert.equal(getEl('unlock-dragon-name').textContent, 'Clown Friend');
    // Choosing buddy on a non-cat resolves to Misty (01_misty)
    ctrl.handleAction({ dataset: { action: 'close-unlock-modal', makeBuddy: 'true' } });
    assert.equal(save.activeBuddyId, '01_misty');

    // Second pending unlock: 07_fang (cat shadow + Magic Wand!)
    assert.equal(modalUnlockEl.classList.contains('hidden'), false);
    assert.equal(getEl('unlock-pod-emoji').className, 'magic-wand-pod');
    assert.ok(getEl('unlock-pod-emoji').innerHTML.includes('#050F16')); // cat shadow silhouette inside wand pod
    assert.ok(getEl('unlock-heading').textContent.includes('Mystery Cat Shadow'));
    assert.ok(getEl('unlock-tap-prompt').textContent.includes('magic wand'));
    assert.ok(getEl('unlock-extra-banner').textContent.includes('Making Things Float with Her Mind'));

    ctrl.handleAction({ dataset: { action: 'crack-egg' } });
    assert.equal(getEl('unlock-dragon-name').textContent, 'Fang');
    ctrl.handleAction({ dataset: { action: 'close-unlock-modal', makeBuddy: 'true' } });
    assert.equal(save.activeBuddyId, '07_fang');

    // Now test unlocking the 19th prize proclaims queen monster defeated!!!
    save.unlockedDragons = MEOW_TRAINING_GAME.companions.slice(0, 18).map(c => c.id);
    save.trainingBank = 0;
    ctrl.startRound('box-builder');
    for (let i = 0; i < 10; i++) {
      const promptHtml = getEl('question-stage').innerHTML;
      const mRect = promptHtml.match(/(\d+)\s+(?:cm|in|ft)\s+×\s+(\d+)\s+(?:cm|in|ft)\s+×\s+(\d+)\s+(?:cm|in|ft)/);
      const mCube = promptHtml.match(/Every edge of this glowing cube box is <strong>(\d+)/);
      const mStory = promptHtml.match(/(\d+)\s+(?:cm|in|ft)\s+long,\s+(\d+)\s+(?:cm|in|ft)\s+wide,\s+and\s+(\d+)\s+(?:cm|in|ft)\s+tall/);
      const m = mRect || mStory;
      const ans = m ? Number(m[1]) * Number(m[2]) * Number(m[3]) : Math.pow(Number(mCube[1]), 3);
      for (const ch of String(ans)) {
        ctrl.handleAction({ dataset: { action: 'press-digit', digit: ch } });
      }
      ctrl.handleAction({ dataset: { action: 'press-enter' } });
    }
    confettiLayerEl.children.length = 0;
    ctrl.handleAction({ dataset: { action: 'crack-egg' } });
    assert.ok(getEl('unlock-extra-banner').textContent.includes('queen monster defeated!!!'));
    assert.equal(confettiLayerEl.children.length, 65);
    assert.ok(confettiLayerEl.children.some(c => c.textContent === '🪄' || c.textContent === '🐱'));
    ctrl.handleAction({ dataset: { action: 'close-unlock-modal', makeBuddy: 'false' } });
    assert.ok(getEl('results-progress-caption').textContent.includes('queen monster defeated!!!'));

    // Also verify tank-rivals choice round + step_pair layer-slices round initialize cleanly in arena
    ctrl.startRound('tank-rivals');
    assert.ok(getEl('question-stage').innerHTML.includes('vol-duel-grid'));
    assert.ok(getEl('input-panel').innerHTML.includes('choice-btn-0'));
    ctrl.exitArena();

    ctrl.startRound('layer-slices');
    assert.ok(getEl('question-stage').innerHTML.includes('<svg'));
    ctrl.exitArena();
  } finally {
    if (prevDocument === undefined) delete globalThis.document;
    else globalThis.document = prevDocument;
    globalThis.setTimeout = prevSetTimeout;
  }
});

