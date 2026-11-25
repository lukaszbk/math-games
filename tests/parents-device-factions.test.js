import test from 'node:test';
import assert from 'node:assert/strict';

import { GAMES } from '../src/games/registry.js';
import { FACTORS_AND_MULTIPLES_GAME } from '../src/games/factors-and-multiples/index.js';
import { MULTIPLICATION_FACTS_GAME } from '../src/games/multiplication-facts/index.js';
import { MONEY_MATCH_GAME } from '../src/games/money-match/index.js';
import { SUPERKITTIES_SHAPES_GAME } from '../src/games/superkitties-shapes/index.js';
import { MEOW_TRAINING_GAME } from '../src/games/meow-training/index.js';
import { ADDITION_SUBTRACTION_GAME } from '../src/games/addition-subtraction/index.js';
import { HUNDREDS_CHART_GAME } from '../src/games/hundreds-chart/index.js';
import {
  DEVICE_SETTINGS_KEY,
  FAMILY_STORAGE_KEY,
  PARENT_PIN,
  createDefaultDeviceSettings,
  createDefaultFamilyState,
  encodeBackupCode,
  getEnabledGames,
  importBackupPayload,
  isGamePackEnabled,
  loadDeviceSettings,
  normalizeDeviceSettings,
  saveDeviceSettings,
  saveFamilyState,
  setGamePackEnabled
} from '../src/shared/storage.js';
import {
  filterCompanionsByFaction,
  getCompanionFactions,
  matchesCompanionFaction,
  parseCompanionFactions
} from '../src/shared/progression.js';
import { renderArcadeView } from '../src/shared/views/arcade-view.js';
import { createParentsController } from '../src/shared/views/parents-view.js';

function createMemoryStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem(k) {
      return store.has(k) ? store.get(k) : null;
    },
    setItem(k, v) {
      store.set(k, String(v));
    },
    has(k) {
      return store.has(k);
    }
  };
}

function makeActionEl(action, dataset = {}) {
  return {
    dataset: Object.assign({ action }, dataset)
  };
}

function unlockControllerWithPin(controller, container, rerenderFn) {
  const prevDocument = globalThis.document;
  const mockPinInput = {
    value: PARENT_PIN,
    focus() {}
  };
  const mockErrEl = {
    textContent: '',
    classList: {
      add() {},
      remove() {}
    }
  };
  globalThis.document = {
    getElementById(id) {
      if (id === 'parent-pin-input') return mockPinInput;
      if (id === 'parent-pin-error') return mockErrEl;
      return null;
    }
  };
  try {
    controller.render(container, { showContextHeader: true });
    assert.equal(controller.isUnlocked(), false);
    assert.ok(container.innerHTML.includes('parent-pin-input'));
    controller.handleAction(makeActionEl('parent-pin-submit'), rerenderFn);
    assert.equal(controller.isUnlocked(), true);
  } finally {
    if (prevDocument === undefined) {
      delete globalThis.document;
    } else {
      globalThis.document = prevDocument;
    }
  }
}

