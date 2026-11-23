import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { GAMES, getGameById } from '../src/games/registry.js';
import { SUPERKITTIES_SHAPES_GAME } from '../src/games/superkitties-shapes/index.js';
import {
  genTileRooms,
  genFencePatrol,
  genLBlueprints,
  genMysterySides,
  genRoomRivals,
  genShapeAcademy,
  buildRoundQuestions
} from '../src/games/superkitties-shapes/generators/index.js';
import {
  applyRoundCompletion,
  calculateRoundStars,
  filterCompanionsByFaction,
  getActiveBuddy,
  getCompanionFactions,
  matchesCompanionFaction
} from '../src/shared/progression.js';
import {
  buildMistakePromptText,
  createRoundState,
  formatCorrectAnswer
} from '../src/shared/round-engine.js';
import {
  PARENT_PIN,
  createDefaultGameSave,
  getGameSave,
  normalizeAndMigrateGameSave,
  normalizeFamilyState
} from '../src/shared/storage.js';
import { renderArcadeView } from '../src/shared/views/arcade-view.js';
import { createParentsController } from '../src/shared/views/parents-view.js';

const MODE_IDS = [
  'tile-rooms',
  'fence-patrol',
  'l-blueprints',
  'mystery-sides',
  'room-rivals',
  'shape-academy'
];

const GENERATORS = {
  'tile-rooms': genTileRooms,
  'fence-patrol': genFencePatrol,
  'l-blueprints': genLBlueprints,
  'mystery-sides': genMysterySides,
  'room-rivals': genRoomRivals,
  'shape-academy': genShapeAcademy
};

const EXPECTED_CATS = [
  { id: '01_kiki', name: 'Kiki', modeId: 'starter', tribe: 'Starlight Paws', stars: 0 },
  { id: '02_meow_meow', name: 'Meow-Meow', modeId: 'tile-rooms', tribe: 'Builder Paws', stars: 10 },
  { id: '03_cuzi', name: 'Cuzi', modeId: 'l-blueprints', tribe: 'Builder Paws • Kitty Family', stars: 10 },
  { id: '04_cagura', name: 'Cagura', modeId: 'fence-patrol', tribe: 'Shield & Laser Paws', stars: 10 },
  { id: '05_flame', name: 'Flame', modeId: 'room-rivals', tribe: 'Starlight Paws', stars: 10 },
  { id: '06_oliva', name: 'Oliva', modeId: 'shape-academy', tribe: 'Shield & Laser Paws', stars: 10 },
  { id: '07_cori', name: 'Cori', modeId: 'mystery-sides', tribe: 'Shield & Laser Paws', stars: 10 },
  { id: '08_misha', name: 'Misha', modeId: 'mix', tribe: 'Starlight Paws', stars: 10 },
  { id: '09_anna', name: 'Anna', modeId: 'mix', tribe: 'Kitty Family', stars: 10 }
];

const REMOVED_HERO_RE = /Starwhisker|Blueprint Bella|Pixel Pounce|Sunny Sprout|Laser Lynx|Ribbon Roo|Volt Velvet|Castle Claw|Splitter Kit|Duchess Domino|Cipher Cat|Keymaster Kiko|Nova Nyx|Comet Cleo|Bramble Berry|Gadget Gizmo|Prism Paw|Rhombus Ruby|Purr-angle|Princess Pawsome|Mecha Meow|Empress Supernova|Hero Pod|Blueprint Showdowns/i;

