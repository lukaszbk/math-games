import test from 'node:test';
import assert from 'node:assert/strict';
import { GAMES } from '../src/games/registry.js';
import { FACTORS_AND_MULTIPLES_GAME } from '../src/games/factors-and-multiples/index.js';
import { ADDITION_SUBTRACTION_GAME } from '../src/games/addition-subtraction/index.js';
import {
  FAMILY_STORAGE_KEY,
  LEGACY_WINGS_KEY,
  createDefaultFamilyState,
  encodeBackupCode,
  getGameSave,
  importBackupPayload,
  loadFamilyState,
  normalizeFamilyState,
  saveFamilyState
} from '../src/shared/storage.js';
import {
  applyRoundCompletion,
  calculateRoundStars,
  getNextCompanionSpotlight
} from '../src/shared/progression.js';

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

test('Default profiles use puppy avatar for grade1 and strict per-profile game assignment', () => {
  const family = createDefaultFamilyState(GAMES);
  assert.equal(family.profiles[0].id, 'grade3');
  assert.equal(family.profiles[0].avatar, '🐉');
  assert.equal(family.profiles[1].id, 'grade1');
  assert.equal(family.profiles[1].avatar, '🐶');

  assert.equal(FACTORS_AND_MULTIPLES_GAME.assignedProfileId, 'grade3');
  assert.equal(ADDITION_SUBTRACTION_GAME.assignedProfileId, 'grade1');
});

test('Automatic non-destructive legacy migration from wings_of_math_save_v1 to grade3 factors-and-multiples', () => {
  const legacySave = {
    stars: 42,
    activeBuddyId: '02_tsunami',
    soundOn: false,
    pace: 'relaxed',
    totalSolved: 80,
    unlockedDragons: ['01_clay', '02_tsunami', '04_starflight'],
    modeBank: { leftovers: 7, factors: 5 },
    modeStats: { leftovers: { rounds: 4, bestFirstTry: 9, totalFirstTry: 33, totalQuestions: 40, lastPlayedAt: 100 } },
    recentMistakes: [{ ts: 1, modeId: 'factors', promptText: '24', correctText: '4' }]
  };

  const storage = createMemoryStorage({
    [LEGACY_WINGS_KEY]: JSON.stringify(legacySave)
  });

  const family = loadFamilyState(GAMES, storage);

  assert.equal(storage.has(LEGACY_WINGS_KEY), true);
  assert.equal(storage.has(FAMILY_STORAGE_KEY), true);
  assert.equal(family.soundOn, false);

  const g3Factors = getGameSave(family, 'grade3', FACTORS_AND_MULTIPLES_GAME);
  assert.equal(g3Factors.stars, 42);
  assert.equal(g3Factors.activeBuddyId, '02_tsunami');
  assert.equal(g3Factors.pace, 'relaxed');
  assert.deepEqual(g3Factors.unlockedDragons, ['01_clay', '02_tsunami', '04_starflight']);
  assert.equal(g3Factors.modeBank.leftovers, 7);
  assert.equal(g3Factors.recentMistakes.length, 1);

  const g1Factors = getGameSave(family, 'grade1', FACTORS_AND_MULTIPLES_GAME);
  assert.equal(g1Factors.stars, 0);
  assert.deepEqual(g1Factors.unlockedDragons, ['01_clay']);
});

test('Migrates previous primes-and-factors key inside math_arcade_save_v1 into factors-and-multiples', () => {
  const priorSave = {
    version: 1,
    activeProfileId: 'grade1',
    profiles: [
      { id: 'grade3', name: 'Ava', avatar: '🐉', preferredGrade: 'grade3' },
      { id: 'grade1', name: 'Leo', avatar: '🦊', preferredGrade: 'grade1' }
    ],
    saves: {
      grade3: {
        'primes-and-factors': {
          stars: 28,
          totalSolved: 50,
          activeBuddyId: '04_starflight',
          unlockedDragons: ['01_clay', '04_starflight'],
          modeBank: { factors: 8 }
        }
      },
      grade1: {}
    }
  };

  const normalized = normalizeFamilyState(priorSave, GAMES);
  assert.equal(normalized.profiles[1].avatar, '🦊'); // preserves user-customized avatar
  const g3Factors = getGameSave(normalized, 'grade3', FACTORS_AND_MULTIPLES_GAME);
  assert.equal(g3Factors.stars, 28);
  assert.equal(g3Factors.activeBuddyId, '04_starflight');
  assert.equal(g3Factors.modeBank.factors, 8);
});