test('Device settings normalize, persist, toggle packs, and remain isolated from family backups', () => {
  assert.equal(DEVICE_SETTINGS_KEY, 'math_arcade_device_v1');
  assert.deepEqual(createDefaultDeviceSettings(), {
    version: 1,
    disabledGameIds: []
  });

  // Invalid / malformed payloads normalize safely
  assert.deepEqual(normalizeDeviceSettings(null, GAMES), { version: 1, disabledGameIds: [] });
  assert.deepEqual(normalizeDeviceSettings({ disabledGameIds: 'bad' }, GAMES), { version: 1, disabledGameIds: [] });
  assert.deepEqual(
    normalizeDeviceSettings({
      version: 99,
      disabledGameIds: ['money-match', 'unknown-pack', 42, 'money-match', 'hundreds-chart']
    }, GAMES),
    {
      version: 1,
      disabledGameIds: ['money-match', 'hundreds-chart']
    }
  );

  const storage = createMemoryStorage();
  assert.deepEqual(loadDeviceSettings(GAMES, storage), { version: 1, disabledGameIds: [] });
  assert.deepEqual(loadDeviceSettings(GAMES, null), { version: 1, disabledGameIds: [] });

  storage.setItem(DEVICE_SETTINGS_KEY, '{corrupt json');
  assert.deepEqual(loadDeviceSettings(GAMES, storage), { version: 1, disabledGameIds: [] });

  let settings = createDefaultDeviceSettings();
  assert.equal(isGamePackEnabled(settings, 'money-match'), true);
  assert.equal(getEnabledGames(GAMES, settings).length, GAMES.length);

  // Disable one pack and ignore unknown pack IDs
  const afterDisable = setGamePackEnabled(settings, 'money-match', false, GAMES);
  assert.deepEqual(settings.disabledGameIds, []);
  assert.deepEqual(afterDisable.disabledGameIds, ['money-match']);
  assert.equal(isGamePackEnabled(afterDisable, 'money-match'), false);
  assert.equal(isGamePackEnabled(afterDisable, 'factors-and-multiples'), true);
  assert.equal(getEnabledGames(GAMES, afterDisable).some(g => g.id === 'money-match'), false);
  assert.equal(getEnabledGames(GAMES, afterDisable).length, GAMES.length - 1);

  const afterInvalid = setGamePackEnabled(afterDisable, 'nonexistent-game', false, GAMES);
  assert.deepEqual(afterInvalid.disabledGameIds, ['money-match']);

  saveDeviceSettings(afterDisable, storage);
  const reloadedSettings = loadDeviceSettings(GAMES, storage);
  assert.deepEqual(reloadedSettings, { version: 1, disabledGameIds: ['money-match'] });

  // Re-enable
  const reEnabled = setGamePackEnabled(reloadedSettings, 'money-match', true, GAMES);
  assert.deepEqual(reEnabled.disabledGameIds, []);

  // Isolation from family state & backup import/export
  const family = createDefaultFamilyState(GAMES);
  saveFamilyState(family, storage);
  assert.equal(JSON.parse(storage.getItem(FAMILY_STORAGE_KEY)).disabledGameIds, undefined);

  const exportedCode = encodeBackupCode(family);
  const restored = importBackupPayload(exportedCode, family, GAMES);
  assert.equal(restored.ok, true);
  assert.equal(restored.familyState.disabledGameIds, undefined);
  assert.deepEqual(loadDeviceSettings(GAMES, storage), { version: 1, disabledGameIds: ['money-match'] });
});

