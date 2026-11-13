import { escapeHtml } from '../dom.js';
import { SFX } from '../audio.js';
import {
  PARENT_PIN,
  PROFILE_AVATAR_OPTIONS,
  createDefaultGameSave,
  encodeBackupCode,
  getGameSave,
  importBackupPayload
} from '../storage.js';
import {
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
  onStartModeForProfile,
  onBackToGameOrArcade
}) {
  let parentUnlocked = false;
  let parentPinError = '';
  let parentViewMode = 'order'; // 'order' | 'mode'
  let selectedProfileId = 'grade3';
  let selectedGameId = 'factors-and-multiples';

  function getProfileGames(profileId) {
    const owned = games.filter(g => g.assignedProfileId === profileId);
    return owned.length > 0 ? owned : games;
  }

  function syncSelectionDefaults(preferredProfileId, preferredGameId) {
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
            <button type="button" class="parent-small-btn" data-action="parent-start-mode" data-mode-id="${escapeHtml(targetModeId)}">Try Another Quest →</button>
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
          ...goingWellModes.map(x => `
            <div class="insight-item good">
              <span>${x.meta.icon} ${escapeHtml(x.meta.title)} <small style="color:var(--ink-500);">(${x.stat.rounds} rounds • Best ${x.stat.bestFirstTry}/10)</small></span>
              <span class="acc-pill good">${x.acc}% 1st-try</span>
            </div>
          `),
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
      ? '<p style="margin:0; font-size:0.86rem; color:var(--jade-700); font-weight:700;">🎉 All 7 quests have been practiced 2+ rounds with 80%+ accuracy and no struggling sub-skills!</p>'
      : [
          ...lowAccModes.map(x => `
            <div class="insight-item alert">
              <span>${x.meta.icon} ${escapeHtml(x.meta.title)} <small style="color:var(--ink-500);">(${x.stat.rounds} ${x.stat.rounds === 1 ? 'round' : 'rounds'})</small></span>
              <span style="display:flex; align-items:center; gap:6px;">
                <span class="acc-pill low">${x.acc}% 1st-try</span>
                <button type="button" class="parent-small-btn" data-action="parent-start-mode" data-mode-id="${escapeHtml(x.meta.id)}">Start →</button>
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
              <button type="button" class="parent-small-btn" data-action="parent-start-mode" data-mode-id="${escapeHtml(x.meta.id)}">Start →</button>
            </div>
          `)
        ].join('');

    const modeBreakdownHTML = modeSummaries.map(x => {
      const st = x.stat;
      const rounds = st.rounds || 0;
      const sharePct = totalRounds > 0 ? Math.round((rounds / totalRounds) * 100) : 0;
      const accLabel = x.acc === null ? '—' : `${x.acc}%`;
      const accCls = x.acc === null ? 'none' : (x.acc >= 80 ? 'good' : (x.acc >= 60 ? 'mid' : 'low'));
      const mComps = getModeCompanions(gameDef, x.meta.id);
      const mUnl = mComps.filter(c => isCompanionUnlocked(gameSave, c.id)).length;
      const mBank = gameSave.modeBank[x.meta.id] || 0;
      const compCell = mUnl < mComps.length
        ? `${gameDef.companionEmoji} ${mUnl}/${mComps.length} (${mBank}/10 ⭐)`
        : `${gameDef.companionEmoji} ${mComps.length}/${mComps.length} ✓`;

      return `
        <div class="mode-table-row">
          <div><strong>${x.meta.icon} ${escapeHtml(x.meta.title)}</strong></div>
          <div>
            <div>${rounds} ${rounds === 1 ? 'round' : 'rounds'} <small style="color:var(--ink-500);">(${sharePct}%)</small></div>
            <div class="share-bar-track"><div class="share-bar-fill" style="width:${sharePct}%"></div></div>
          </div>
          <div>Best: ${rounds > 0 ? `${st.bestFirstTry}/10` : '—'}</div>
          <div><span class="acc-pill ${accCls}">Acc: ${accLabel}</span></div>
          <div style="font-size:0.8rem; color:var(--ink-700);">${compCell}</div>
          <div><button type="button" class="parent-small-btn" data-action="parent-start-mode" data-mode-id="${escapeHtml(x.meta.id)}">Start →</button></div>
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
    if (parentViewMode === 'order') {
      adminGridHTML = `<div class="parent-dragons-grid">${gameDef.companions.slice().sort((a, b) => a.orderNum - b.orderNum).map(renderCompanionTile).join('')}</div>`;
    } else {
      const groups = [{ id: 'starter', icon: '🌟', title: 'Starter Companion' }, ...gameDef.allModesMeta];
      adminGridHTML = groups.map(g => {
        const list = getModeCompanions(gameDef, g.id);
        return `
          <div style="margin-bottom:14px;">
            <h4 style="margin:0 0 8px; font-size:0.92rem; color:var(--jade-700);">${g.icon} ${escapeHtml(g.title)} (${list.filter(c => isCompanionUnlocked(gameSave, c.id)).length}/${list.length})</h4>
            <div class="parent-dragons-grid">${list.map(renderCompanionTile).join('')}</div>
          </div>
        `;
      }).join('');
    }

    container.innerHTML = `
      <div class="parents-topbar">
        <div>
          <h2 style="margin:0; font-size:1.35rem;">📊 Parent Overview &amp; Settings</h2>
          <p style="margin:2px 0 0; font-size:0.88rem; color:var(--ink-700);">Switch kid profiles, review math strengths, and manage unlocks or backups.</p>
        </div>
        <button type="button" id="btn-parent-lock-exit" class="primary-action-btn" style="padding:10px 18px; font-size:0.92rem;" data-action="parent-lock-exit">
          🔒 ${showContextHeader ? 'Lock &amp; Back to Arcade' : 'Lock &amp; Back to Game'}
        </button>
      </div>

      <div class="parents-context-bar">
        <div class="parents-context-group">
          <span class="parents-context-label">Kid Profile:</span>
          ${family.profiles.map(p => `
            <button type="button" class="parent-small-btn ${p.id === activeProfile.id ? 'active' : ''}" data-action="parent-select-profile" data-profile-id="${escapeHtml(p.id)}">
              ${escapeHtml(p.avatar)} ${escapeHtml(p.name)}
            </button>
          `).join('')}
        </div>
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
        <div class="parents-context-group">
          <span class="parents-context-label">Game:</span>
          ${profileGames.map(g => `
            <button type="button" class="parent-small-btn ${g.id === gameDef.id ? 'active' : ''}" data-action="parent-select-game" data-game-id="${escapeHtml(g.id)}">
              ${g.companionEmoji} ${escapeHtml(g.title)}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="parents-kpi-grid">
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
        <div class="parent-dragons-toolbar">
          <span style="font-size:0.84rem; color:var(--ink-700); font-weight:600;">Tap any ${escapeHtml(gameDef.companionNoun.toLowerCase())} below to lock or unlock it immediately.</span>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            ${legacyCount > 0 ? `<button type="button" id="btn-restore-legacy-unlocks" class="parent-small-btn" data-action="parent-restore-legacy">🕰️ Restore Pre-Update Unlocks (${legacyCount} Dragons)</button>` : ''}
            <button type="button" id="btn-parent-unlock-all" class="parent-small-btn" data-action="parent-unlock-all">Unlock All ${gameDef.companions.length}</button>
            <button type="button" id="btn-parent-lock-all" class="parent-small-btn" data-action="parent-lock-all">Lock All (Keep Starter)</button>
          </div>
        </div>
        ${adminGridHTML}
      </div>

      <div class="parent-section-card">
        <h3 class="parent-section-title">💾 Family Backup &amp; Reset</h3>
        <div class="parents-footer-actions">
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button type="button" class="secondary-action-btn" style="font-size:0.84rem; padding:9px 13px;" data-action="parent-download-json">⬇️ Download Backup (.json)</button>
            <label class="secondary-action-btn" style="font-size:0.84rem; padding:9px 13px; cursor:pointer; display:inline-flex; align-items:center;">
              ⬆️ Upload Backup (.json)
              <input id="parent-backup-file-input" type="file" accept=".json,application/json" style="display:none;" />
            </label>
            <button type="button" class="secondary-action-btn" style="font-size:0.84rem; padding:9px 13px;" data-action="parent-export-code">📋 Copy Backup Code</button>
            <button type="button" class="secondary-action-btn" style="font-size:0.84rem; padding:9px 13px;" data-action="parent-import-code">📥 Restore Backup Code</button>
          </div>
          <button type="button" class="secondary-action-btn" style="font-size:0.84rem; padding:9px 13px; color:var(--ember-600);" data-action="parent-reset-game">
            🗑️ Reset ${escapeHtml(activeProfile.name)}’s ${escapeHtml(gameDef.title)}
          </button>
        </div>
      </div>
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
        }
        rerenderFn();
        return true;
      case 'parent-start-mode':
        if (!parentUnlocked) return true;
        onStartModeForProfile(activeProfile.id, gameDef.id, actionEl.dataset.modeId);
        return true;
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
        try {
          const code = encodeBackupCode(family);
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(code)
              .then(() => alert('Family backup code copied to clipboard!'))
              .catch(() => prompt('Copy this backup code:', code));
          } else {
            prompt('Copy this backup code:', code);
          }
        } catch (_) {}
        return true;
      }
      case 'parent-import-code': {
        if (!parentUnlocked) return true;
        const code = prompt('Paste a Family Math Arcade backup code (or legacy Wings of Math backup code):');
        if (!code) return true;
        try {
          const res = importBackupPayload(code, family, games, 'grade3');
          if (res.ok) {
            setFamilyState(res.familyState);
            onSave();
            rerenderFn();
            alert(res.kind === 'legacy-factors'
              ? 'Legacy Wings of Math progress restored into Factors & Multiples!'
              : 'Family progress restored!');
          } else {
            alert('Oops — that backup code did not look valid.');
          }
        } catch (_) {
          alert('Oops — that backup code did not look valid.');
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
    lock() {
      parentUnlocked = false;
      parentPinError = '';
    },
    handleAction,
    handleInputEvent,
    handleChangeEvent,
    handleKeyDown
  };
}
