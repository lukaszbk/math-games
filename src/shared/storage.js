import { getModeCompanions } from './progression.js';

export const FAMILY_STORAGE_KEY = 'math_arcade_save_v1';
export const LEGACY_WINGS_KEY = 'wings_of_math_save_v1';
export const PARENT_PIN = '885174';
export const PROFILE_AVATAR_OPTIONS = ['🐉', '🐶', '🦄', '🦉', '🦊', '🦁', '🐼', '🚀', '🌟'];

export function createDefaultProfiles() {
  return [
    { id: 'grade3', name: '3rd Grader', avatar: '🐉', preferredGrade: 'grade3' },
    { id: 'grade1', name: '1st Grader', avatar: '🐶', preferredGrade: 'grade1' }
  ];
}

export function createDefaultModeStats(allModeIds) {
  const stats = {};
  allModeIds.forEach(m => {
    stats[m] = { rounds: 0, bestFirstTry: 0, totalFirstTry: 0, totalQuestions: 0, lastPlayedAt: 0 };
  });
  return stats;
}

export function createDefaultModeZeroMap(allModeIds) {
  const map = {};
  allModeIds.forEach(m => {
    map[m] = 0;
  });
  return map;
}

export function createDefaultGameSave(gameDef) {
  const starterId = gameDef.starterId || (gameDef.companions[0] && gameDef.companions[0].id) || '';
  return {
    stars: 0,
    activeBuddyId: starterId,
    soundOn: true,
    pace: gameDef.defaultPace === 'relaxed' ? 'relaxed' : 'brisk',
    totalSolved: 0,
    unlockedDragons: starterId ? [starterId] : [],
    modeBank: createDefaultModeZeroMap(gameDef.allModeIds),
    modeStarsEarned: createDefaultModeZeroMap(gameDef.allModeIds),
    modeStats: createDefaultModeStats(gameDef.allModeIds),
    skillStats: {},
    recentMistakes: [],
    v1LegacyStars: 0
  };
}

export function normalizeAndMigrateGameSave(parsed, gameDef) {
  const base = createDefaultGameSave(gameDef);
  if (!parsed || typeof parsed !== 'object') return base;

  const starterId = base.activeBuddyId;
  const allModeIds = gameDef.allModeIds;
  const merged = Object.assign({}, base, parsed);

  merged.stars = typeof parsed.stars === 'number' && parsed.stars >= 0 ? parsed.stars : 0;
  merged.totalSolved = typeof parsed.totalSolved === 'number' && parsed.totalSolved >= 0 ? parsed.totalSolved : 0;
  merged.soundOn = typeof parsed.soundOn === 'boolean' ? parsed.soundOn : true;
  merged.pace = parsed.pace === 'relaxed'
    ? 'relaxed'
    : (parsed.pace === 'brisk' ? 'brisk' : base.pace);

  const baseStats = createDefaultModeStats(allModeIds);
  const rawStats = (parsed.modeStats && typeof parsed.modeStats === 'object') ? parsed.modeStats : {};
  merged.modeStats = {};
  allModeIds.forEach(m => {
    merged.modeStats[m] = Object.assign({}, baseStats[m], rawStats[m] || {});
  });

  merged.modeBank = Object.assign(
    createDefaultModeZeroMap(allModeIds),
    (parsed.modeBank && typeof parsed.modeBank === 'object') ? parsed.modeBank : {}
  );
  merged.modeStarsEarned = Object.assign(
    createDefaultModeZeroMap(allModeIds),
    (parsed.modeStarsEarned && typeof parsed.modeStarsEarned === 'object') ? parsed.modeStarsEarned : {}
  );
  merged.skillStats = (parsed.skillStats && typeof parsed.skillStats === 'object' && !Array.isArray(parsed.skillStats))
    ? Object.assign({}, parsed.skillStats)
    : {};
  merged.recentMistakes = Array.isArray(parsed.recentMistakes) ? parsed.recentMistakes.slice(0, 25) : [];

  const rawUnlocked = Array.isArray(parsed.unlockedDragons)
    ? parsed.unlockedDragons
    : (Array.isArray(parsed.unlockedCompanions) ? parsed.unlockedCompanions : null);

  if (!rawUnlocked) {
    const unlocked = starterId ? [starterId] : [];
    allModeIds.forEach(m => {
      const mStat = merged.modeStats[m] || { rounds: 0 };
      const est = (mStat.rounds || 0) * 4;
      merged.modeStarsEarned[m] = est;
      const modeComps = getModeCompanions(gameDef, m);
      const count = Math.min(modeComps.length, Math.floor(est / 10));
      for (let i = 0; i < count; i++) {
        if (!unlocked.includes(modeComps[i].id)) unlocked.push(modeComps[i].id);
      }
      merged.modeBank[m] = count < modeComps.length ? (est % 10) : 0;
    });
    merged.unlockedDragons = unlocked;
    merged.v1LegacyStars = typeof parsed.stars === 'number' ? parsed.stars : 0;
  } else {
    const validIds = new Set(gameDef.companions.map(c => c.id));
    const cleanSet = starterId ? [starterId] : [];
    rawUnlocked.forEach(id => {
      if (validIds.has(id) && !cleanSet.includes(id)) cleanSet.push(id);
    });
    merged.unlockedDragons = cleanSet;
    merged.v1LegacyStars = typeof parsed.v1LegacyStars === 'number' ? parsed.v1LegacyStars : 0;
  }

  // Clamp modeBank to 0..9 and zero out completed modes
  allModeIds.forEach(m => {
    const lockedInMode = getModeCompanions(gameDef, m).filter(c => !merged.unlockedDragons.includes(c.id));
    if (lockedInMode.length === 0) {
      merged.modeBank[m] = 0;
    } else {
      const b = Number(merged.modeBank[m]) || 0;
      merged.modeBank[m] = Math.max(0, Math.min(9, Math.floor(b)));
    }
  });

  if (!merged.unlockedDragons.includes(merged.activeBuddyId)) {
    const firstUnl = gameDef.companions.find(c => merged.unlockedDragons.includes(c.id));
    merged.activeBuddyId = firstUnl ? firstUnl.id : starterId;
  }

  return merged;
}

