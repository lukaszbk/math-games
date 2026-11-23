export function getModeCompanions(gameDef, modeId) {
  return (gameDef.companions || []).filter(c => c.modeId === modeId);
}

export function parseCompanionFactions(tribeStr) {
  return String(tribeStr || '')
    .split('•')
    .map(part => part.trim())
    .filter(Boolean);
}

export function getCompanionFactions(gameDef) {
  if (!gameDef) return [];
  const result = [];
  const seen = new Set();
  const addFaction = (f) => {
    if (typeof f !== 'string') return;
    const clean = f.trim();
    if (!clean || clean === 'All' || clean === 'Unlocked' || seen.has(clean)) return;
    seen.add(clean);
    result.push(clean);
  };

  if (Array.isArray(gameDef.sanctuaryFilters)) {
    gameDef.sanctuaryFilters.forEach(addFaction);
  }
  (gameDef.companions || []).forEach(c => {
    parseCompanionFactions(c && c.tribe).forEach(addFaction);
  });
  return result;
}

export function matchesCompanionFaction(companion, faction) {
  if (!faction || faction === 'All') return true;
  return parseCompanionFactions(companion && companion.tribe).includes(faction);
}

export function filterCompanionsByFaction(companions, faction) {
  if (!faction || faction === 'All') return (companions || []).slice();
  return (companions || []).filter(c => matchesCompanionFaction(c, faction));
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

export function calculateRoundStars(modeId, firstTryCount, mixBonusLabel = '⛰️ Daily Mix Courage Bonus', gameDef = null) {
  // Games may define their own award scheme (e.g. Money Match awards 1 ⭐ per
  // first-try match so a flawless 10-puzzle run always hatches one egg).
  if (gameDef && typeof gameDef.calculateRoundStars === 'function') {
    return gameDef.calculateRoundStars(modeId, firstTryCount, mixBonusLabel);
  }

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
  const { starsEarned, breakdown } = calculateRoundStars(modeId, firstTryCount, mixLabel, gameDef);

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
  const hasValidBuddy = (gameDef.companions || []).some(c => c.id === gameSave.activeBuddyId)
    && isCompanionUnlocked(gameSave, gameSave.activeBuddyId);
  if (!hasValidBuddy) {
    const fallback = gameDef.companions.find(c => isCompanionUnlocked(gameSave, c.id)) || gameDef.companions[0];
    gameSave.activeBuddyId = fallback.id;
  }
}

export function formatDurationClock(totalSeconds) {
  const secs = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return `${mins}:${String(rem).padStart(2, '0')}`;
}

export function computeSprintPaceTelemetry({
  correctSolved = 0,
  elapsedMs = 0,
  durationSec = 300,
  targetFacts = 100,
  bestPacePerMin = 0,
  bestScore = 0
}) {
  const safeDuration = Math.max(1, Number(durationSec) || 300);
  const safeTarget = Math.max(1, Number(targetFacts) || 100);
  const safeSolved = Math.max(0, Number(correctSolved) || 0);
  const totalMs = safeDuration * 1000;
  const clampedElapsedMs = Math.max(0, Math.min(totalMs, Number(elapsedMs) || 0));
  const elapsedSec = clampedElapsedMs / 1000;
  const remainingMs = Math.max(0, totalMs - clampedElapsedMs);
  const remClockSec = Math.ceil(remainingMs / 1000);
  const formattedClock = formatDurationClock(remClockSec);

  const expectedByNow = (elapsedSec / safeDuration) * safeTarget;
  const paceDelta = safeSolved - expectedByNow;
  const youPct = Math.min(100, (safeSolved / safeTarget) * 100);
  const targetPct = Math.min(100, (elapsedSec / safeDuration) * 100);

  const goalPaceLabel = safeTarget === 100 && safeDuration === 300 ? '100-in-5:00' : '20/min';
  let targetState;
  let targetStatusText;
  if (safeSolved >= safeTarget) {
    targetState = 'goal-met';
    targetStatusText = `🏆 Goal Reached! (${safeSolved}/${safeTarget})`;
  } else if (elapsedSec < 3 && safeSolved === 0) {
    targetState = 'ready';
    targetStatusText = `🎯 Target: ${safeTarget} facts in ${formatDurationClock(safeDuration)}`;
  } else if (paceDelta >= 0.6) {
    targetState = 'ahead';
    targetStatusText = `🚀 Ahead of ${goalPaceLabel} pace (+${paceDelta.toFixed(1)} facts)`;
  } else if (paceDelta <= -0.6) {
    targetState = 'behind';
    targetStatusText = `🔥 ${Math.abs(paceDelta).toFixed(1)} behind ${goalPaceLabel} pace`;
  } else {
    targetState = 'on-pace';
    targetStatusText = `✨ Right on ${goalPaceLabel} pace!`;
  }

  const livePacePerMin = elapsedSec >= 1 ? (safeSolved / (elapsedSec / 60)) : 0;
  const safeBestPace = Math.max(0, Number(bestPacePerMin) || 0);
  const safeBestScore = Math.max(0, Number(bestScore) || 0);
  const ghostExpectedByNow = safeBestPace > 0 ? (safeBestPace / 60) * elapsedSec : 0;
  const ghostDelta = safeSolved - ghostExpectedByNow;
  const ghostPct = safeBestPace > 0 ? Math.min(100, (ghostExpectedByNow / safeTarget) * 100) : 0;

  let ghostState;
  let ghostStatusText;
  if (safeBestPace <= 0) {
    ghostState = 'no-ghost';
    ghostStatusText = '👻 Setting your first Personal Best Ghost!';
  } else if (elapsedSec < 2 && safeSolved === 0) {
    ghostState = 'ready';
    ghostStatusText = `👻 Ghost Pace: ${safeBestPace.toFixed(1)}/min (${safeBestScore} facts)`;
  } else if (ghostDelta >= 0.5) {
    ghostState = 'ahead';
    ghostStatusText = `⚡ Faster than Best! (${livePacePerMin.toFixed(1)} vs ${safeBestPace.toFixed(1)}/min • +${ghostDelta.toFixed(1)})`;
  } else if (ghostDelta <= -0.5) {
    ghostState = 'behind';
    ghostStatusText = `👻 Chasing Ghost (${livePacePerMin.toFixed(1)} vs ${safeBestPace.toFixed(1)}/min • ${ghostDelta.toFixed(1)})`;
  } else {
    ghostState = 'even';
    ghostStatusText = `🤝 Neck & neck with Best (${safeBestPace.toFixed(1)}/min)!`;
  }

  return {
    elapsedSec,
    remainingMs,
    formattedClock,
    expectedByNow,
    paceDelta,
    youPct,
    targetPct,
    targetState,
    targetStatusText,
    livePacePerMin,
    ghostExpectedByNow,
    ghostDelta,
    ghostPct,
    ghostState,
    ghostStatusText
  };
}

export function applySprintCompletion({
  gameSave,
  gameDef,
  modeId,
  correctSolved = 0,
  attempted = 0,
  durationSec = 300,
  hundredthFactMs = 0,
  now = Date.now()
}) {
  if (!gameSave.sprintStats || typeof gameSave.sprintStats !== 'object') {
    gameSave.sprintStats = {};
  }
  const prevSprint = Object.assign(
    { bestScore: 0, bestPacePerMin: 0, lastScore: 0, lastPacePerMin: 0, bestHundredMs: 0 },
    gameSave.sprintStats[modeId] || {}
  );

  const safeSolved = Math.max(0, Number(correctSolved) || 0);
  const safeAttempted = Math.max(safeSolved, Number(attempted) || 0);
  const safeDuration = Math.max(1, Number(durationSec) || 300);
  const pacePerMin = Math.round((safeSolved / (safeDuration / 60)) * 100) / 100;

  const isNewBestScore = safeSolved > prevSprint.bestScore;
  const isNewBestPace = pacePerMin > prevSprint.bestPacePerMin && safeSolved > 0;

  gameSave.sprintStats[modeId] = {
    bestScore: Math.max(prevSprint.bestScore, safeSolved),
    bestPacePerMin: Math.max(prevSprint.bestPacePerMin, pacePerMin),
    lastScore: safeSolved,
    lastPacePerMin: pacePerMin,
    bestHundredMs: hundredthFactMs > 0
      ? (prevSprint.bestHundredMs > 0 ? Math.min(prevSprint.bestHundredMs, hundredthFactMs) : hundredthFactMs)
      : prevSprint.bestHundredMs
  };

  let starsEarned = safeSolved >= 1 ? 3 : 1;
  const breakdown = [
    {
      label: `⏱️ Completed ${formatDurationClock(safeDuration)} Fluency Sprint`,
      val: `+${starsEarned} ⭐`
    }
  ];

  if (pacePerMin >= 12) {
    starsEarned += 1;
    breakdown.push({ label: `⚡ Strong Speed (${pacePerMin.toFixed(1)} facts/min)`, val: '+1 ⭐' });
  }
  if (pacePerMin >= 20) {
    starsEarned += 1;
    breakdown.push({ label: '🚀 Target Fluency Pace (20+ facts/min!)', val: '+1 ⭐' });
  }
  const goalFacts = gameDef.grandPrizeGoalFacts || 100;
  if (modeId === gameDef.grandPrizeModeId && safeSolved >= goalFacts) {
    starsEarned += 2;
    breakdown.push({
      label: gameDef.mixBonusLabel || '⚡ 5-Minute 100-Fact Mastery Bonus',
      val: '+2 ⭐'
    });
  }

  gameSave.stars += starsEarned;
  gameSave.totalSolved += safeSolved;
  gameSave.modeStarsEarned[modeId] = (gameSave.modeStarsEarned[modeId] || 0) + starsEarned;

  const prevMode = gameSave.modeStats[modeId] || {
    rounds: 0,
    bestFirstTry: 0,
    totalFirstTry: 0,
    totalQuestions: 0,
    lastPlayedAt: 0
  };
  prevMode.rounds += 1;
  prevMode.bestFirstTry = Math.max(prevMode.bestFirstTry, safeSolved);
  prevMode.totalFirstTry += safeSolved;
  prevMode.totalQuestions += safeAttempted;
  prevMode.lastPlayedAt = now;
  gameSave.modeStats[modeId] = prevMode;

  const maxSec = gameDef.grandPrizeDurationSec || 300;
  const pendingUnlocks = [];
  if (
    gameDef.grandPrizeId &&
    modeId === gameDef.grandPrizeModeId &&
    safeSolved >= goalFacts &&
    safeDuration <= maxSec &&
    !isCompanionUnlocked(gameSave, gameDef.grandPrizeId)
  ) {
    gameSave.unlockedDragons.push(gameDef.grandPrizeId);
    const prize = (gameDef.companions || []).find(c => c.id === gameDef.grandPrizeId);
    if (prize) pendingUnlocks.push(prize);
  }

  return {
    starsEarned,
    breakdown,
    pendingUnlocks,
    pacePerMin,
    prevBestScore: prevSprint.bestScore,
    prevBestPacePerMin: prevSprint.bestPacePerMin,
    isNewBestScore,
    isNewBestPace
  };
}