test('Multi-profile isolation keeps grade3 and grade1 saves, buddies, and stats separate', () => {
  const storage = createMemoryStorage();
  const family = loadFamilyState(GAMES, storage);

  const g3Add = getGameSave(family, 'grade3', ADDITION_SUBTRACTION_GAME);
  const g1Add = getGameSave(family, 'grade1', ADDITION_SUBTRACTION_GAME);
  assert.equal(g1Add.pace, 'relaxed');

  applyRoundCompletion({
    gameSave: g1Add,
    gameDef: ADDITION_SUBTRACTION_GAME,
    modeId: 'make10add',
    firstTryCount: 10
  });
  saveFamilyState(family, storage);

  const reloaded = loadFamilyState(GAMES, storage);
  assert.equal(getGameSave(reloaded, 'grade1', ADDITION_SUBTRACTION_GAME).stars, 5);
  assert.equal(getGameSave(reloaded, 'grade1', ADDITION_SUBTRACTION_GAME).modeBank.make10add, 5);
  assert.equal(getGameSave(reloaded, 'grade3', ADDITION_SUBTRACTION_GAME).stars, 0);
  assert.equal(getGameSave(reloaded, 'grade3', ADDITION_SUBTRACTION_GAME).modeBank.make10add, 0);
});

test('Star award rules and 10-star per-mode Dog Man companion unlocking work accurately', () => {
  assert.equal(calculateRoundStars('make10add', 5).starsEarned, 3);
  assert.equal(calculateRoundStars('make10add', 8).starsEarned, 4);
  assert.equal(calculateRoundStars('make10add', 10).starsEarned, 5);
  assert.equal(calculateRoundStars('mix', 8).starsEarned, 5);
  assert.equal(calculateRoundStars('mix', 10).starsEarned, 6);

  const family = createDefaultFamilyState(GAMES);
  const save = getGameSave(family, 'grade1', ADDITION_SUBTRACTION_GAME);

  const r1 = applyRoundCompletion({
    gameSave: save,
    gameDef: ADDITION_SUBTRACTION_GAME,
    modeId: 'make10add',
    firstTryCount: 10
  });
  assert.equal(r1.starsEarned, 5);
  assert.equal(r1.pendingUnlocks.length, 0);
  assert.equal(save.modeBank.make10add, 5);

  const r2 = applyRoundCompletion({
    gameSave: save,
    gameDef: ADDITION_SUBTRACTION_GAME,
    modeId: 'make10add',
    firstTryCount: 10
  });
  assert.equal(r2.pendingUnlocks.length, 1);
  assert.equal(r2.pendingUnlocks[0].id, '02_lil_petey');
  assert.ok(save.unlockedDragons.includes('02_lil_petey'));
  assert.equal(save.modeBank.make10add, 0);

  const spotlight = getNextCompanionSpotlight(save, ADDITION_SUBTRACTION_GAME, 'make10add');
  assert.ok(spotlight && spotlight.modeId !== 'make10add');
});

test('Backup export/import supports both new family backup codes and legacy wings_of_math_save_v1 codes', () => {
  const family = createDefaultFamilyState(GAMES);
  family.profiles[1].name = 'Mia';
  const code = encodeBackupCode(family);
  const restored = importBackupPayload(code, createDefaultFamilyState(GAMES), GAMES);
  assert.equal(restored.ok, true);
  assert.equal(restored.kind, 'family');
  assert.equal(restored.familyState.profiles[1].name, 'Mia');

  const legacyObj = {
    stars: 19,
    activeBuddyId: '04_starflight',
    unlockedDragons: ['01_clay', '04_starflight'],
    modeBank: { factors: 9 }
  };
  const legacyCode = encodeBackupCode(legacyObj);
  const legacyRes = importBackupPayload(legacyCode, family, GAMES, 'grade3');
  assert.equal(legacyRes.ok, true);
  assert.equal(legacyRes.kind, 'legacy-factors');
  const g3Factors = getGameSave(legacyRes.familyState, 'grade3', FACTORS_AND_MULTIPLES_GAME);
  assert.equal(g3Factors.stars, 19);
  assert.equal(g3Factors.activeBuddyId, '04_starflight');
  assert.equal(g3Factors.modeBank.factors, 9);
  assert.equal(legacyRes.familyState.profiles[1].name, 'Mia');
});