test('Faction parsing and extraction covers all 7 games including hybrids, Multiplication Facts, Shape Perimeter Area, and Meow Training', () => {
  assert.deepEqual(parseCompanionFactions('MudWing'), ['MudWing']);
  assert.deepEqual(parseCompanionFactions('NightWing • IceWing'), ['NightWing', 'IceWing']);
  assert.deepEqual(parseCompanionFactions('Robots & Tech'), ['Robots & Tech']);
  assert.deepEqual(parseCompanionFactions(''), []);
  assert.deepEqual(parseCompanionFactions(null), []);

  // Multiplication Facts has sanctuaryFilters: [] but companions use NightWing and NightWing • IceWing
  assert.deepEqual(getCompanionFactions(MULTIPLICATION_FACTS_GAME), ['NightWing', 'IceWing']);

  // Every companion in every game matches at least one extracted faction
  for (const game of GAMES) {
    const factions = getCompanionFactions(game);
    assert.ok(factions.length > 0, `Expected factions for ${game.id}`);
    assert.equal(factions.includes('All'), false);
    assert.equal(factions.includes('Unlocked'), false);
    for (const comp of game.companions) {
      assert.ok(
        factions.some(f => matchesCompanionFaction(comp, f)),
        `Companion ${comp.id} (${comp.tribe}) in ${game.id} did not match any extracted faction`
      );
    }
  }

  // Hybrid matching in Factors & Multiples
  const factorsNight = filterCompanionsByFaction(FACTORS_AND_MULTIPLES_GAME.companions, 'NightWing');
  const factorsIce = filterCompanionsByFaction(FACTORS_AND_MULTIPLES_GAME.companions, 'IceWing');
  const factorsRain = filterCompanionsByFaction(FACTORS_AND_MULTIPLES_GAME.companions, 'RainWing');
  assert.ok(factorsNight.some(d => d.id === '24_whiteout'));
  assert.ok(factorsNight.some(d => d.id === '25_peacemaker'));
  assert.ok(factorsNight.some(d => d.id === '43_darkstalker'));
  assert.ok(factorsIce.some(d => d.id === '24_whiteout'));
  assert.ok(factorsIce.some(d => d.id === '43_darkstalker'));
  assert.ok(factorsRain.some(d => d.id === '25_peacemaker'));

  assert.equal(filterCompanionsByFaction(MONEY_MATCH_GAME.companions, 'All').length, 22);
  assert.equal(filterCompanionsByFaction(SUPERKITTIES_SHAPES_GAME.companions, 'Starlight Paws').length, 3);
  assert.equal(filterCompanionsByFaction(SUPERKITTIES_SHAPES_GAME.companions, 'Kitty Family').length, 2);
  assert.ok(filterCompanionsByFaction(MEOW_TRAINING_GAME.companions, 'Misty’s Crew').some(c => c.id === '01_misty'));
  assert.equal(filterCompanionsByFaction(ADDITION_SUBTRACTION_GAME.companions, 'Robots & Tech').length, 4);
  assert.equal(filterCompanionsByFaction(HUNDREDS_CHART_GAME.companions, 'Supa Cops').length, 4);
});

test('renderArcadeView hides disabled game packs and shows empty-state card when all profile packs are disabled', () => {
  const family = createDefaultFamilyState(GAMES);
  const container = { innerHTML: '' };

  // Default Arcade view shows Money Match, Shape, Perimeter & Area, and Meow Training author credits
  renderArcadeView({ container, familyState: family, games: GAMES });
  assert.ok(container.innerHTML.includes('By Ada Guzhu'));
  assert.ok(container.innerHTML.includes('By Hanna BK'));

  // Disable one grade3 game
  const oneDisabled = setGamePackEnabled(createDefaultDeviceSettings(), 'money-match', false, GAMES);
  renderArcadeView({ container, familyState: family, games: GAMES, deviceSettings: oneDisabled });
  assert.ok(container.innerHTML.includes('data-game-id="factors-and-multiples"'));
  assert.ok(container.innerHTML.includes('data-game-id="multiplication-facts"'));
  assert.ok(container.innerHTML.includes('data-game-id="superkitties-shapes"'));
  assert.ok(container.innerHTML.includes('data-game-id="meow-training"'));
  assert.equal(container.innerHTML.includes('data-game-id="money-match"'), false);
  assert.equal(container.innerHTML.includes('arcade-empty-card'), false);

  // Disable all grade3 games -> shows empty state for 3rd Grader
  let allGrade3Disabled = setGamePackEnabled(oneDisabled, 'factors-and-multiples', false, GAMES);
  allGrade3Disabled = setGamePackEnabled(allGrade3Disabled, 'multiplication-facts', false, GAMES);
  allGrade3Disabled = setGamePackEnabled(allGrade3Disabled, 'superkitties-shapes', false, GAMES);
  allGrade3Disabled = setGamePackEnabled(allGrade3Disabled, 'meow-training', false, GAMES);
  renderArcadeView({ container, familyState: family, games: GAMES, deviceSettings: allGrade3Disabled });
  assert.ok(container.innerHTML.includes('class="arcade-empty-card"'));
  assert.ok(container.innerHTML.includes('No game packs enabled on this device'));
  assert.ok(container.innerHTML.includes('3rd Grader'));
  assert.ok(container.innerHTML.includes('data-action="open-arcade-parents"'));

  // Switch active profile to grade1 -> grade1 games remain visible
  family.activeProfileId = 'grade1';
  renderArcadeView({ container, familyState: family, games: GAMES, deviceSettings: allGrade3Disabled });
  assert.equal(container.innerHTML.includes('arcade-empty-card'), false);
  assert.ok(container.innerHTML.includes('data-game-id="addition-subtraction"'));
  assert.ok(container.innerHTML.includes('data-game-id="hundreds-chart"'));
});