export function createDefaultFamilyState(gamesList) {
  const profiles = createDefaultProfiles();
  const saves = {};
  profiles.forEach(p => {
    saves[p.id] = {};
    gamesList.forEach(g => {
      saves[p.id][g.id] = createDefaultGameSave(g);
    });
  });
  return {
    version: 1,
    activeProfileId: 'grade3',
    soundOn: true,
    profiles,
    saves
  };
}

export function normalizeFamilyState(raw, gamesList) {
  const base = createDefaultFamilyState(gamesList);
  if (!raw || typeof raw !== 'object') return base;

  const defaultProfiles = createDefaultProfiles();
  let profiles = defaultProfiles;
  if (Array.isArray(raw.profiles) && raw.profiles.length > 0) {
    profiles = defaultProfiles.map(defP => {
      const found = raw.profiles.find(p => p && p.id === defP.id);
      if (!found) return defP;
      const name = typeof found.name === 'string' && found.name.trim() ? found.name.trim().slice(0, 24) : defP.name;
      const avatar = typeof found.avatar === 'string' && found.avatar.trim() ? found.avatar.trim() : defP.avatar;
      return {
        id: defP.id,
        name,
        avatar,
        preferredGrade: defP.preferredGrade
      };
    });
  }

  const validProfileIds = new Set(profiles.map(p => p.id));
  const activeProfileId = validProfileIds.has(raw.activeProfileId) ? raw.activeProfileId : 'grade3';
  const soundOn = typeof raw.soundOn === 'boolean' ? raw.soundOn : true;

  const saves = {};
  const rawSaves = (raw.saves && typeof raw.saves === 'object') ? raw.saves : {};
  profiles.forEach(p => {
    const pRaw = (rawSaves[p.id] && typeof rawSaves[p.id] === 'object') ? rawSaves[p.id] : {};
    saves[p.id] = {};
    gamesList.forEach(g => {
      let rawGameSave = pRaw[g.id];
      // Backward compatibility: migrate old 'primes-and-factors' key to 'factors-and-multiples'
      if (!rawGameSave && g.id === 'factors-and-multiples' && pRaw['primes-and-factors']) {
        rawGameSave = pRaw['primes-and-factors'];
      }
      saves[p.id][g.id] = normalizeAndMigrateGameSave(rawGameSave, g);
      saves[p.id][g.id].soundOn = soundOn;
    });
  });

  return {
    version: 1,
    activeProfileId,
    soundOn,
    profiles,
    saves
  };
}

function getBrowserStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch (_) {}
  return null;
}

export function loadFamilyState(gamesList, storage = getBrowserStorage()) {
  if (!storage) return createDefaultFamilyState(gamesList);

  try {
    const rawFamily = storage.getItem(FAMILY_STORAGE_KEY);
    if (rawFamily) {
      return normalizeFamilyState(JSON.parse(rawFamily), gamesList);
    }

    // Automatic non-destructive migration from legacy single-HTML save
    const rawLegacy = storage.getItem(LEGACY_WINGS_KEY);
    if (rawLegacy) {
      const legacyParsed = JSON.parse(rawLegacy);
      const family = createDefaultFamilyState(gamesList);
      const factorsDef = gamesList.find(g => g.id === 'factors-and-multiples');
      if (factorsDef && legacyParsed && typeof legacyParsed === 'object') {
        const migrated = normalizeAndMigrateGameSave(legacyParsed, factorsDef);
        family.saves.grade3['factors-and-multiples'] = migrated;
        if (typeof legacyParsed.soundOn === 'boolean') {
          family.soundOn = legacyParsed.soundOn;
        }
        saveFamilyState(family, storage);
        return family;
      }
    }
  } catch (_) {}

  return createDefaultFamilyState(gamesList);
}

export function saveFamilyState(familyState, storage = getBrowserStorage()) {
  if (!storage) return;
  try {
    storage.setItem(FAMILY_STORAGE_KEY, JSON.stringify(familyState));
  } catch (_) {}
}

export function getActiveProfile(familyState) {
  return familyState.profiles.find(p => p.id === familyState.activeProfileId) || familyState.profiles[0];
}

export function getGameSave(familyState, profileId, gameDef) {
  if (!familyState.saves[profileId]) familyState.saves[profileId] = {};
  if (!familyState.saves[profileId][gameDef.id]) {
    familyState.saves[profileId][gameDef.id] = createDefaultGameSave(gameDef);
  }
  return familyState.saves[profileId][gameDef.id];
}

export function encodeBackupCode(obj) {
  const json = JSON.stringify(obj);
  const utf8Binary = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
  return btoa(utf8Binary);
}

export function decodeBackupCode(code) {
  const bin = atob(String(code || '').trim());
  let pct = '';
  for (let i = 0; i < bin.length; i++) {
    const hex = bin.charCodeAt(i).toString(16).toUpperCase().padStart(2, '0');
    pct += '%' + hex;
  }
  return JSON.parse(decodeURIComponent(pct));
}

export function importBackupPayload(rawInput, currentFamilyState, gamesList, targetProfileId = 'grade3') {
  let decoded = rawInput;
  if (typeof rawInput === 'string') {
    const trimmed = rawInput.trim();
    if (trimmed.startsWith('{')) {
      decoded = JSON.parse(trimmed);
    } else {
      decoded = decodeBackupCode(trimmed);
    }
  }

  if (!decoded || typeof decoded !== 'object') {
    return { ok: false, error: 'Invalid backup payload.' };
  }

  // Case 1: New family save format
  if (decoded.version === 1 && decoded.saves && typeof decoded.saves === 'object') {
    return {
      ok: true,
      kind: 'family',
      familyState: normalizeFamilyState(decoded, gamesList)
    };
  }

  // Case 2: Legacy single-game wings_of_math_save_v1 backup code
  if (typeof decoded.stars === 'number') {
    const factorsDef = gamesList.find(g => g.id === 'factors-and-multiples');
    if (!factorsDef) return { ok: false, error: 'Factors & Multiples game not registered.' };

    const nextFamily = normalizeFamilyState(JSON.parse(JSON.stringify(currentFamilyState)), gamesList);
    const profId = nextFamily.profiles.some(p => p.id === targetProfileId) ? targetProfileId : 'grade3';
    nextFamily.saves[profId]['factors-and-multiples'] = normalizeAndMigrateGameSave(decoded, factorsDef);
    return {
      ok: true,
      kind: 'legacy-factors',
      profileId: profId,
      familyState: nextFamily
    };
  }

  return { ok: false, error: 'Unrecognized backup format.' };
}