function assertValidSuperKittiesQuestion(q, modeId) {
  assert.equal(typeof q.dedupeKey, 'string');
  assert.ok(q.dedupeKey.length > 0);
  assert.equal(q.domainId, modeId, `Expected domainId=${modeId}, got ${q.domainId}`);
  assert.equal(typeof q.skillKey, 'string');
  assert.equal(typeof q.skillLabel, 'string');
  assert.equal(typeof q.topicLabel, 'string');
  assert.ok(['numpad', 'multi_slot', 'choice'].includes(q.inputType), `Unexpected inputType ${q.inputType}`);
  assert.equal(typeof q.prompt, 'string');
  assert.ok(q.prompt.length > 10);
  assert.equal(REMOVED_HERO_RE.test(q.prompt), false, `Old removed hero name leaked into prompt: ${q.prompt}`);
  assert.equal(typeof q.promptText, 'string');
  assert.ok(q.promptText.length > 10);
  assert.equal(typeof q.helperText, 'string');
  assert.ok(q.helperText.length > 10);
  assert.equal(typeof q.explanationHTML, 'string');
  assert.ok(q.explanationHTML.length > 15);
  assert.ok(typeof q.fluencySeconds === 'number' && q.fluencySeconds >= 16 && q.fluencySeconds <= 35);

  assert.equal(/onclick=/i.test(q.stageHTML), false, `Inline onclick found in ${q.dedupeKey}`);
  assert.ok(q.stageHTML.includes('<svg'), `Expected inline SVG in ${q.dedupeKey}`);

  for (const field of ['prompt', 'stageHTML', 'explanationHTML']) {
    const offender = q[field].match(/.{0,25}<(?![a-zA-Z/!]).{0,25}/);
    assert.equal(offender, null, `Unescaped < in ${field} of ${q.dedupeKey}: ${offender && offender[0]}`);
  }

  if (q.inputType === 'numpad') {
    assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 999,
      `Numpad answer ${q.answer} out of [0..999] in ${q.dedupeKey}`);
    assert.ok(q.stageHTML.includes('id="slot-main"'), `Missing slot-main in ${q.dedupeKey}`);
  } else if (q.inputType === 'multi_slot') {
    assert.ok(Array.isArray(q.slots) && q.slots.length >= 2);
    assert.equal(typeof q.answer, 'object');
    const formatted = formatCorrectAnswer(q);
    q.slots.forEach(s => {
      const val = q.answer[s.id];
      assert.ok(Number.isInteger(val) && val >= 0 && val <= 999);
      assert.ok(q.stageHTML.includes(`id="mslot-${s.id}"`));
      assert.ok(q.stageHTML.includes('data-action="focus-multi-slot"'));
      assert.ok(q.stageHTML.includes(`data-slot="${s.id}"`));
      assert.ok(formatted.includes(s.shortLabel || s.label));
      assert.ok(formatted.includes(String(val)));
    });
  } else {
    assert.ok(Array.isArray(q.choices) && q.choices.length >= 2 && q.choices.length <= 4);
    const ids = q.choices.map(c => c.id);
    const labels = q.choices.map(c => c.label);
    assert.equal(new Set(ids).size, ids.length, `Duplicate choice ids in ${q.dedupeKey}`);
    assert.equal(new Set(labels).size, labels.length, `Duplicate choice labels in ${q.dedupeKey}`);
    assert.ok(ids.includes(q.answer), `Answer ${q.answer} missing in ${q.dedupeKey}`);
    assert.ok(q.choices.every(c => c.id === c.label), `Choice id !== label in ${q.dedupeKey}`);
    assert.equal(formatCorrectAnswer(q), q.answer);
  }

  assert.ok(buildMistakePromptText(q).length > 5);
}