test('Parent controller manages per-device game packs, blocks disabled mode launch, and filters companions by faction', () => {
  const family = createDefaultFamilyState(GAMES);
  let deviceSettings = createDefaultDeviceSettings();
  let familySaves = 0;
  let deviceSaves = 0;
  const startedModes = [];
  const container = { innerHTML: '' };

  const controller = createParentsController({
    games: GAMES,
    getFamilyState: () => family,
    setFamilyState: () => {},
    onSave: () => { familySaves++; },
    getDeviceSettings: () => deviceSettings,
    setDeviceSettings: (next) => { deviceSettings = next; },
    onSaveDeviceSettings: () => { deviceSaves++; },
    onStartModeForProfile: (profileId, gameId, modeId) => {
      startedModes.push({ profileId, gameId, modeId });
    },
    onBackToGameOrArcade: () => {}
  });

  const rerender = () => controller.render(container, { showContextHeader: true });

  // Locked actions are ignored before PIN unlock
  controller.handleAction(makeActionEl('parent-toggle-game-pack', { gameId: 'factors-and-multiples' }), rerender);
  controller.handleAction(makeActionEl('parent-enable-profile-packs'), rerender);
  controller.handleAction(makeActionEl('parent-enable-all-packs'), rerender);
  controller.handleAction(makeActionEl('parent-set-faction-filter', { faction: 'NightWing' }), rerender);
  controller.handleAction(makeActionEl('parent-start-mode', { modeId: 'factors' }), rerender);
  assert.equal(deviceSaves, 0);
  assert.equal(startedModes.length, 0);

  // Unlock via mock PIN DOM (default profile: grade3)
  unlockControllerWithPin(controller, container, rerender);
  assert.ok(container.innerHTML.includes('id="parent-family-section"'));
  assert.ok(container.innerHTML.includes('id="parent-kid-profile-section"'));
  assert.ok(container.innerHTML.includes('id="parent-game-pack-section"'));
  assert.ok(container.innerHTML.includes('id="parent-device-packs"'));
  assert.ok(container.innerHTML.includes('5 / 5 Enabled'));
  assert.ok(container.innerHTML.includes('5/5 on'));
  assert.ok(container.innerHTML.includes('2/2 on'));
  assert.ok(container.innerHTML.includes('id="parent-faction-filters"'));
  assert.ok(container.innerHTML.includes('class="pack-switch-btn is-on"'));
  assert.equal((container.innerHTML.match(/class="parent-profile-menu"/g) || []).length, 1);

  // 3-level structural hierarchy: Family -> Kid Profile -> Selected Game Pack
  const [beforeProfileSection, profileAndNestedHtml] = container.innerHTML.split('<section id="parent-kid-profile-section"');
  assert.ok(beforeProfileSection && profileAndNestedHtml);
  assert.ok(beforeProfileSection.includes('id="parent-family-section"'));
  assert.ok(beforeProfileSection.includes('id="parent-family-backup"'));
  assert.equal(beforeProfileSection.includes('id="parent-kid-profiles"'), false);
  assert.equal(beforeProfileSection.includes('id="parent-device-packs"'), false);
  assert.equal(beforeProfileSection.includes('data-action="parent-reset-game"'), false);

  const [kidSectionBeforeGame, gameSectionHtml] = profileAndNestedHtml.split('<section id="parent-game-pack-section"');
  assert.ok(kidSectionBeforeGame && gameSectionHtml);
  assert.ok(kidSectionBeforeGame.includes('class="parent-profile-menu"'));
  assert.ok(kidSectionBeforeGame.includes('id="parent-kid-profiles"'));
  assert.ok(kidSectionBeforeGame.includes('id="parent-device-packs"'));
  assert.equal(kidSectionBeforeGame.includes('id="parent-family-backup"'), false);
  assert.equal(kidSectionBeforeGame.includes('parent-game-menu'), false);

  // Kid's Device Packs shows only grade3's 5 packs
  assert.ok(kidSectionBeforeGame.includes('btn-parent-pack-factors-and-multiples'));
  assert.ok(kidSectionBeforeGame.includes('btn-parent-pack-multiplication-facts'));
  assert.ok(kidSectionBeforeGame.includes('btn-parent-pack-money-match'));
  assert.ok(kidSectionBeforeGame.includes('btn-parent-pack-superkitties-shapes'));
  assert.ok(kidSectionBeforeGame.includes('btn-parent-pack-meow-training'));
  assert.equal(kidSectionBeforeGame.includes('btn-parent-pack-addition-subtraction'), false);
  assert.equal(kidSectionBeforeGame.includes('btn-parent-pack-hundreds-chart'), false);

  // Selected Game Pack section has no duplicate Kid switcher and nests game-specific controls + reset
  assert.equal(gameSectionHtml.includes('parent-select-profile'), false);
  assert.ok(gameSectionHtml.includes('class="parent-game-menu"'));
  assert.ok(gameSectionHtml.includes('class="parent-game-tab active"'));
  assert.ok(gameSectionHtml.includes('class="parents-kpi-grid"'));
  assert.ok(gameSectionHtml.includes('id="parent-faction-filters"'));
  assert.ok(gameSectionHtml.includes('data-action="parent-reset-game"'));
  assert.equal(gameSectionHtml.includes('id="parent-family-backup"'), false);
  assert.equal(gameSectionHtml.includes('id="parent-device-packs"'), false);

  // Disable currently selected game (factors-and-multiples)
  controller.handleAction(makeActionEl('parent-toggle-game-pack', { gameId: 'factors-and-multiples' }), rerender);
  assert.equal(deviceSaves, 1);
  assert.equal(isGamePackEnabled(deviceSettings, 'factors-and-multiples'), false);
  assert.ok(container.innerHTML.includes('4 / 5 Enabled'));
  assert.ok(container.innerHTML.includes('4/5 on'));
  assert.ok(container.innerHTML.includes('id="btn-parent-enable-profile-packs"'));
  assert.equal(container.innerHTML.includes('id="btn-parent-enable-all-packs"'), false);
  assert.ok(container.innerHTML.includes('class="pack-switch-btn is-off"'));
  assert.ok(container.innerHTML.includes('class="device-disabled-banner"'));
  assert.ok(container.innerHTML.includes('class="pack-off-pill"'));
  assert.ok(container.innerHTML.includes('Lock &amp; Back to Arcade'));
  assert.ok(container.innerHTML.includes('data-action="parent-start-mode" data-mode-id="leftovers" disabled'));

  // Launching a mode for a disabled game is blocked
  controller.handleAction(makeActionEl('parent-start-mode', { modeId: 'leftovers' }), rerender);
  assert.equal(startedModes.length, 0);

  // Switch to grade1 while grade3 pack is disabled -> shows only grade1 packs + cross-profile Enable All Arcade Packs button
  controller.handleAction(makeActionEl('parent-select-profile', { profileId: 'grade1' }), rerender);
  assert.ok(container.innerHTML.includes('2 / 2 Enabled'));
  assert.ok(container.innerHTML.includes('btn-parent-pack-addition-subtraction'));
  assert.ok(container.innerHTML.includes('btn-parent-pack-hundreds-chart'));
  assert.equal(container.innerHTML.includes('btn-parent-pack-factors-and-multiples'), false);
  assert.equal(container.innerHTML.includes('id="btn-parent-enable-profile-packs"'), false);
  assert.ok(container.innerHTML.includes('id="btn-parent-enable-all-packs"'));
  assert.ok(container.innerHTML.includes('Enable All Arcade Packs (6/7)'));

  // Disable one grade1 pack, then re-enable only grade1 packs -> grade3 pack remains disabled
  controller.handleAction(makeActionEl('parent-toggle-game-pack', { gameId: 'addition-subtraction' }), rerender);
  assert.equal(deviceSaves, 2);
  assert.ok(container.innerHTML.includes('1 / 2 Enabled'));
  assert.ok(container.innerHTML.includes('1/2 on'));
  assert.ok(container.innerHTML.includes('id="btn-parent-enable-profile-packs"'));
  assert.ok(container.innerHTML.includes('Enable All Arcade Packs (5/7)'));

  controller.handleAction(makeActionEl('parent-enable-profile-packs'), rerender);
  assert.equal(deviceSaves, 3);
  assert.equal(isGamePackEnabled(deviceSettings, 'addition-subtraction'), true);
  assert.equal(isGamePackEnabled(deviceSettings, 'hundreds-chart'), true);
  assert.equal(isGamePackEnabled(deviceSettings, 'factors-and-multiples'), false);
  assert.ok(container.innerHTML.includes('2 / 2 Enabled'));
  assert.ok(container.innerHTML.includes('Enable All Arcade Packs (6/7)'));

  // Enable all Arcade packs across all profiles, then switch back to grade3
  controller.handleAction(makeActionEl('parent-enable-all-packs'), rerender);
  assert.equal(deviceSaves, 4);
  assert.deepEqual(deviceSettings.disabledGameIds, []);
  assert.equal(container.innerHTML.includes('id="btn-parent-enable-all-packs"'), false);

  controller.handleAction(makeActionEl('parent-select-profile', { profileId: 'grade3' }), rerender);
  assert.ok(container.innerHTML.includes('5 / 5 Enabled'));
  assert.equal(container.innerHTML.includes('device-disabled-banner'), false);

  // Starting a mode works once enabled
  controller.handleAction(makeActionEl('parent-start-mode', { modeId: 'leftovers' }), rerender);
  assert.deepEqual(startedModes, [{ profileId: 'grade3', gameId: 'factors-and-multiples', modeId: 'leftovers' }]);

  // Faction filtering in Original Order view (hybrids included under NightWing & IceWing)
  controller.handleAction(makeActionEl('parent-set-faction-filter', { faction: 'IceWing' }), rerender);
  assert.ok(container.innerHTML.includes('Showing 6 of 43 dragons in IceWing'));
  assert.ok(container.innerHTML.includes('btn-parent-dragon-07_winter'));
  assert.ok(container.innerHTML.includes('btn-parent-dragon-24_whiteout'));
  assert.ok(container.innerHTML.includes('btn-parent-dragon-43_darkstalker'));
  assert.equal(container.innerHTML.includes('btn-parent-dragon-01_clay'), false);

  // Faction filtering in By Puzzle Type view skips empty groups and updates counts
  controller.handleAction(makeActionEl('parent-view-mode', { mode: 'mode' }), rerender);
  assert.ok(container.innerHTML.includes('btn-parent-dragon-24_whiteout'));
  assert.ok(container.innerHTML.includes('btn-parent-dragon-43_darkstalker'));
  assert.equal(container.innerHTML.includes('Starter Companion'), false);

  // Switching game resets faction filter to All and renders Multiplication Facts factions
  controller.handleAction(makeActionEl('parent-select-game', { gameId: 'multiplication-facts' }), rerender);
  assert.ok(container.innerHTML.includes('data-faction="NightWing"'));
  assert.ok(container.innerHTML.includes('data-faction="IceWing"'));
  assert.ok(container.innerHTML.includes('btn-parent-dragon-moonwatcher_coach'));
  assert.ok(container.innerHTML.includes('btn-parent-dragon-colossal_darkstalker'));

  // Switching profile resets faction filter to All and renders grade1 squads
  controller.handleAction(makeActionEl('parent-set-faction-filter', { faction: 'IceWing' }), rerender);
  controller.handleAction(makeActionEl('parent-select-profile', { profileId: 'grade1' }), rerender);
  assert.ok(container.innerHTML.includes('data-faction="Robots &amp; Tech"'));
  assert.ok(container.innerHTML.includes('btn-parent-dragon-01_dog_man'));

  // Filter within Dog Man game
  controller.handleAction(makeActionEl('parent-set-faction-filter', { faction: 'Robots & Tech' }), rerender);
  assert.ok(container.innerHTML.includes('Showing 4 of 29 supa buddies in Robots &amp; Tech'));
  assert.ok(container.innerHTML.includes('btn-parent-dragon-03_eighty_hd'));
  assert.equal(container.innerHTML.includes('btn-parent-dragon-01_dog_man'), false);

  // setContext to a different game resets faction filter; lock() also resets faction filter
  controller.setContext('grade3', 'money-match');
  rerender();
  assert.ok(container.innerHTML.includes('btn-parent-dragon-10_qibli'));
  assert.ok(container.innerHTML.includes('Tap any hoard dragon below to lock or unlock it immediately.'));

  controller.handleAction(makeActionEl('parent-set-faction-filter', { faction: 'MudWing' }), rerender);
  assert.ok(container.innerHTML.includes('Showing 1 of 22 hoard dragons in MudWing'));
  controller.lock();
  assert.equal(controller.isUnlocked(), false);
  unlockControllerWithPin(controller, container, rerender);
  assert.equal(container.innerHTML.includes('Showing 1 of 22 hoard dragons in MudWing'), false);
  assert.equal(familySaves, 0);
});

