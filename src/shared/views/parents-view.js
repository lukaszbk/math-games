import { escapeHtml } from '../dom.js';
import { SFX } from '../audio.js';
import {
  PARENT_PIN,
  PROFILE_AVATAR_OPTIONS,
  createDefaultDeviceSettings,
  createDefaultGameSave,
  encodeBackupCode,
  getGameSave,
  importBackupPayload,
  isGamePackEnabled,
  loadDeviceSettings,
  saveDeviceSettings,
  setGamePackEnabled
} from '../storage.js';
import {
  filterCompanionsByFaction,
  getCompanionFactions,
  getModeCompanions,
  getModeMeta,
  getUnlockedCompanions,
  isCompanionUnlocked,
  syncModeBanksAndBuddyAfterAdminEdit
} from '../progression.js';

export function createParentsController({
  games,
  getFamilyState,
  setFamilyState,
  onSave,
  getDeviceSettings = null,
  setDeviceSettings = null,
  onSaveDeviceSettings = null,
  onStartModeForProfile,
  onBackToGameOrArcade
}) {
  let parentUnlocked = false;
  let parentPinError = '';
  let parentViewMode = 'order'; // 'order' | 'mode'
  let parentFactionFilter = 'All';
  let selectedProfileId = 'grade3';
  let selectedGameId = 'factors-and-multiples';
  let backupDrawerMode = null; // null | 'export' | 'import'
  let backupExportValue = '';
  let backupStatusMsg = '';
  let backupStatusIsError = false;
  let fallbackDeviceSettings = null;

  function readDeviceSettings() {
    if (typeof getDeviceSettings === 'function') {
      return getDeviceSettings();
    }
    fallbackDeviceSettings = fallbackDeviceSettings || loadDeviceSettings(games);
    return fallbackDeviceSettings;
  }

  function writeDeviceSettings(next) {
    if (typeof setDeviceSettings === 'function') {
      setDeviceSettings(next);
    } else {
      fallbackDeviceSettings = next;
    }
  }

  function persistDevice() {
    if (typeof onSaveDeviceSettings === 'function') {
      onSaveDeviceSettings();
    } else {
      saveDeviceSettings(readDeviceSettings());
    }
  }

  function getProfileGames(profileId) {
    const owned = games.filter(g => g.assignedProfileId === profileId);
    return owned.length > 0 ? owned : games;
  }

  function syncSelectionDefaults(preferredProfileId, preferredGameId) {
    const prevGameId = selectedGameId;
    const family = getFamilyState();
    if (preferredProfileId && family.profiles.some(p => p.id === preferredProfileId)) {
      selectedProfileId = preferredProfileId;
    } else if (!family.profiles.some(p => p.id === selectedProfileId)) {
      selectedProfileId = family.activeProfileId || family.profiles[0].id;
    }

    const profileGames = getProfileGames(selectedProfileId);
    if (preferredGameId && profileGames.some(g => g.id === preferredGameId)) {
      selectedGameId = preferredGameId;
    } else if (!profileGames.some(g => g.id === selectedGameId)) {
      selectedGameId = profileGames[0].id;
    }

    if (selectedGameId !== prevGameId) {
      parentFactionFilter = 'All';
    }
  }

  function render(container, { backLabel = '← Back to Math Quests', showContextHeader = false } = {}) {
    if (!container) return;
    syncSelectionDefaults();
    const family = getFamilyState();

    if (!parentUnlocked) {
      container.innerHTML = `
        <div class="parent-gate-card">
          <div style="font-size:2rem; margin-bottom:4px;">🔒</div>
          <h2 style="margin:0 0 6px; font-size:1.45rem;">Parent Dashboard</h2>
          <p style="margin:0; font-size:0.9rem; color:var(--ink-700);">Enter the 6-digit parent passcode to view learning insights, switch kid profiles, adjust unlocks, or manage saved data.</p>
          <input
            id="parent-pin-input"
            class="parent-pin-input"
            type="password"
            inputmode="numeric"
            maxlength="6"
            autocomplete="off"
            placeholder="••••••"
            aria-label="Parent Passcode"
          />
          <div id="parent-pin-error" class="parent-pin-error ${parentPinError ? '' : 'hidden'}">${escapeHtml(parentPinError)}</div>
          <div class="parent-pin-pad">
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<button type="button" class="parent-pin-key" data-action="parent-pin-digit" data-digit="${d}">${d}</button>`).join('')}
            <button type="button" class="parent-pin-key back-key" data-action="parent-pin-backspace">⌫</button>
            <button type="button" class="parent-pin-key" data-action="parent-pin-digit" data-digit="0">0</button>
            <button type="button" id="btn-parent-unlock" class="parent-pin-key unlock-key" data-action="parent-pin-submit">Unlock</button>
          </div>
          <button type="button" class="secondary-action-btn" style="font-size:0.9rem; padding:10px 18px;" data-action="parent-lock-exit">${escapeHtml(backLabel)}</button>
        </div>
      `;
      const inputEl = document.getElementById('parent-pin-input');
      if (inputEl) inputEl.focus();
      return;
    }

    const activeProfile = family.profiles.find(p => p.id === selectedProfileId) || family.profiles[0];
    const profileGames = getProfileGames(activeProfile.id);
    const gameDef = profileGames.find(g => g.id === selectedGameId) || profileGames[0];
    selectedGameId = gameDef.id;
    const gameSave = getGameSave(family, activeProfile.id, gameDef);
    const deviceSettings = readDeviceSettings();
    const isSelectedGameEnabled = isGamePackEnabled(deviceSettings, gameDef.id);
    const startModeDisabledAttr = isSelectedGameEnabled
      ? ''
      : ' disabled title="Enable this game pack on this device to play"';
    const enabledProfilePackCount = profileGames.filter(g => isGamePackEnabled(deviceSettings, g.id)).length;
    const totalEnabledPackCount = games.filter(g => isGamePackEnabled(deviceSettings, g.id)).length;
    const otherProfilesHaveDisabledPacks = (games.length - totalEnabledPackCount) > (profileGames.length - enabledProfilePackCount);

    const factions = getCompanionFactions(gameDef);
    if (parentFactionFilter !== 'All' && !factions.includes(parentFactionFilter)) {
      parentFactionFilter = 'All';
    }
    const filteredCompanions = filterCompanionsByFaction(gameDef.companions, parentFactionFilter);

    // Compute Learning Overview Metrics
    let totalRounds = 0;
    let totalQuestions = 0;
    let totalFirstTry = 0;
    let modesExplored = 0;
    const modeSummaries = gameDef.allModesMeta.map(m => {
      const st = gameSave.modeStats[m.id] || { rounds: 0, bestFirstTry: 0, totalFirstTry: 0, totalQuestions: 0 };
      const acc = st.totalQuestions > 0 ? Math.round((st.totalFirstTry / st.totalQuestions) * 100) : null;
      totalRounds += st.rounds || 0;
      totalQuestions += st.totalQuestions || 0;
      totalFirstTry += st.totalFirstTry || 0;
      if ((st.rounds || 0) > 0) modesExplored++;
      return { meta: m, stat: st, acc };
    });

    const isTimedSprint = gameDef.gameType === 'timed-sprint';
    const sprintStats = gameSave.sprintStats || {};
    const grandModeId = gameDef.grandPrizeModeId || 'mix';
    const grandGoal = gameDef.grandPrizeGoalFacts || 100;
    const grandSprint = sprintStats[grandModeId] || { bestScore: 0, bestPacePerMin: 0 };
    const best5m = grandSprint.bestScore || 0;
    const best5mPace = grandSprint.bestPacePerMin || 0;
    const prizeUnlocked = gameDef.grandPrizeId ? isCompanionUnlocked(gameSave, gameDef.grandPrizeId) : false;

    const overallAcc = totalQuestions > 0 ? Math.round((totalFirstTry / totalQuestions) * 100) + '%' : '—';
    const unlockedCount = getUnlockedCompanions(gameSave, gameDef).length;

    let balanceCalloutHTML = '';
    if (totalRounds >= 3) {
      const sortedByRounds = modeSummaries.slice().sort((a, b) => (b.stat.rounds || 0) - (a.stat.rounds || 0));
      const top = sortedByRounds[0];
      const topShare = (top.stat.rounds || 0) / totalRounds;
      if (topShare >= 0.55) {
        const pct = Math.round(topShare * 100);
        const unplayed = modeSummaries.filter(x => (x.stat.rounds || 0) === 0);
        const suggestNote = unplayed.length > 0
          ? ` Unexplored quests: <strong>${unplayed.slice(0, 3).map(u => escapeHtml(u.meta.shortTitle)).join(', ')}</strong>.`
          : ' Mixing in other quests builds well-rounded fluency.';
        const targetModeId = unplayed.length > 0 ? unplayed[0].meta.id : 'mix';
        balanceCalloutHTML = `
          <div class="balance-callout">
            <span>⚖️ <strong>Practice Balance Note:</strong> ${pct}% of rounds (${top.stat.rounds} of ${totalRounds}) were played in <strong>${top.meta.icon} ${escapeHtml(top.meta.title)}</strong>.${suggestNote}</span>
            <button type="button" class="parent-small-btn" data-action="parent-start-mode" data-mode-id="${escapeHtml(targetModeId)}"${startModeDisabledAttr}>Try Another Quest →</button>
          </div>
        `;
      }
    }

    const goingWellModes = modeSummaries.filter(x =>
      ((x.stat.rounds || 0) >= 2 || (x.stat.totalQuestions || 0) >= 15) && x.acc !== null && x.acc >= 80
    );
    const skillList = Object.keys(gameSave.skillStats || {}).map(k => {
      const sk = gameSave.skillStats[k];
      const acc = sk && sk.attempts > 0 ? Math.round((sk.firstTry / sk.attempts) * 100) : 0;
      return Object.assign({ key: k, acc }, sk);
    });
    const goingWellSkills = skillList
      .filter(sk => sk.attempts >= 3 && (sk.firstTry / sk.attempts) >= 0.85)
      .sort((a, b) => b.acc - a.acc);

    const goingWellHTML = (goingWellModes.length === 0 && goingWellSkills.length === 0)
      ? '<p style="margin:0; font-size:0.86rem; color:var(--ink-500); font-weight:600;">No mastered quests yet — complete at least 2 rounds in a quest with 80%+ first-try accuracy (or 3+ attempts at 85%+ on a sub-skill) to highlight strengths here.</p>'
      : [
          ...goingWellModes.map(x => {
            const sp = sprintStats[x.meta.id] || { bestScore: 0, bestPacePerMin: 0 };
            const bestText = isTimedSprint
              ? `${x.stat.rounds} runs • Best ${sp.bestScore} (${sp.bestPacePerMin.toFixed(1)}/min)`
              : `${x.stat.rounds} rounds • Best ${x.stat.bestFirstTry}/10`;
            return `
            <div class="insight-item good">
              <span>${x.meta.icon} ${escapeHtml(x.meta.title)} <small style="color:var(--ink-500);">(${bestText})</small></span>
              <span class="acc-pill good">${x.acc}% 1st-try</span>
            </div>
          `;
          }),
          ...goingWellSkills.map(sk => `
            <div class="insight-item good">
              <span>✨ ${escapeHtml(sk.label)} <small style="color:var(--ink-500);">(${sk.firstTry}/${sk.attempts})</small></span>
              <span class="acc-pill good">${sk.acc}%</span>
            </div>
          `)
        ].join('');

    const unpracticedOrLight = modeSummaries.filter(x => (x.stat.rounds || 0) <= 1);
    const lowAccModes = modeSummaries
      .filter(x => (x.stat.rounds || 0) >= 1 && x.acc !== null && x.acc < 80)
      .sort((a, b) => a.acc - b.acc);
    const lowAccSkills = skillList
      .filter(sk => sk.attempts >= 2 && (sk.firstTry / sk.attempts) < 0.75)
      .sort((a, b) => a.acc - b.acc);

    const needsPracticeHTML = (unpracticedOrLight.length === 0 && lowAccModes.length === 0 && lowAccSkills.length === 0)
      ? `<p style="margin:0; font-size:0.86rem; color:var(--jade-700); font-weight:700;">🎉 All ${gameDef.allModesMeta.length} quests have been practiced 2+ rounds with 80%+ accuracy and no struggling sub-skills!</p>`
      : [
          ...lowAccModes.map(x => `
            <div class="insight-item alert">
              <span>${x.meta.icon} ${escapeHtml(x.meta.title)} <small style="color:var(--ink-500);">(${x.stat.rounds} ${x.stat.rounds === 1 ? 'round' : 'rounds'})</small></span>
              <span style="display:flex; align-items:center; gap:6px;">
                <span class="acc-pill low">${x.acc}% 1st-try</span>
                <button type="button" class="parent-small-btn" data-action="parent-start-mode" data-mode-id="${escapeHtml(x.meta.id)}"${startModeDisabledAttr}>Start →</button>
              </span>
            </div>
          `),
          ...lowAccSkills.map(sk => `
            <div class="insight-item alert">
              <span>🔎 ${escapeHtml(sk.label)} <small style="color:var(--ink-500);">(${sk.firstTry}/${sk.attempts} 1st-try)</small></span>
              <span class="acc-pill low">${sk.acc}%</span>
            </div>
          `),
          ...unpracticedOrLight.map(x => `
            <div class="insight-item warn">
              <span>${x.meta.icon} ${escapeHtml(x.meta.title)} <small style="color:var(--ink-500);">(${(x.stat.rounds || 0) === 0 ? 'Not yet practiced' : 'Only 1 round played'})</small></span>
              <button type="button" class="parent-small-btn" data-action="parent-start-mode" data-mode-id="${escapeHtml(x.meta.id)}"${startModeDisabledAttr}>Start →</button>
            </div>
          `)
        ].join('');

    const modeBreakdownHTML = modeSummaries.map(x => {
      const st = x.stat;
      const rounds = st.rounds || 0;
      const sharePct = totalRounds > 0 ? Math.round((rounds / totalRounds) * 100) : 0;
      const accLabel = x.acc === null ? '—' : `${x.acc}%`;
      const accCls = x.acc === null ? 'none' : (x.acc >= 80 ? 'good' : (x.acc >= 60 ? 'mid' : 'low'));

      let bestCell;
      let compCell;
      if (isTimedSprint) {
        const sp = sprintStats[x.meta.id] || { bestScore: 0, bestPacePerMin: 0 };
        bestCell = rounds > 0 ? `Best: ${sp.bestScore} (${sp.bestPacePerMin.toFixed(1)}/m)` : 'Best: —';
        compCell = x.meta.id === grandModeId
          ? `👑 Grand Prize (${prizeUnlocked ? 'Awakened ✓' : `${best5m}/${grandGoal}`})`
          : '🎯 Speed Training';
      } else {
        bestCell = `Best: ${rounds > 0 ? `${st.bestFirstTry}/10` : '—'}`;
        const mComps = getModeCompanions(gameDef, x.meta.id);
        const mUnl = mComps.filter(c => isCompanionUnlocked(gameSave, c.id)).length;
        const mBank = gameSave.modeBank[x.meta.id] || 0;
        compCell = mUnl < mComps.length
          ? `${gameDef.companionEmoji} ${mUnl}/${mComps.length} (${mBank}/10 ⭐)`
          : `${gameDef.companionEmoji} ${mComps.length}/${mComps.length} ✓`;
      }

      return `
        <div class="mode-table-row">
          <div><strong>${x.meta.icon} ${escapeHtml(x.meta.title)}</strong></div>
          <div>
            <div>${rounds} ${rounds === 1 ? 'round' : 'rounds'} <small style="color:var(--ink-500);">(${sharePct}%)</small></div>
            <div class="share-bar-track"><div class="share-bar-fill" style="width:${sharePct}%"></div></div>
          </div>
          <div>${bestCell}</div>
          <div><span class="acc-pill ${accCls}">Acc: ${accLabel}</span></div>
          <div style="font-size:0.8rem; color:var(--ink-700);">${compCell}</div>
          <div><button type="button" class="parent-small-btn" data-action="parent-start-mode" data-mode-id="${escapeHtml(x.meta.id)}"${startModeDisabledAttr}>Start →</button></div>
        </div>
      `;
    }).join('');

    let mistakesSectionHTML = '';
    if (gameSave.recentMistakes && gameSave.recentMistakes.length > 0) {
      const mistakeRows = gameSave.recentMistakes.map(m => {
        const meta = getModeMeta(gameDef, m.modeId);
        return `
          <div class="mistake-row">
            <div style="display:flex; justify-content:space-between; gap:8px; flex-wrap:wrap; margin-bottom:3px;">
              <span class="quest-pill">${meta.icon} ${escapeHtml(meta.shortTitle)} • ${escapeHtml(m.skillLabel || '')}</span>
              <span style="font-weight:800; color:var(--jade-700);">Answer: ${escapeHtml(m.correctText)}</span>
            </div>
            <div style="font-weight:600; color:var(--ink-900);">${escapeHtml(m.promptText)}</div>
          </div>
        `;
      }).join('');
      mistakesSectionHTML = `
        <div class="parent-section-card">
          <div class="parent-section-title">
            <span>📝 Recent Tricky Questions (${gameSave.recentMistakes.length})</span>
            <button type="button" class="parent-small-btn" data-action="parent-clear-mistakes">Clear Log</button>
          </div>
          <div class="mistake-log-list">${mistakeRows}</div>
        </div>
      `;
    }

    const legacyCount = gameDef.id === 'factors-and-multiples' && gameSave.v1LegacyStars >= 10
      ? Math.min(25, Math.floor(gameSave.v1LegacyStars / 10) + 1)
      : 0;

    const renderCompanionTile = (c) => {
      const isStarter = c.id === gameDef.starterId;
      const isUnl = isStarter || isCompanionUnlocked(gameSave, c.id);
      const mMeta = getModeMeta(gameDef, c.modeId);
      const btnHTML = isStarter
        ? `<button type="button" id="btn-parent-dragon-${escapeHtml(c.id)}" class="parent-toggle-btn is-unlocked" disabled style="opacity:0.85; cursor:default;">🌟 Starter (Unlocked)</button>`
        : `<button type="button" id="btn-parent-dragon-${escapeHtml(c.id)}" class="parent-toggle-btn ${isUnl ? 'is-unlocked' : 'is-locked'}" data-action="parent-toggle-companion" data-companion-id="${escapeHtml(c.id)}">${isUnl ? '🔓 Unlocked' : '🔒 Locked'}</button>`;
      return `
        <div class="parent-dragon-tile ${isUnl ? 'unlocked' : ''}">
          <div class="parent-dragon-thumb">
            <img src="${escapeHtml(c.image)}" alt="${escapeHtml(c.name)}" loading="lazy" />
          </div>
          <div style="font-weight:800; font-size:0.92rem; color:var(--ink-900);">#${c.orderNum} ${escapeHtml(c.name)}</div>
          <div class="dragon-badges-row">
            <span class="tribe-pill">${escapeHtml(c.tribe)}</span>
            <span class="quest-pill">${mMeta.icon} ${escapeHtml(mMeta.shortTitle)}</span>
          </div>
          ${btnHTML}
        </div>
      `;
    };

    let adminGridHTML = '';
    if (filteredCompanions.length === 0) {
      adminGridHTML = `<p style="margin:0; font-size:0.86rem; color:var(--ink-500); font-weight:600;">No ${escapeHtml(gameDef.companionNounPluralLower)} match this faction filter.</p>`;
    } else if (parentViewMode === 'order') {
      adminGridHTML = `<div class="parent-dragons-grid">${filteredCompanions.slice().sort((a, b) => a.orderNum - b.orderNum).map(renderCompanionTile).join('')}</div>`;
    } else {
      const groups = [{ id: 'starter', icon: '🌟', title: 'Starter Companion' }, ...gameDef.allModesMeta];
      adminGridHTML = groups.map(g => {
        const list = filterCompanionsByFaction(getModeCompanions(gameDef, g.id), parentFactionFilter);
        if (list.length === 0) return '';
        const unlockedInGroup = list.filter(c => c.id === gameDef.starterId || isCompanionUnlocked(gameSave, c.id)).length;
        return `
          <div style="margin-bottom:14px;">
            <h4 style="margin:0 0 8px; font-size:0.92rem; color:var(--jade-700);">${g.icon} ${escapeHtml(g.title)} (${unlockedInGroup}/${list.length})</h4>
            <div class="parent-dragons-grid">${list.map(renderCompanionTile).join('')}</div>
          </div>
        `;
      }).join('');
    }

    const devicePacksHTML = profileGames.map(g => {
      const enabled = isGamePackEnabled(deviceSettings, g.id);
      const gSave = getGameSave(family, activeProfile.id, g);
      const packStatText = g.gameType === 'timed-sprint'
        ? `🎯 ${gSave.totalSolved} Solved`
        : `⭐ ${gSave.stars} Stars`;
      return `
        <div class="parent-pack-tile ${enabled ? 'enabled' : 'disabled'}">
          <div class="parent-pack-owner">
            <div style="display:flex; align-items:center; gap:5px; flex-wrap:wrap;">
              <span class="tribe-pill">${escapeHtml(g.gradeLabel)}</span>
              ${g.authorCredit ? `<span class="author-credit-pill">✨ ${escapeHtml(g.authorCredit)}</span>` : ''}
            </div>
            <span class="parent-pack-stat">${packStatText}</span>
          </div>
          <div class="parent-pack-title">${g.companionEmoji} ${escapeHtml(g.title)}</div>
          <button
            type="button"
            id="btn-parent-pack-${escapeHtml(g.id)}"
            class="pack-switch-btn ${enabled ? 'is-on' : 'is-off'}"
            data-action="parent-toggle-game-pack"
            data-game-id="${escapeHtml(g.id)}"
            aria-pressed="${enabled ? 'true' : 'false'}"
          >
            <span class="pack-switch-track" aria-hidden="true"><span class="pack-switch-thumb"></span></span>
            <span class="pack-switch-text">
              <strong>${enabled ? 'Enabled' : 'Disabled'}</strong>
              <small>${enabled ? 'Tap to hide on device' : 'Tap to show on device'}</small>
            </span>
          </button>
        </div>
      `;
    }).join('');

    const factionFilterBarHTML = factions.length > 0 ? `
      <div class="parent-faction-filter-bar">
        <span class="parents-context-label">Filter by Faction:</span>
        <div id="parent-faction-filters" class="parent-faction-pills" role="group" aria-label="Filter by Faction">
          <button
            type="button"
            class="parent-small-btn ${parentFactionFilter === 'All' ? 'active' : ''}"
            data-action="parent-set-faction-filter"
            data-faction="All"
          >All (${gameDef.companions.length})</button>
          ${factions.map(faction => `
            <button
              type="button"
              class="parent-small-btn ${parentFactionFilter === faction ? 'active' : ''}"
              data-action="parent-set-faction-filter"
              data-faction="${escapeHtml(faction)}"
            >${escapeHtml(faction)} (${filterCompanionsByFaction(gameDef.companions, faction).length})</button>
          `).join('')}
        </div>
      </div>
    ` : '';

    const dragonsToolbarNote = parentFactionFilter !== 'All'
      ? `Showing ${filteredCompanions.length} of ${gameDef.companions.length} ${escapeHtml(gameDef.companionNounPluralLower)} in ${escapeHtml(parentFactionFilter)} — tap any card to lock or unlock.`
      : `Tap any ${escapeHtml(gameDef.companionNoun.toLowerCase())} below to lock or unlock it immediately.`;

    container.innerHTML = `
      <div class="parents-topbar">
        <div>
          <h2 style="margin:0; font-size:1.35rem;">📊 Parent Overview &amp; Settings</h2>
          <p style="margin:2px 0 0; font-size:0.88rem; color:var(--ink-700);">Back up your family save, pick a kid profile, and manage their device packs or game progress.</p>
        </div>
        <button type="button" id="btn-parent-lock-exit" class="primary-action-btn" style="padding:10px 18px; font-size:0.92rem;" data-action="parent-lock-exit">
          🔒 ${(showContextHeader || !isSelectedGameEnabled) ? 'Lock &amp; Back to Arcade' : 'Lock &amp; Back to Game'}
        </button>
      </div>

      <section id="parent-family-section" class="parent-zone-section">
        <div class="parent-section-card" id="parent-family-backup" style="margin-bottom:0;">
          <div class="parent-section-title" style="margin-bottom:4px;">
            <span>💾 Family Backup &amp; Restore</span>
          </div>
          <p style="margin:0 0 12px; font-size:0.84rem; color:var(--ink-700); font-weight:600;">Back up or restore saved progress for all kid profiles and game packs across devices.</p>
          ${backupStatusMsg ? `
            <div class="backup-status-banner ${backupStatusIsError ? 'err' : 'ok'}" style="margin-bottom:12px;">
              ${escapeHtml(backupStatusMsg)}
            </div>
          ` : ''}
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" class="secondary-action-btn" style="font-size:0.84rem; padding:9px 13px;" data-action="parent-download-json">⬇️ Download Backup (.json)</button>
            <label class="secondary-action-btn" style="font-size:0.84rem; padding:9px 13px; cursor:pointer; display:inline-flex; align-items:center;">
              ⬆️ Upload Backup (.json)
              <input id="parent-backup-file-input" type="file" accept=".json,application/json" style="display:none;" />
            </label>
            <button type="button" class="secondary-action-btn" style="font-size:0.84rem; padding:9px 13px;" data-action="parent-export-code">📋 Show / Copy Backup Code</button>
            <button type="button" class="secondary-action-btn" style="font-size:0.84rem; padding:9px 13px;" data-action="parent-import-code">📥 Paste &amp; Restore Code</button>
          </div>
          ${backupDrawerMode === 'export' ? `
            <div class="backup-code-drawer">
              <div style="font-size:0.85rem; font-weight:800; color:var(--ink-700);">Full Family Backup Code (no character limit — safe to copy):</div>
              <textarea id="parent-backup-textarea" class="backup-code-textarea" readonly aria-label="Exported Backup Code">${escapeHtml(backupExportValue)}</textarea>
              <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <button type="button" class="primary-action-btn" style="font-size:0.84rem; padding:8px 14px;" data-action="parent-select-copy-code">📋 Select &amp; Copy</button>
                <button type="button" class="secondary-action-btn" style="font-size:0.84rem; padding:8px 14px;" data-action="parent-close-backup-drawer">Close</button>
              </div>
            </div>
          ` : ''}
          ${backupDrawerMode === 'import' ? `
            <div class="backup-code-drawer">
              <div style="font-size:0.85rem; font-weight:800; color:var(--ink-700);">Paste a Family Backup Code, raw JSON, or legacy Wings of Math backup code below:</div>
              <textarea id="parent-backup-textarea" class="backup-code-textarea" placeholder="Paste full backup code here (eyJ...)" aria-label="Paste Backup Code"></textarea>
              <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <button type="button" class="primary-action-btn" style="font-size:0.84rem; padding:8px 14px;" data-action="parent-confirm-import-code">✅ Restore Progress Now</button>
                <button type="button" class="secondary-action-btn" style="font-size:0.84rem; padding:8px 14px;" data-action="parent-close-backup-drawer">Cancel</button>
              </div>
            </div>
          ` : ''}
        </div>
      </section>

      <section id="parent-kid-profile-section" class="parent-profile-zone">
        <div class="parent-profile-selector-header">
          <div style="margin-bottom:12px;">
            <h3>👤 Kid Profile</h3>
            <p>Select a child to manage their profile, active game packs on this device, and individual game progress.</p>
          </div>
          <div class="parent-profile-menu" role="tablist" aria-label="Select Kid Profile">
            ${family.profiles.map(p => {
              const pGames = getProfileGames(p.id);
              const pEnabledCount = pGames.filter(g => isGamePackEnabled(deviceSettings, g.id)).length;
              const isSelected = p.id === activeProfile.id;
              return `
                <button
                  type="button"
                  role="tab"
                  aria-selected="${isSelected ? 'true' : 'false'}"
                  class="parent-profile-tab ${isSelected ? 'active' : ''}"
                  data-action="parent-select-profile"
                  data-profile-id="${escapeHtml(p.id)}"
                >
                  <span>${escapeHtml(p.avatar)} ${escapeHtml(p.name)}</span>
                  <span class="profile-packs-badge ${pEnabledCount < pGames.length ? 'has-off' : ''}">${pEnabledCount}/${pGames.length} on</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <div class="parent-section-card" id="parent-kid-profiles">
          <h3 class="parent-section-title">✏️ ${escapeHtml(activeProfile.name)}’s Name &amp; Avatar</h3>
          <div class="parent-profile-editor">
            <span class="parents-context-label">Rename:</span>
            <input id="parent-profile-name-input" class="parent-name-input" type="text" maxlength="24" value="${escapeHtml(activeProfile.name)}" aria-label="Profile Name" />
            <button type="button" class="parent-small-btn" data-action="parent-save-profile-name">Save Name</button>
            <div style="display:flex; gap:4px; flex-wrap:wrap;">
              ${PROFILE_AVATAR_OPTIONS.map(av => `
                <button type="button" class="avatar-pick-btn ${activeProfile.avatar === av ? 'active' : ''}" data-action="parent-pick-avatar" data-avatar="${escapeHtml(av)}" title="Choose avatar">${av}</button>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="parent-section-card" id="parent-device-packs">
          <div class="parent-section-title">
            <span>📱 ${escapeHtml(activeProfile.name)}’s Game Packs on This Device</span>
            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
              <span class="acc-pill ${enabledProfilePackCount > 0 ? 'good' : 'low'}">${enabledProfilePackCount} / ${profileGames.length} Enabled</span>
              ${enabledProfilePackCount < profileGames.length ? `<button type="button" id="btn-parent-enable-profile-packs" class="parent-small-btn" data-action="parent-enable-profile-packs">Enable All for ${escapeHtml(activeProfile.name)}</button>` : ''}
              ${otherProfilesHaveDisabledPacks ? `<button type="button" id="btn-parent-enable-all-packs" class="parent-small-btn" data-action="parent-enable-all-packs">Enable All Arcade Packs (${totalEnabledPackCount}/${games.length})</button>` : ''}
            </div>
          </div>
          <p style="margin:0 0 12px; font-size:0.84rem; color:var(--ink-700); font-weight:600;">Saved on this browser/device only (not included in Family Backups). Turning a pack off hides it from ${escapeHtml(activeProfile.name)}’s Arcade shelf without deleting stars or companions.</p>
          <div class="parent-packs-grid">${devicePacksHTML}</div>
        </div>

        <section id="parent-game-pack-section" class="parent-game-pack-zone">
          <div class="parent-game-selector-header">
            <div style="margin-bottom:12px;">
              <h3>🎮 Selected Game Pack</h3>
              <p>Everything below applies to <strong>${escapeHtml(activeProfile.name)}</strong>’s <strong>${escapeHtml(gameDef.title)}</strong>.</p>
            </div>
            <div class="parent-game-menu" role="tablist" aria-label="Select Game Pack">
              ${profileGames.map(g => {
                const gEnabled = isGamePackEnabled(deviceSettings, g.id);
                const isSelected = g.id === gameDef.id;
                return `
                  <button
                    type="button"
                    role="tab"
                    aria-selected="${isSelected ? 'true' : 'false'}"
                    class="parent-game-tab ${isSelected ? 'active' : ''}"
                    data-action="parent-select-game"
                    data-game-id="${escapeHtml(g.id)}"
                  >
                    <span>${g.companionEmoji} ${escapeHtml(g.title)}</span>
                    ${gEnabled ? '' : '<span class="pack-off-pill">Off on Device</span>'}
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          ${!isSelectedGameEnabled ? `
            <div class="device-disabled-banner">
              <span>📵 <strong>${escapeHtml(gameDef.title)}</strong> is currently disabled on this device (saved progress is kept safe).</span>
              <button type="button" class="parent-small-btn" data-action="parent-toggle-game-pack" data-game-id="${escapeHtml(gameDef.id)}">Enable on This Device</button>
            </div>
          ` : ''}

          <div class="parents-kpi-grid">
            ${isTimedSprint ? `
              <div class="parents-kpi-card">
                <div class="parents-kpi-label">Facts Solved</div>
                <div class="parents-kpi-val">${gameSave.totalSolved}</div>
              </div>
              <div class="parents-kpi-card">
                <div class="parents-kpi-label">First-Try Accuracy</div>
                <div class="parents-kpi-val">${overallAcc}</div>
              </div>
              <div class="parents-kpi-card">
                <div class="parents-kpi-label">5-Min Best</div>
                <div class="parents-kpi-val">${best5m} / ${grandGoal}</div>
              </div>
              <div class="parents-kpi-card">
                <div class="parents-kpi-label">5-Min Best Pace</div>
                <div class="parents-kpi-val">${best5mPace.toFixed(1)} / min</div>
              </div>
            ` : `
              <div class="parents-kpi-card">
                <div class="parents-kpi-label">Puzzles Solved</div>
                <div class="parents-kpi-val">${gameSave.totalSolved}</div>
              </div>
              <div class="parents-kpi-card">
                <div class="parents-kpi-label">First-Try Accuracy</div>
                <div class="parents-kpi-val">${overallAcc}</div>
              </div>
              <div class="parents-kpi-card">
                <div class="parents-kpi-label">Quests Explored</div>
                <div class="parents-kpi-val">${modesExplored} / ${gameDef.allModesMeta.length}</div>
              </div>
              <div class="parents-kpi-card">
                <div class="parents-kpi-label">${escapeHtml(gameDef.companionNounPlural)} Unlocked</div>
                <div class="parents-kpi-val">${unlockedCount} / ${gameDef.companions.length}</div>
              </div>
            `}
          </div>

          ${balanceCalloutHTML}

          <div class="parent-insights-grid">
            <div class="parent-section-card" id="parent-going-well">
              <h3 class="parent-section-title">✅ Going Well</h3>
              ${goingWellHTML}
            </div>
            <div class="parent-section-card" id="parent-needs-practice">
              <h3 class="parent-section-title">🎯 Needs Practice</h3>
              ${needsPracticeHTML}
            </div>
          </div>

          <div class="parent-section-card" style="margin-top:18px;">
            <h3 class="parent-section-title">📚 All ${gameDef.allModesMeta.length} Puzzle Types Breakdown</h3>
            <div class="mode-table-list">${modeBreakdownHTML}</div>
          </div>

          ${mistakesSectionHTML}

          <div class="parent-section-card">
            <div class="parent-section-title">
              <span>${gameDef.companionEmoji} ${escapeHtml(gameDef.companionNoun)} Lock / Unlock Controls</span>
              <div style="display:flex; gap:6px; flex-wrap:wrap;">
                <button type="button" class="parent-small-btn ${parentViewMode === 'order' ? 'active' : ''}" data-action="parent-view-mode" data-mode="order">Original Order (#1–#${gameDef.companions.length})</button>
                <button type="button" class="parent-small-btn ${parentViewMode === 'mode' ? 'active' : ''}" data-action="parent-view-mode" data-mode="mode">By Puzzle Type</button>
              </div>
            </div>
            ${factionFilterBarHTML}
            <div class="parent-dragons-toolbar">
              <span style="font-size:0.84rem; color:var(--ink-700); font-weight:600;">${dragonsToolbarNote}</span>
              <div style="display:flex; gap:8px; flex-wrap:wrap;">
                ${legacyCount > 0 ? `<button type="button" id="btn-restore-legacy-unlocks" class="parent-small-btn" data-action="parent-restore-legacy">🕰️ Restore Pre-Update Unlocks (${legacyCount} Dragons)</button>` : ''}
                <button type="button" id="btn-parent-unlock-all" class="parent-small-btn" data-action="parent-unlock-all">Unlock All ${gameDef.companions.length}</button>
                <button type="button" id="btn-parent-lock-all" class="parent-small-btn" data-action="parent-lock-all">Lock All (Keep Starter)</button>
              </div>
            </div>
            ${adminGridHTML}
          </div>

          <div class="parent-section-card parent-reset-card">
            <div>
              <strong>🗑️ Reset ${escapeHtml(gameDef.title)} Progress</strong>
              <div style="font-size:0.83rem; color:var(--ink-700); font-weight:600; margin-top:2px;">Resets only ${escapeHtml(activeProfile.name)}’s stars, unlocked ${escapeHtml(gameDef.companionNounPluralLower)}, and stats in ${escapeHtml(gameDef.title)} back to 0.</div>
            </div>
            <button type="button" class="secondary-action-btn" style="font-size:0.84rem; padding:9px 14px; color:var(--ember-600); border-color:#FCA5A5;" data-action="parent-reset-game">
              🗑️ Reset ${escapeHtml(activeProfile.name)}’s ${escapeHtml(gameDef.title)}
            </button>
          </div>
        </section>
      </section>
    `;
  }

  function submitPin() {
    const input = document.getElementById('parent-pin-input');
    const entered = input ? input.value.trim() : '';
    if (entered === PARENT_PIN) {
      SFX.correct(true);
      parentUnlocked = true;
      parentPinError = '';
      if (input) input.value = '';
      return true;
    }
    SFX.oops();
    parentUnlocked = false;
    parentPinError = 'Incorrect passcode. Please try again.';
    if (input) {
      input.value = '';
      input.focus();
    }
    const errEl = document.getElementById('parent-pin-error');
    if (errEl) {
      errEl.textContent = parentPinError;
      errEl.classList.remove('hidden');
    }
    return false;
  }

  function handleAction(actionEl, rerenderFn) {
    const action = actionEl.dataset.action;
    if (!action) return false;
    const family = getFamilyState();
    const activeProfile = family.profiles.find(p => p.id === selectedProfileId) || family.profiles[0];
    const profileGames = getProfileGames(activeProfile.id);
    const gameDef = profileGames.find(g => g.id === selectedGameId) || profileGames[0];
    const gameSave = getGameSave(family, activeProfile.id, gameDef);

    switch (action) {
      case 'parent-pin-digit': {
        if (parentUnlocked) return true;
        SFX.tap();
        const input = document.getElementById('parent-pin-input');
        if (input && input.value.length < 6) {
          input.value += actionEl.dataset.digit;
          parentPinError = '';
          document.getElementById('parent-pin-error')?.classList.add('hidden');
        }
        return true;
      }
      case 'parent-pin-backspace': {
        if (parentUnlocked) return true;
        SFX.tap();
        const input = document.getElementById('parent-pin-input');
        if (input) input.value = input.value.slice(0, -1);
        return true;
      }
      case 'parent-pin-submit':
        if (submitPin()) rerenderFn();
        return true;
      case 'parent-lock-exit':
        parentUnlocked = false;
        parentPinError = '';
        onBackToGameOrArcade();
        return true;
      case 'parent-select-profile': {
        if (!parentUnlocked) return true;
        SFX.tap();
        selectedProfileId = actionEl.dataset.profileId;
        const nextOwned = getProfileGames(selectedProfileId);
        selectedGameId = nextOwned[0].id;
        parentFactionFilter = 'All';
        rerenderFn();
        return true;
      }
      case 'parent-save-profile-name': {
        if (!parentUnlocked) return true;
        const nameEl = document.getElementById('parent-profile-name-input');
        const nextName = nameEl ? nameEl.value.trim().slice(0, 24) : '';
        if (nextName) {
          SFX.correct(false);
          activeProfile.name = nextName;
          onSave();
          rerenderFn();
        }
        return true;
      }
      case 'parent-pick-avatar':
        if (!parentUnlocked) return true;
        SFX.tap();
        activeProfile.avatar = actionEl.dataset.avatar;
        onSave();
        rerenderFn();
        return true;
      case 'parent-select-game':
        if (!parentUnlocked) return true;
        SFX.tap();
        if (profileGames.some(g => g.id === actionEl.dataset.gameId)) {
          selectedGameId = actionEl.dataset.gameId;
          parentFactionFilter = 'All';
        }
        rerenderFn();
        return true;
      case 'parent-start-mode':
        if (!parentUnlocked) return true;
        if (!isGamePackEnabled(readDeviceSettings(), gameDef.id)) return true;
        onStartModeForProfile(activeProfile.id, gameDef.id, actionEl.dataset.modeId);
        return true;
      case 'parent-toggle-game-pack': {
        if (!parentUnlocked) return true;
        const targetGameId = actionEl.dataset.gameId;
        if (!games.some(g => g.id === targetGameId)) return true;
        SFX.tap();
        const currentSettings = readDeviceSettings();
        const nextEnabled = !isGamePackEnabled(currentSettings, targetGameId);
        const nextSettings = setGamePackEnabled(currentSettings, targetGameId, nextEnabled, games);
        writeDeviceSettings(nextSettings);
        persistDevice();
        rerenderFn();
        return true;
      }
      case 'parent-enable-profile-packs': {
        if (!parentUnlocked) return true;
        SFX.correct(false);
        let nextSettings = readDeviceSettings();
        profileGames.forEach(g => {
          nextSettings = setGamePackEnabled(nextSettings, g.id, true, games);
        });
        writeDeviceSettings(nextSettings);
        persistDevice();
        rerenderFn();
        return true;
      }
      case 'parent-enable-all-packs': {
        if (!parentUnlocked) return true;
        SFX.correct(false);
        writeDeviceSettings(createDefaultDeviceSettings());
        persistDevice();
        rerenderFn();
        return true;
      }
      case 'parent-set-faction-filter': {
        if (!parentUnlocked) return true;
        SFX.tap();
        const requested = actionEl.dataset.faction || 'All';
        const validFactions = getCompanionFactions(gameDef);
        parentFactionFilter = (requested === 'All' || validFactions.includes(requested)) ? requested : 'All';
        rerenderFn();
        return true;
      }
      case 'parent-view-mode':
        if (!parentUnlocked) return true;
        SFX.tap();
        parentViewMode = actionEl.dataset.mode === 'mode' ? 'mode' : 'order';
        rerenderFn();
        return true;
      case 'parent-toggle-companion': {
        if (!parentUnlocked) return true;
        const id = actionEl.dataset.companionId;
        if (id === gameDef.starterId) return true;
        SFX.tap();
        const idx = gameSave.unlockedDragons.indexOf(id);
        if (idx >= 0) {
          gameSave.unlockedDragons.splice(idx, 1);
          if (!gameSave.unlockedDragons.includes(gameDef.starterId)) {
            gameSave.unlockedDragons.unshift(gameDef.starterId);
          }
        } else {
          gameSave.unlockedDragons.push(id);
        }
        syncModeBanksAndBuddyAfterAdminEdit(gameSave, gameDef);
        onSave();
        rerenderFn();
        return true;
      }
      case 'parent-unlock-all':
        if (!parentUnlocked) return true;
        SFX.correct(false);
        gameSave.unlockedDragons = gameDef.companions.map(c => c.id);
        syncModeBanksAndBuddyAfterAdminEdit(gameSave, gameDef);
        onSave();
        rerenderFn();
        return true;
      case 'parent-lock-all':
        if (!parentUnlocked) return true;
        SFX.tap();
        gameSave.unlockedDragons = [gameDef.starterId];
        syncModeBanksAndBuddyAfterAdminEdit(gameSave, gameDef);
        onSave();
        rerenderFn();
        return true;
      case 'parent-restore-legacy': {
        if (!parentUnlocked || gameDef.id !== 'factors-and-multiples' || gameSave.v1LegacyStars < 10) return true;
        SFX.correct(true);
        const count = Math.min(25, Math.floor(gameSave.v1LegacyStars / 10) + 1);
        gameSave.unlockedDragons = gameDef.companions.slice(0, count).map(c => c.id);
        syncModeBanksAndBuddyAfterAdminEdit(gameSave, gameDef);
        onSave();
        rerenderFn();
        return true;
      }
      case 'parent-clear-mistakes':
        if (!parentUnlocked) return true;
        SFX.tap();
        gameSave.recentMistakes = [];
        onSave();
        rerenderFn();
        return true;
      case 'parent-download-json': {
        if (!parentUnlocked) return true;
        const json = JSON.stringify(family, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `math-arcade-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return true;
      }
      case 'parent-export-code': {
        if (!parentUnlocked) return true;
        SFX.tap();
        backupExportValue = encodeBackupCode(family);
        backupDrawerMode = 'export';
        backupStatusIsError = false;
        backupStatusMsg = 'Full backup code generated below.';
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(backupExportValue).then(() => {
            backupStatusMsg = '✅ Full backup code copied to clipboard!';
            rerenderFn();
          }).catch(() => {});
        }
        rerenderFn();
        const ta = document.getElementById('parent-backup-textarea');
        if (ta && ta.select) ta.select();
        return true;
      }
      case 'parent-select-copy-code': {
        if (!parentUnlocked) return true;
        SFX.tap();
        const ta = document.getElementById('parent-backup-textarea');
        if (ta && ta.select) {
          ta.focus();
          ta.select();
        }
        try {
          if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(backupExportValue);
          } else if (typeof document !== 'undefined' && document.execCommand) {
            document.execCommand('copy');
          }
          backupStatusIsError = false;
          backupStatusMsg = '✅ Backup code selected & copied!';
          rerenderFn();
        } catch (_) {}
        return true;
      }
      case 'parent-import-code': {
        if (!parentUnlocked) return true;
        SFX.tap();
        backupDrawerMode = 'import';
        backupStatusMsg = '';
        backupStatusIsError = false;
        rerenderFn();
        const ta = document.getElementById('parent-backup-textarea');
        if (ta && ta.focus) ta.focus();
        return true;
      }
      case 'parent-close-backup-drawer': {
        if (!parentUnlocked) return true;
        SFX.tap();
        backupDrawerMode = null;
        rerenderFn();
        return true;
      }
      case 'parent-confirm-import-code': {
        if (!parentUnlocked) return true;
        const ta = document.getElementById('parent-backup-textarea');
        const code = ta ? ta.value.trim() : '';
        if (!code) {
          SFX.oops();
          backupStatusIsError = true;
          backupStatusMsg = 'Please paste a backup code into the box first.';
          rerenderFn();
          return true;
        }
        try {
          const res = importBackupPayload(code, family, games, 'grade3');
          if (res.ok) {
            SFX.correct(true);
            setFamilyState(res.familyState);
            if (res.kind === 'legacy-factors') {
              selectedProfileId = 'grade3';
              selectedGameId = 'factors-and-multiples';
            }
            backupDrawerMode = null;
            backupStatusIsError = false;
            backupStatusMsg = res.kind === 'legacy-factors'
              ? (res.recoveredTruncated
                  ? '✅ Restored 3rd Grader’s Factors & Multiples progress (automatically recovered from browser-truncated legacy code)!'
                  : '✅ Legacy Wings of Math progress restored into Factors & Multiples!')
              : '✅ Full Family Math Arcade backup restored!';
            onSave();
            rerenderFn();
          } else {
            SFX.oops();
            backupStatusIsError = true;
            backupStatusMsg = 'Oops — that backup code did not look valid.';
            rerenderFn();
          }
        } catch (_) {
          SFX.oops();
          backupStatusIsError = true;
          backupStatusMsg = 'Oops — could not decode that backup code.';
          rerenderFn();
        }
        return true;
      }
      case 'parent-reset-game':
        if (!parentUnlocked) return true;
        if (confirm(`Reset ${activeProfile.name}’s stars, ${gameDef.companionNounPluralLower}, and stats in ${gameDef.title} back to 0?`)) {
          family.saves[activeProfile.id][gameDef.id] = createDefaultGameSave(gameDef);
          onSave();
          rerenderFn();
        }
        return true;
      default:
        return false;
    }
  }

  function handleInputEvent(target) {
    if (target && target.id === 'parent-pin-input') {
      target.value = target.value.replace(/\D/g, '').slice(0, 6);
    }
  }

  function handleChangeEvent(target, rerenderFn) {
    if (!parentUnlocked || !target || target.id !== 'parent-backup-file-input') return false;
    const file = target.files && target.files[0];
    if (!file) return true;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const res = importBackupPayload(String(reader.result || ''), getFamilyState(), games, 'grade3');
        if (res.ok) {
          setFamilyState(res.familyState);
          onSave();
          rerenderFn();
          alert('Backup file restored!');
        } else {
          alert('Oops — that backup file did not look valid.');
        }
      } catch (_) {
        alert('Oops — could not parse that backup file.');
      }
    };
    reader.readAsText(file);
    return true;
  }

  function handleKeyDown(e, rerenderFn) {
    if (e.target && e.target.id === 'parent-pin-input' && e.key === 'Enter') {
      e.preventDefault();
      if (submitPin()) rerenderFn();
      return true;
    }
    return false;
  }

  return {
    render,
    setContext: syncSelectionDefaults,
    isUnlocked: () => parentUnlocked,
    lock() {
      parentUnlocked = false;
      parentPinError = '';
      parentFactionFilter = 'All';
      backupDrawerMode = null;
      backupStatusMsg = '';
    },
    handleAction,
    handleInputEvent,
    handleChangeEvent,
    handleKeyDown
  };
}