test('Shape, Perimeter & Area is registered in grade3 with 9 storybook JPEG cat companions', () => {
  assert.ok(GAMES.includes(SUPERKITTIES_SHAPES_GAME), 'Game must be in GAMES registry');
  assert.equal(getGameById('superkitties-shapes'), SUPERKITTIES_SHAPES_GAME);
  assert.equal(SUPERKITTIES_SHAPES_GAME.id, 'superkitties-shapes');
  assert.equal(SUPERKITTIES_SHAPES_GAME.title, 'Shape, Perimeter & Area');
  assert.equal(SUPERKITTIES_SHAPES_GAME.assignedProfileId, 'grade3');
  assert.equal(SUPERKITTIES_SHAPES_GAME.gradeId, 'grade3');
  assert.equal(SUPERKITTIES_SHAPES_GAME.gradeLabel, '3rd Grade');
  assert.equal(SUPERKITTIES_SHAPES_GAME.authorCredit, 'By Hanna BK');
  const roomRivalsMode = SUPERKITTIES_SHAPES_GAME.modes.find(m => m.id === 'room-rivals');
  assert.equal(roomRivalsMode?.title, 'Hernado Watch');
  assert.equal(roomRivalsMode?.shortTitle, 'Hernado Watch');
  assert.equal(SUPERKITTIES_SHAPES_GAME.theme, 'kitty');
  assert.equal(SUPERKITTIES_SHAPES_GAME.defaultPace, 'relaxed');
  assert.equal(SUPERKITTIES_SHAPES_GAME.enableReadAloud, true);
  assert.equal(SUPERKITTIES_SHAPES_GAME.starterId, '01_kiki');
  assert.equal(SUPERKITTIES_SHAPES_GAME.companionNoun, 'Kitty');
  assert.equal(SUPERKITTIES_SHAPES_GAME.companionNounPlural, 'Kitties');
  assert.equal(SUPERKITTIES_SHAPES_GAME.companionNounPluralLower, 'kitties');
  assert.equal(SUPERKITTIES_SHAPES_GAME.unlockHeading, 'A New Kitty Friend Is Joining!');
  assert.equal(SUPERKITTIES_SHAPES_GAME.unlockPodEmoji, '🐾');
  assert.equal(SUPERKITTIES_SHAPES_GAME.sanctuaryTabLabel, '🐱 Kitty HQ');
  assert.equal(SUPERKITTIES_SHAPES_GAME.sanctuaryTitle, '🐱 SuperKitties & Friends HQ');

  const comps = SUPERKITTIES_SHAPES_GAME.companions;
  assert.equal(comps.length, 9);
  assert.equal(new Set(comps.map(c => c.id)).size, 9);

  const serializedMeta = JSON.stringify({
    title: SUPERKITTIES_SHAPES_GAME.title,
    cardDescription: SUPERKITTIES_SHAPES_GAME.cardDescription,
    unlockHeading: SUPERKITTIES_SHAPES_GAME.unlockHeading,
    sanctuarySubtitle: SUPERKITTIES_SHAPES_GAME.sanctuarySubtitle,
    guideTitle: SUPERKITTIES_SHAPES_GAME.guideTitle,
    guideSubtitle: SUPERKITTIES_SHAPES_GAME.guideSubtitle,
    modes: SUPERKITTIES_SHAPES_GAME.modes,
    mixMeta: SUPERKITTIES_SHAPES_GAME.mixMeta,
    companions: comps
  });
  assert.equal(REMOVED_HERO_RE.test(serializedMeta), false, 'Found old removed hero name or Hero Pod string');
  assert.equal(serializedMeta.includes('.svg'), false, 'Companion metadata must not reference removed .svg files');

  const factions = getCompanionFactions(SUPERKITTIES_SHAPES_GAME);
  assert.deepEqual(factions, ['Starlight Paws', 'Builder Paws', 'Shield & Laser Paws', 'Kitty Family']);

  const perMode = {};
  comps.forEach((c, idx) => {
    const exp = EXPECTED_CATS[idx];
    assert.equal(c.id, exp.id);
    assert.equal(c.name, exp.name);
    assert.equal(c.modeId, exp.modeId);
    assert.equal(c.tribe, exp.tribe);
    assert.equal(c.stars, exp.stars);
    assert.equal(c.orderNum, idx + 1, `orderNum mismatch on ${c.id}`);
    assert.equal(c.image, `./assets/superkitties-shapes/companions/${c.id}.jpg`);

    const jpgPath = fileURLToPath(new URL(`../${c.image.slice(2)}`, import.meta.url));
    assert.ok(existsSync(jpgPath), `Missing JPG portrait on disk: ${c.image}`);
    const bytes = readFileSync(jpgPath);
    assert.ok(bytes.length > 1000, `Expected non-empty JPEG for ${c.image}`);
    assert.equal(bytes[0], 0xff, `Expected JPEG SOI byte 0xFF for ${c.image}`);
    assert.equal(bytes[1], 0xd8, `Expected JPEG SOI byte 0xD8 for ${c.image}`);
    assert.equal(bytes[2], 0xff, `Expected JPEG marker 0xFF for ${c.image}`);

    assert.ok(typeof c.bio === 'string' && c.bio.length > 30, `Thin bio on ${c.id}`);
    assert.ok(Array.isArray(c.quotes) && c.quotes.length >= 4, `Expected 4 quotes on ${c.id}`);
    assert.ok(factions.some(f => matchesCompanionFaction(c, f)), `Squad ${c.tribe} uncovered on ${c.id}`);
    perMode[c.modeId] = (perMode[c.modeId] || 0) + 1;
  });

  // Squads: Kitty Family includes Cuzi and Anna; Starlight Paws includes Kiki, Flame, Misha
  const kittyFamily = filterCompanionsByFaction(comps, 'Kitty Family').map(c => c.id);
  assert.deepEqual(kittyFamily, ['03_cuzi', '09_anna']);
  const starlight = filterCompanionsByFaction(comps, 'Starlight Paws').map(c => c.id);
  assert.deepEqual(starlight, ['01_kiki', '05_flame', '08_misha']);

  // Anna explicitly clarifies she is Cuzi's mom and not a SuperKitty herself
  const anna = comps.find(c => c.id === '09_anna');
  assert.match(anna.bio, /Cuzi/i);
  assert.match(anna.bio, /not a SuperKitty/i);
  assert.ok(anna.quotes.some(q => /not a SuperKitty/i.test(q)));

  assert.equal(perMode.starter, 1);
  assert.equal(perMode['tile-rooms'], 1);
  assert.equal(perMode['l-blueprints'], 1);
  assert.equal(perMode['fence-patrol'], 1);
  assert.equal(perMode['room-rivals'], 1);
  assert.equal(perMode['shape-academy'], 1);
  assert.equal(perMode['mystery-sides'], 1);
  assert.equal(perMode.mix, 2);
});

