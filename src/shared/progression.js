export function getModeCompanions(gameDef, modeId) {
  return (gameDef.companions || []).filter(c => c.modeId === modeId);
}

export function isCompanionUnlocked(gameSave, id) {
  return Array.isArray(gameSave.unlockedDragons) && gameSave.unlockedDragons.includes(id);
}

export function getUnlockedCompanions(gameSave, gameDef) {
  return (gameDef.companions || []).filter(c => isCompanionUnlocked(gameSave, c.id));
}

export function getActiveBuddy(gameSave, gameDef) {
  const list = gameDef.companions || [];
  if (isCompanionUnlocked(gameSave, gameSave.activeBuddyId)) {
    const found = list.find(c => c.id === gameSave.activeBuddyId);
    if (found) return found;
  }
  return list.find(c => isCompanionUnlocked(gameSave, c.id)) || list[0];
}

export function getModeMeta(gameDef, modeId) {
  if (modeId === 'starter') {
    return {
      id: 'starter',
      title: 'Starter Companion',
      shortTitle: 'Starter',
      icon: '🌟',
      iconBg: '#FEF3C7'
    };
  }
  return gameDef.allModesMeta.find(m => m.id === modeId) || gameDef.mixMeta;
}

export function getNextCompanionSpotlight(gameSave, gameDef, preferredExcludeMode) {
  const allModeIds = gameDef.allModeIds;
  const candidates = allModeIds
    .filter(m => !preferredExcludeMode || m !== preferredExcludeMode)
    .map(m => {
      const locked = getModeCompanions(gameDef, m).filter(c => !isCompanionUnlocked(gameSave, c.id));
      if (locked.length === 0) return null;
      return {
        modeId: m,
        companion: locked[0],
        bank: (gameSave.modeBank && gameSave.modeBank[m]) || 0,
        rounds: (gameSave.modeStats && gameSave.modeStats[m] && gameSave.modeStats[m].rounds) || 0
      };
    })
    .filter(Boolean);

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    if (b.bank !== a.bank) return b.bank - a.bank;
    if (a.rounds !== b.rounds) return a.rounds - b.rounds;
    return allModeIds.indexOf(a.modeId) - allModeIds.indexOf(b.modeId);
  });
  return candidates[0];
}

export function calculateRoundStars(modeId, firstTryCount, mixBonusLabel = '⛰️ Daily Mix Courage Bonus') {
  let starsEarned = 3;
  const breakdown = [{ label: '✅ Completed 10-Puzzle Series', val: '+3 ⭐' }];

  if (firstTryCount >= 8) {
    starsEarned += 1;
    breakdown.push({ label: `🎯 Strong Accuracy (${firstTryCount}/10 First-Try)`, val: '+1 ⭐' });
  }
  if (firstTryCount === 10) {
    starsEarned += 1;
    breakdown.push({ label: '👑 Perfect 10/10 Flawless Mastery!', val: '+1 ⭐' });
  }
  if (modeId === 'mix' && firstTryCount >= 8) {
    starsEarned += 1;
    breakdown.push({ label: mixBonusLabel, val: '+1 ⭐' });
  }

  return { starsEarned, breakdown };
}

export function applyRoundCompletion({ gameSave, gameDef, modeId, firstTryCount, now = Date.now() }) {
  const mixLabel = gameDef.mixBonusLabel || `${gameDef.mixMeta.icon} ${gameDef.mixMeta.title} Courage Bonus`;
  const { starsEarned, breakdown } = calculateRoundStars(modeId, firstTryCount, mixLabel);

  gameSave.stars += starsEarned;
  gameSave.totalSolved += 10;
  gameSave.modeStarsEarned[modeId] = (gameSave.modeStarsEarned[modeId] || 0) + starsEarned;

  const prev = gameSave.modeStats[modeId] || {
    rounds: 0,
    bestFirstTry: 0,
    totalFirstTry: 0,
    totalQuestions: 0,
    lastPlayedAt: 0
  };
  prev.rounds += 1;
  prev.bestFirstTry = Math.max(prev.bestFirstTry, firstTryCount);
  prev.totalFirstTry += firstTryCount;
  prev.totalQuestions += 10;
  prev.lastPlayedAt = now;
  gameSave.modeStats[modeId] = prev;

  const lockedInMode = getModeCompanions(gameDef, modeId).filter(c => !isCompanionUnlocked(gameSave, c.id));
  const pendingUnlocks = [];
  if (lockedInMode.length > 0) {
    let bank = (gameSave.modeBank[modeId] || 0) + starsEarned;
    while (bank >= 10 && lockedInMode.length > 0) {
      bank -= 10;
      const hatched = lockedInMode.shift();
      if (!isCompanionUnlocked(gameSave, hatched.id)) {
        gameSave.unlockedDragons.push(hatched.id);
      }
      pendingUnlocks.push(hatched);
    }
    gameSave.modeBank[modeId] = lockedInMode.length > 0 ? bank : 0;
  } else {
    gameSave.modeBank[modeId] = 0;
  }

  return { starsEarned, breakdown, pendingUnlocks };
}

export function syncModeBanksAndBuddyAfterAdminEdit(gameSave, gameDef) {
  gameDef.allModeIds.forEach(m => {
    const hasLocked = getModeCompanions(gameDef, m).some(c => !isCompanionUnlocked(gameSave, c.id));
    if (!hasLocked) gameSave.modeBank[m] = 0;
  });
  if (!isCompanionUnlocked(gameSave, gameSave.activeBuddyId)) {
    const fallback = gameDef.companions.find(c => isCompanionUnlocked(gameSave, c.id)) || gameDef.companions[0];
    gameSave.activeBuddyId = fallback.id;
  }
}