test('Recovers Chrome prompt()-truncated 2000-char legacy backup codes cleanly', () => {
  const truncatedUserCode =
    'eyJzdGFycyI6MzE3LCJhY3RpdmVCdWRkeUlkIjoiNDNfZGFya3N0YWxrZXIiLCJzb3VuZE9uIjp0cnVlLCJwYWNlIjoicmVsYXhlZCIsInRvdGFsU29sdmVkIjo3NzAsInVubG9ja2VkRHJhZ29ucyI6WyIwMV9jbGF5IiwiMDRfc3RhcmZsaWdodCIsIjE1X3Nub3dmYWxsIiwiMjNfd2lsbG93IiwiMjZfY2xlYXJzaWdodCIsIjM0X2phbWJ1IiwiMDhfcGVyaWwiLCIxM19jcmlja2V0IiwiMjBfZmF0ZXNwZWFrZXIiLCIyNF93aGl0ZW91dCIsIjMzX2x5bngiLCI0Ml9waW5lYXBwbGUiLCIxMV9raW5rYWpvdSIsIjQwX3NvcmEiLCIwNV9zdW5ueSIsIjA3X3dpbnRlciIsIjE4X2FuZW1vbmUiLCIyNV9wZWFjZW1ha2VyIiwiMjlfc2t5IiwiNDNfZGFya3N0YWxrZXIiXSwibW9kZUJhbmsiOnsibWl4IjowLCJsZWZ0b3ZlcnMiOjAsImZhY3RvcnMiOjAsIm11bHRpcGxlcyI6MSwicHJpbWVzIjowLCJnY2ZsY20iOjMsIm15c3RlcnkiOjN9LCJtb2RlU3RhcnNFYXJuZWQiOnsibWl4Ijo2NCwibGVmdG92ZXJzIjowLCJmYWN0b3JzIjo2MCwibXVsdGlwbGVzIjoxMSwicHJpbWVzIjoxNzIsImdjZmxjbSI6MywibXlzdGVyeSI6M30sIm1vZGVTdGF0cyI6eyJtaXgiOnsicm91bmRzIjoxNCwiYmVzdEZpcnN0VHJ5IjoxMCwidG90YWxGaXJzdFRyeSI6MTEwLCJ0b3RhbFF1ZXN0aW9ucyI6MTQwLCJsYXN0UGxheWVkQXQiOjE3OTQ1MzU5OTc3MDZ9LCJsZWZ0b3ZlcnMiOnsicm91bmRzIjowLCJiZXN0Rmlyc3RUcnkiOjAsInRvdGFsRml...wic2tpbGxMYWJlbCI6IkdDRiAmIExDTSBXb3JkIFByb2JsZW1zIiwicHJvbXB0VGV4dCI6IkNyaWNrZXQgY2hlY2tzIGhlciBwbGFudCBleHBlcmltZW50IGV2ZXJ5IDMgZGF5cywgYW5kIFN1bmRldyBjaGVja3MgaGVycyBldmVyeSA1IGRheXMuIEluIGhvdyBtYW55IGRheXMgd2lsbCB0aGV5IGNoZWNrIHRoZWlyIHBsYW50cyBvbiB0aGUgU0FNRSBkYXkgYWdhaW4/IiwiY29ycmVjdFRleHQiOiIxNSJ9LHsidHMiOjE3OTQ1MjM4MjM3ODAsIm1vZGVJZCI6ImdjZmxjbSIsImRvbWFpbklkIjoiZ2NmbGNtIiwic2tpbGxMYWJlbCI6IkdyZWF0ZXN0IENvbW1vbiBGYWN0b3IgKEdDRikiLCJwcm9tcHRUZXh0IjoiRmluZCB0aGUgR3JlYXRlc3QgQ29tbW9uIEZhY3RvciAoR0NGKSBvZiA1NCBhbmQgODE6IiwiY29ycmVjdFRleHQiOiIyNyJ9LHsidHMiOjE3OTQ1MjM3NTU4MjEsIm1vZGVJZCI6ImdjZmxjbSIsImRvbWFpbklkIjoiZ2NmbGNtIiwic2tpbGxMYWJlbCI6IkdDRiAmIExDTSBXb3JkIFByb2JsZW1zIiwicHJvbXB0VGV4dCI6IlN0YXJmbGlnaHQgaGFzIDI4IGhpc3Rvcnkgc2Nyb2xscyBhbmQgNDIgbWFwIHNjcm9sbHMgdG8gcGxhY2UgZXF1YWxseSBvbnRvIGxpYnJhcnkgc2hlbHZlcyB3aXRoIG5vbmUgbGVmdCBvdmVyLiBXaGF0IGlzIHRoZSBHUkVBVEVTVCBudW1iZXIgb2Ygc2hlbHZlcyBoZSBjYW4gZmlsbCBpZGVudGljYWxseT8iLCJjb3JyZWN0VGV4dCI6IjE0In1dLCJ2MUxlZ2FjeVN0YXJzIjoyMzJ9';

  const family = createDefaultFamilyState(GAMES);
  const res = importBackupPayload(truncatedUserCode, family, GAMES, 'grade3');
  assert.equal(res.ok, true);
  assert.equal(res.kind, 'legacy-factors');
  assert.equal(res.recoveredTruncated, true);

  const g3 = getGameSave(res.familyState, 'grade3', FACTORS_AND_MULTIPLES_GAME);
  assert.equal(g3.stars, 317);
  assert.equal(g3.totalSolved, 770);
  assert.equal(g3.activeBuddyId, '43_darkstalker');
  assert.equal(g3.pace, 'relaxed');
  assert.equal(g3.unlockedDragons.length, 20);
  assert.equal(g3.v1LegacyStars, 232);
  assert.equal(g3.modeBank.multiples, 1);
  assert.equal(g3.modeBank.gcflcm, 3);
  assert.equal(g3.modeBank.mystery, 3);
  assert.equal(g3.modeStats.mix.rounds, 14);
  assert.equal(g3.modeStats.factors.rounds, 15);
  assert.equal(g3.modeStats.primes.rounds, 43);
  assert.equal(g3.modeStats.multiples.rounds, 3);
  assert.equal(g3.modeStats.gcflcm.rounds, 1);
  assert.equal(g3.modeStats.mystery.rounds, 1);
  assert.equal(g3.recentMistakes.length, 2);
});