test('Fuzz-test all 6 SuperKitties generators (500 iterations each) and check math invariants', () => {
  const N = 500;

  for (const [modeId, gen] of Object.entries(GENERATORS)) {
    const skills = new Set();
    for (let i = 0; i < N; i++) {
      const q = gen();
      assertValidSuperKittiesQuestion(q, modeId);
      skills.add(q.skillKey);

      if (modeId === 'tile-rooms') {
        if (q.skillKey === 'area_irregular_grid') {
          assert.ok(q.answer >= 10 && q.answer <= 42, `Irregular area ${q.answer} out of [10..42]`);
        } else {
          assert.ok(q.answer >= 6 && q.answer <= 120);
        }
      }

      if (modeId === 'fence-patrol') {
        assert.ok(q.answer >= 8 && q.answer <= 100);
        if (q.skillKey === 'perim_rectangle') {
          assert.equal(q.answer % 2, 0, 'Rectangle perimeter must be even');
        }
      }

      if (modeId === 'l-blueprints') {
        assert.ok(q.answer >= 3 && q.answer <= 240);
      }

      if (modeId === 'mystery-sides') {
        if (q.skillKey === 'both_area_and_perim') {
          assert.equal(q.inputType, 'multi_slot');
          assert.deepEqual(q.slots.map(s => s.id), ['area', 'perim']);
          const rs = createRoundState('mystery-sides', [q]);
          assert.equal(rs.activeSlot, 'area');
          assert.ok(q.answer.area >= 9 && q.answer.area <= 120);
          assert.ok(q.answer.perim >= 12 && q.answer.perim <= 44);
        } else {
          assert.equal(q.inputType, 'numpad');
          assert.ok(q.answer >= 3 && q.answer <= 15);
        }
      }

      if (modeId === 'room-rivals') {
        assert.equal(q.inputType, 'choice');
        assert.ok(q.stageHTML.includes('data-action="submit-choice"'));
        assert.ok(q.stageHTML.includes('data-index="0"') && q.stageHTML.includes('data-index="1"'));
        const dims = [...q.stageHTML.matchAll(/class="sk-duel-sub">(\d+)\s+(?:m|ft)\s+×\s+(\d+)\s+(?:m|ft)</g)]
          .map(m => ({ l: Number(m[1]), w: Number(m[2]) }));
        assert.equal(dims.length, 2, `Expected 2 room dimensions in ${q.dedupeKey}`);
        const [a, b] = dims;
        const areaA = a.l * a.w;
        const areaB = b.l * b.w;
        const perimA = 2 * (a.l + a.w);
        const perimB = 2 * (b.l + b.w);

        if (q.skillKey === 'same_area_diff_perim') {
          assert.equal(areaA, areaB);
          assert.notEqual(perimA, perimB);
          const wantMore = /MORE/i.test(q.prompt);
          const expected = wantMore ? (perimA > perimB ? 'Room A' : 'Room B') : (perimA < perimB ? 'Room A' : 'Room B');
          assert.equal(q.answer, expected);
        } else if (q.skillKey === 'same_perim_diff_area') {
          assert.equal(perimA, perimB);
          assert.notEqual(areaA, areaB);
          const wantMore = /MORE/i.test(q.prompt);
          const expected = wantMore ? (areaA > areaB ? 'Room A' : 'Room B') : (areaA < areaB ? 'Room A' : 'Room B');
          assert.equal(q.answer, expected);
        } else {
          assert.equal(q.choices.length, 3);
          const expected = areaA === areaB ? 'Equal Area!' : (areaA > areaB ? 'Room A' : 'Room B');
          assert.equal(q.answer, expected);
        }
      }

      if (modeId === 'shape-academy') {
        assert.equal(typeof q.focusShape, 'string');
        assert.ok(q.focusShape.length > 0);
        if (q.skillKey === 'shape_attribute_match') {
          assert.equal(q.inputType, 'choice');
          assert.equal(q.choices.length, 4);
          for (let idx = 0; idx < 4; idx++) {
            assert.ok(q.stageHTML.includes(`data-index="${idx}"`));
          }
        } else if (q.skillKey === 'polygon_sides_angles' || q.skillKey === 'polygon_multi_and_div') {
          assert.equal(q.inputType, 'numpad');
          assert.ok(q.answer >= 0 && q.answer <= 100);
        } else {
          assert.equal(q.inputType, 'choice');
          assert.equal(q.choices.length, 4);
        }
      }
    }
    const expectedSkills = modeId === 'shape-academy' ? 5 : 3;
    assert.equal(skills.size, expectedSkills, `Expected ${expectedSkills} distinct skillKeys in ${modeId}, got ${Array.from(skills)}`);
  }
});