test('Parent controller and Arcade view self-contained device settings fallback works when optional callbacks are omitted', () => {
  const family = createDefaultFamilyState(GAMES);
  const storage = createMemoryStorage();
  const prevWindow = globalThis.window;
  globalThis.window = { localStorage: storage };

  try {
    const container = { innerHTML: '' };
    const controller = createParentsController({
      games: GAMES,
      getFamilyState: () => family,
      setFamilyState: () => {},
      onSave: () => {},
      onStartModeForProfile: () => {},
      onBackToGameOrArcade: () => {}
    });

    const rerender = () => controller.render(container, { showContextHeader: true });
    unlockControllerWithPin(controller, container, rerender);
    assert.ok(container.innerHTML.includes('5 / 5 Enabled'));

    // Toggle without wired callbacks -> must persist via fallback storage, never no-op
    controller.handleAction(makeActionEl('parent-toggle-game-pack', { gameId: 'money-match' }), rerender);
    assert.ok(container.innerHTML.includes('4 / 5 Enabled'));
    assert.deepEqual(loadDeviceSettings(GAMES, storage), {
      version: 1,
      disabledGameIds: ['money-match']
    });

    // Arcade view without explicit deviceSettings arg reads fallback storage
    const arcadeContainer = { innerHTML: '' };
    renderArcadeView({ container: arcadeContainer, familyState: family, games: GAMES });
    assert.ok(arcadeContainer.innerHTML.includes('data-game-id="factors-and-multiples"'));
    assert.equal(arcadeContainer.innerHTML.includes('data-game-id="money-match"'), false);

    // Enable profile packs via fallback
    controller.handleAction(makeActionEl('parent-enable-profile-packs'), rerender);
    assert.ok(container.innerHTML.includes('5 / 5 Enabled'));
    assert.deepEqual(loadDeviceSettings(GAMES, storage), {
      version: 1,
      disabledGameIds: []
    });
  } finally {
    if (prevWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = prevWindow;
    }
  }
});