test('buildRoundQuestions builds 10 unique puzzles for all 7 SuperKitties modes', () => {
  for (const modeId of SUPERKITTIES_SHAPES_GAME.allModeIds) {
    for (let r = 0; r < 10; r++) {
      const round = buildRoundQuestions(modeId);
      assert.equal(round.length, 10, `${modeId} must return 10 questions`);
      assert.equal(new Set(round.map(q => q.dedupeKey)).size, 10, `Duplicate dedupeKeys in ${modeId}`);
      round.forEach(q => assertValidSuperKittiesQuestion(q, modeId === 'mix' ? q.domainId : modeId));
      if (modeId === 'mix') {
        assert.equal(new Set(round.map(q => q.domainId)).size, 6, 'Daily Patrol mix must cover all 6 modes');
      } else {
        assert.ok(round.every(q => q.domainId === modeId));
      }
    }
  }
});

test('buildRoundQuestions(shape-academy) caps focusShape diversity across 200 rounds without Rhombus repeats', () => {
  const seenSkills = new Set();
  const seenShapes = new Set();

  for (let r = 0; r < 200; r++) {
    const round = buildRoundQuestions('shape-academy');
    assert.equal(round.length, 10);
    assert.equal(new Set(round.map(q => q.dedupeKey)).size, 10, `Duplicate dedupeKey on round ${r}`);

    const shapeCounts = new Map();
    for (const q of round) {
      seenSkills.add(q.skillKey);
      assert.equal(typeof q.focusShape, 'string');
      assert.ok(q.focusShape.length > 0);
      seenShapes.add(q.focusShape);
      shapeCounts.set(q.focusShape, (shapeCounts.get(q.focusShape) || 0) + 1);
    }

    for (const [shape, count] of shapeCounts.entries()) {
      const cap = shape === 'multi_shields' ? 2 : 1;
      assert.ok(count <= cap, `focusShape "${shape}" appeared ${count} times (cap ${cap}) in round ${r}`);
    }
  }

  assert.equal(seenSkills.size, 5, `Expected all 5 skills over 200 rounds, saw ${Array.from(seenSkills)}`);
  for (const newShape of ['tilted_square', 'isosceles_triangle', 'general_quad', 'house_pentagon', 'multi_shields']) {
    assert.ok(seenShapes.has(newShape), `Expected new shape "${newShape}" to appear across 200 rounds`);
  }
});

test('SuperKitties 9-cat star rule, stale save migration (01_captain_starwhisker -> 01_kiki), and views work seamlessly', () => {
  const def = SUPERKITTIES_SHAPES_GAME;
  const save = createDefaultGameSave(def);
  assert.equal(save.activeBuddyId, '01_kiki');
  assert.equal(save.pace, 'relaxed');
  assert.deepEqual(save.unlockedDragons, ['01_kiki']);

  assert.equal(calculateRoundStars('tile-rooms', 7, 'x', def).starsEarned, 7);
  assert.equal(calculateRoundStars('tile-rooms', 10, 'x', def).starsEarned, 10);
  assert.equal(calculateRoundStars('mix', 8, 'x', def).starsEarned, 9);
  assert.equal(calculateRoundStars('mix', 10, 'x', def).starsEarned, 11);

  const nearMiss = applyRoundCompletion({ gameSave: save, gameDef: def, modeId: 'tile-rooms', firstTryCount: 9 });
  assert.equal(nearMiss.pendingUnlocks.length, 0);
  assert.equal(save.modeBank['tile-rooms'], 9);

  const unlockRound = applyRoundCompletion({ gameSave: save, gameDef: def, modeId: 'tile-rooms', firstTryCount: 10 });
  assert.equal(unlockRound.pendingUnlocks.length, 1);
  assert.equal(unlockRound.pendingUnlocks[0].id, '02_meow_meow');
  assert.equal(save.modeBank['tile-rooms'], 0); // tile-rooms only has 1 cat (Meow-Meow), so bank zeros once completed
  assert.ok(save.unlockedDragons.includes('02_meow_meow'));

  // Stale save from earlier 22-cat draft ('01_captain_starwhisker') migrates cleanly to '01_kiki' with 1/9 unlocked
  const staleSave = {
    stars: 10,
    totalSolved: 10,
    activeBuddyId: '01_captain_starwhisker',
    unlockedDragons: ['01_captain_starwhisker', '02_blueprint_bella'],
    modeBank: { 'tile-rooms': 4 }
  };
  const migratedGameSave = normalizeAndMigrateGameSave(staleSave, def);
  assert.equal(migratedGameSave.activeBuddyId, '01_kiki');
  assert.deepEqual(migratedGameSave.unlockedDragons, ['01_kiki']);
  assert.equal(getActiveBuddy(migratedGameSave, def).id, '01_kiki');

  const staleFamily = {
    version: 1,
    activeProfileId: 'grade3',
    soundOn: true,
    profiles: [
      { id: 'grade3', name: 'Hanna', avatar: '🐉', preferredGrade: 'grade3' },
      { id: 'grade1', name: 'Bro', avatar: '🐶', preferredGrade: 'grade1' }
    ],
    saves: {
      grade3: {
        'superkitties-shapes': staleSave
      },
      grade1: {}
    }
  };
  const normalized = normalizeFamilyState(staleFamily, GAMES);
  const skSave = getGameSave(normalized, 'grade3', def);
  assert.equal(skSave.activeBuddyId, '01_kiki');
  assert.deepEqual(skSave.unlockedDragons, ['01_kiki']);
  assert.equal(skSave.pace, 'relaxed');

  // Arcade Home card smoke check
  const arcadeContainer = { innerHTML: '' };
  renderArcadeView({ container: arcadeContainer, familyState: normalized, games: GAMES });
  assert.ok(arcadeContainer.innerHTML.includes('data-game-id="superkitties-shapes"'));
  assert.ok(arcadeContainer.innerHTML.includes('data-card-theme="kitty"'));
  assert.ok(arcadeContainer.innerHTML.includes('By Hanna BK'));
  assert.ok(arcadeContainer.innerHTML.includes('Shape, Perimeter &amp; Area'));
  assert.ok(arcadeContainer.innerHTML.includes('Kiki'));
  assert.ok(arcadeContainer.innerHTML.includes('1 / 9 Kitties'));

  // Parent Dashboard smoke check for superkitties-shapes squad filters
  const parentContainer = { innerHTML: '' };
  const controller = createParentsController({
    games: GAMES,
    getFamilyState: () => normalized,
    setFamilyState: () => {},
    onSave: () => {},
    onStartModeForProfile: () => {},
    onBackToGameOrArcade: () => {}
  });
  const prevDocument = globalThis.document;
  globalThis.document = {
    getElementById(id) {
      if (id === 'parent-pin-input') return { value: PARENT_PIN, focus() {} };
      if (id === 'parent-pin-error') return { textContent: '', classList: { add() {}, remove() {} } };
      return null;
    }
  };
  try {
    controller.setContext('grade3', 'superkitties-shapes');
    controller.render(parentContainer, { showContextHeader: true });
    controller.handleAction({ dataset: { action: 'parent-pin-submit' } }, () => controller.render(parentContainer, { showContextHeader: true }));
    assert.ok(parentContainer.innerHTML.includes('data-faction="Starlight Paws"'));
    assert.ok(parentContainer.innerHTML.includes('data-faction="Kitty Family"'));
    assert.ok(parentContainer.innerHTML.includes('btn-parent-dragon-01_kiki'));
    assert.ok(parentContainer.innerHTML.includes('btn-parent-dragon-09_anna'));
  } finally {
    if (prevDocument === undefined) delete globalThis.document;
    else globalThis.document = prevDocument;
  }
});
