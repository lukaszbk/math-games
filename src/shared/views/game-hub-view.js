import { escapeHtml } from '../dom.js';
import {
  formatDurationClock,
  getActiveBuddy,
  getModeCompanions,
  getModeMeta,
  getNextCompanionSpotlight,
  getNextSequentialPrize,
  getTrainableCompanions,
  getUnlockedCompanions,
  isCompanionUnlocked,
  isSelectableBuddy
} from '../progression.js';

export function renderGameHubShell({ container, gameDef, gameSave, profile, soundOn, currentTab, activeFilter }) {
  if (!container) return;

  const isTimedSprint = gameDef.gameType === 'timed-sprint';
  const isSequential = gameDef.progressionType === 'sequential';
  const isWand = gameDef.unlockPodType === 'wand';
  const buddy = getActiveBuddy(gameSave, gameDef);
  const unlocked = getUnlockedCompanions(gameSave, gameDef);
  const sprintStats = gameSave.sprintStats || {};

  const grandModeId = gameDef.grandPrizeModeId || 'mix';
  const grandGoal = gameDef.grandPrizeGoalFacts || 100;
  const grandDurLabel = formatDurationClock(gameDef.grandPrizeDurationSec || 300);
  const grandStat = sprintStats[grandModeId] || { bestScore: 0, bestPacePerMin: 0 };
  const best5m = grandStat.bestScore || 0;
  const best5mPace = grandStat.bestPacePerMin || 0;
  const prizeUnlocked = gameDef.grandPrizeId ? isCompanionUnlocked(gameSave, gameDef.grandPrizeId) : false;
  const prizeComp = gameDef.companions.find(c => c.id === gameDef.grandPrizeId) || gameDef.companions[gameDef.companions.length - 1];

  const nextSequential = isSequential ? getNextSequentialPrize(gameSave, gameDef) : null;
  const seqBank = isSequential ? (gameSave.trainingBank || 0) : 0;
  const seqAllUnlocked = isSequential && !nextSequential && unlocked.length >= gameDef.companions.length;
  const spotlight = (isTimedSprint || isSequential) ? null : getNextCompanionSpotlight(gameSave, gameDef, null);

  let progressPct;
  let nextCaption;
  let peekImg;
  let peekVisualHTML = '';
  let peekAllUnlocked;
  let rightStatHTML;

  if (isTimedSprint) {
    progressPct = prizeUnlocked ? 100 : Math.min(100, Math.round((best5m / grandGoal) * 100));
    nextCaption = prizeUnlocked
      ? `👑 Grand Champion! Colossal ${prizeComp.name} Awakened!`
      : `${Math.max(0, grandGoal - best5m)} more facts in ${grandDurLabel} to awaken ${prizeComp.name}!`;
    peekImg = prizeComp.image;
    peekAllUnlocked = prizeUnlocked;
    rightStatHTML = `<span class="unlock-count-label">🏆 Best 5m: ${best5m}/${grandGoal} • ⚡ ${best5mPace.toFixed(1)}/min</span>`;
  } else if (isSequential) {
    progressPct = nextSequential ? (seqBank * 10) : 100;
    nextCaption = nextSequential
      ? `${10 - seqBank} more ⭐ with the Magic Wand to unlock ${nextSequential.name}!`
      : `👑 ${gameDef.victoryBannerText || `Every single ${gameDef.companionNoun.toLowerCase()} is unlocked!`}`;
    peekAllUnlocked = !nextSequential;
    if (nextSequential && typeof gameDef.renderLockedPeekHTML === 'function') {
      peekVisualHTML = gameDef.renderLockedPeekHTML(nextSequential);
    } else {
      const finalHero = gameDef.companions.find(c => c.isCat && c.id === '14_aria') || gameDef.companions[gameDef.companions.length - 1];
      peekImg = nextSequential ? nextSequential.image : finalHero.image;
    }
    rightStatHTML = `<span class="unlock-count-label">${gameDef.companionEmoji} <span id="stat-unlocked-count">${unlocked.length}</span> / <span id="stat-total-dragons">${gameDef.companions.length}</span> ${escapeHtml(gameDef.companionNounPlural)}</span>`;
  } else {
    progressPct = spotlight ? (spotlight.bank * 10) : 100;
    nextCaption = spotlight
      ? `${10 - spotlight.bank} more ⭐ in ${getModeMeta(gameDef, spotlight.modeId).shortTitle} to hatch ${spotlight.companion.name}!`
      : `🎉 Every single ${gameDef.companionNoun.toLowerCase()} is unlocked!`;
    peekImg = spotlight
      ? spotlight.companion.image
      : gameDef.companions[gameDef.companions.length - 1].image;
    peekAllUnlocked = !spotlight;
    rightStatHTML = `<span class="unlock-count-label">${gameDef.companionEmoji} <span id="stat-unlocked-count">${unlocked.length}</span> / <span id="stat-total-dragons">${gameDef.companions.length}</span> ${escapeHtml(gameDef.companionNounPlural)}</span>`;
  }

  // Daily Mix / Featured Banner meta
  const mixStat = gameSave.modeStats.mix || { rounds: 0, bestFirstTry: 0 };
  let mixMastered;
  let mixRecordText;
  let mixProgHTML;
  if (isTimedSprint) {
    mixMastered = prizeUnlocked || best5m >= grandGoal;
    mixRecordText = mixStat.rounds === 0
      ? 'New Challenge!'
      : `🏅 Best: ${best5m} facts (${best5mPace.toFixed(1)}/min) • ${mixStat.rounds} ${mixStat.rounds === 1 ? 'run' : 'runs'}`;
    mixProgHTML = prizeUnlocked
      ? `<span style="font-size:0.86rem; font-weight:800; color:#FDE68A;">👑 Colossal ${escapeHtml(prizeComp.name)} Awakened! ✨</span>`
      : `
        <span style="font-size:0.82rem; font-weight:800;">👑 Grand Prize: ${escapeHtml(prizeComp.name)}</span>
        <div class="mini-track"><div class="mini-fill" style="width:${Math.min(100, (best5m / grandGoal) * 100).toFixed(1)}%"></div></div>
        <span style="font-size:0.8rem; font-weight:700; color:rgba(255,255,255,0.92);">${best5m}/${grandGoal} facts in ${grandDurLabel}</span>
      `;
  } else if (isSequential) {
    mixMastered = mixStat.rounds > 0 && mixStat.bestFirstTry >= 9;
    mixRecordText = mixStat.rounds === 0
      ? 'New Quest!'
      : `🏅 Best: ${mixStat.bestFirstTry}/10 • ${mixStat.rounds} ${mixStat.rounds === 1 ? 'round' : 'rounds'}`;
    mixProgHTML = nextSequential
      ? `
        <span style="font-size:0.82rem; font-weight:800;">🪄 ${unlocked.length}/${gameDef.companions.length} Unlocked</span>
        <div class="mini-track"><div class="mini-fill" style="width:${seqBank * 10}%"></div></div>
        <span style="font-size:0.8rem; font-weight:700; color:rgba(255,255,255,0.92);">${seqBank}/10 ⭐ → ${escapeHtml(nextSequential.name)}</span>
      `
      : `
        <span style="font-size:0.86rem; font-weight:800; color:#FDE68A;">👑 ${escapeHtml(gameDef.victoryBannerText || 'All prizes unlocked!')} ✨</span>
      `;
  } else {
    mixMastered = mixStat.rounds > 0 && mixStat.bestFirstTry >= 9;
    mixRecordText = mixStat.rounds === 0
      ? 'New Quest!'
      : `🏅 Best: ${mixStat.bestFirstTry}/10 • ${mixStat.rounds} ${mixStat.rounds === 1 ? 'round' : 'rounds'}`;
    const mixCompanions = getModeCompanions(gameDef, 'mix');
    const mixUnl = mixCompanions.filter(c => isCompanionUnlocked(gameSave, c.id)).length;
    const mixNext = mixCompanions.find(c => !isCompanionUnlocked(gameSave, c.id));
    const mixBank = gameSave.modeBank.mix || 0;
    mixProgHTML = mixNext
      ? `
        <span style="font-size:0.82rem; font-weight:800;">${gameDef.companionEmoji} ${mixUnl}/${mixCompanions.length} ${escapeHtml(gameDef.companionNounPlural)}</span>
        <div class="mini-track"><div class="mini-fill" style="width:${mixBank * 10}%"></div></div>
        <span style="font-size:0.8rem; font-weight:700; color:rgba(255,255,255,0.92);">${mixBank}/10 ⭐ to hatch ${escapeHtml(mixNext.name)}</span>
      `
      : `
        <span style="font-size:0.84rem; font-weight:800; color:#FDE68A;">${gameDef.companionEmoji} ${mixCompanions.length}/${mixCompanions.length} ${escapeHtml(gameDef.companionNounPlural)} Hatched! ✨</span>
      `;
  }

  const modeCardsHTML = gameDef.modes.map(m => {
    const st = gameSave.modeStats[m.id] || { rounds: 0, bestFirstTry: 0 };
    if (isTimedSprint) {
      const stSprint = sprintStats[m.id] || { bestScore: 0, bestPacePerMin: 0 };
      const mTarget = m.targetFacts || 40;
      const mDur = m.durationSec || 120;
      const durLabel = formatDurationClock(mDur);
      const mastered = st.rounds > 0 && stSprint.bestScore >= mTarget;
      const recordText = st.rounds === 0
        ? 'New Sprint!'
        : `🏅 Best: ${stSprint.bestScore} (${stSprint.bestPacePerMin.toFixed(1)}/min)`;
      const fillPct = Math.min(100, Math.round((stSprint.bestScore / mTarget) * 100));
      const sprintBoxHTML = st.rounds > 0 && stSprint.bestPacePerMin > 0
        ? `
          <div class="mode-dragon-box ${mastered ? 'complete' : ''}">
            <div class="mode-dragon-row">
              <span>👻 Ghost: ${stSprint.bestPacePerMin.toFixed(1)}/min</span>
              <span>${stSprint.bestScore}/${mTarget} facts</span>
            </div>
            <div class="mini-track"><div class="mini-fill" style="width:${fillPct}%"></div></div>
          </div>
        `
        : `
          <div class="mode-dragon-box">
            <div class="mode-dragon-row">
              <span>🎯 Target: ${mTarget} in ${durLabel} (20/min)</span>
            </div>
          </div>
        `;

      return `
        <button type="button" id="card-mode-${escapeHtml(m.id)}" class="mode-card" data-action="start-round" data-mode-id="${escapeHtml(m.id)}">
          <div>
            <div class="mode-card-top">
              <div class="mode-icon-badge" style="background:${escapeHtml(m.iconBg)};">${m.icon}</div>
              <span class="mode-record-pill ${mastered ? 'mastered' : ''}">${recordText}</span>
            </div>
            <h3>${escapeHtml(m.title)}</h3>
            <p>${escapeHtml(m.desc)}</p>
            <div class="mode-vocab-tags">
              ${m.vocab.map(v => `<span class="vocab-chip">${escapeHtml(v)}</span>`).join('')}
            </div>
          </div>
          ${sprintBoxHTML}
          <div class="mode-play-footer">
            <span>${durLabel} Timed Sprint</span>
            <span>Start →</span>
          </div>
        </button>
      `;
    }

    const mastered = st.rounds > 0 && st.bestFirstTry >= 9;
    const recordText = st.rounds === 0
      ? 'New Quest!'
      : `🏅 Best: ${st.bestFirstTry}/10 • ${st.rounds} ${st.rounds === 1 ? 'round' : 'rounds'}`;

    let compProgressHTML;
    if (isSequential) {
      compProgressHTML = nextSequential
        ? `
          <div class="mode-dragon-box">
            <div class="mode-dragon-row">
              <span>🪄 Wand: ${unlocked.length}/${gameDef.companions.length}</span>
              <span>${seqBank}/10 ⭐ → ${escapeHtml(nextSequential.name)}</span>
            </div>
            <div class="mini-track"><div class="mini-fill" style="width:${seqBank * 10}%"></div></div>
          </div>
        `
        : `
          <div class="mode-dragon-box complete">
            <div class="mode-dragon-row">
              <span>👑 ${escapeHtml(gameDef.victoryBannerText || 'All prizes unlocked!')} ✨</span>
            </div>
          </div>
        `;
    } else {
      const modeComps = getModeCompanions(gameDef, m.id);
      const unlCount = modeComps.filter(c => isCompanionUnlocked(gameSave, c.id)).length;
      const nextComp = modeComps.find(c => !isCompanionUnlocked(gameSave, c.id));
      const bank = gameSave.modeBank[m.id] || 0;
      compProgressHTML = nextComp
        ? `
          <div class="mode-dragon-box">
            <div class="mode-dragon-row">
              <span>${gameDef.companionEmoji} ${unlCount}/${modeComps.length} ${escapeHtml(gameDef.companionNounPlural)}</span>
              <span>${bank}/10 ⭐ → ${escapeHtml(nextComp.name)}</span>
            </div>
            <div class="mini-track"><div class="mini-fill" style="width:${bank * 10}%"></div></div>
          </div>
        `
        : `
          <div class="mode-dragon-box complete">
            <div class="mode-dragon-row">
              <span>${gameDef.companionEmoji} ${modeComps.length}/${modeComps.length} ${escapeHtml(gameDef.companionNounPlural)} Hatched! ✨</span>
            </div>
          </div>
        `;
    }

    return `
      <button type="button" id="card-mode-${escapeHtml(m.id)}" class="mode-card" data-action="start-round" data-mode-id="${escapeHtml(m.id)}">
        <div>
          <div class="mode-card-top">
            <div class="mode-icon-badge" style="background:${escapeHtml(m.iconBg)};">${m.icon}</div>
            <span class="mode-record-pill ${mastered ? 'mastered' : ''}">${recordText}</span>
          </div>
          <h3>${escapeHtml(m.title)}</h3>
          <p>${escapeHtml(m.desc)}</p>
          <div class="mode-vocab-tags">
            ${m.vocab.map(v => `<span class="vocab-chip">${escapeHtml(v)}</span>`).join('')}
          </div>
        </div>
        ${compProgressHTML}
        <div class="mode-play-footer">
          <span>10-Puzzle Series</span>
          <span>Start →</span>
        </div>
      </button>
    `;
  }).join('');

  // Sanctuary HTML
  const filters = Array.isArray(gameDef.sanctuaryFilters) ? gameDef.sanctuaryFilters : ['All', 'Unlocked'];
  const filteredCompanions = gameDef.companions.filter(c => {
    const isUnl = isCompanionUnlocked(gameSave, c.id);
    if (filters.length === 0 || activeFilter === 'All') return true;
    if (activeFilter === 'Unlocked') return isUnl;
    return c.tribe.includes(activeFilter);
  });

  const colossalCompanions = filteredCompanions.filter(c => c.isColossal);
  const regularCompanions = filteredCompanions.filter(c => !c.isColossal);

  const colossalSectionHTML = colossalCompanions.map(c => {
    const isUnl = isCompanionUnlocked(gameSave, c.id);
    const isBuddy = gameSave.activeBuddyId === c.id && isUnl;
    const loreChipsHTML = Array.isArray(c.loreBadges)
      ? c.loreBadges.map(b => `<span class="colossal-lore-chip">${escapeHtml(b)}</span>`).join('')
      : `<span class="colossal-lore-chip">${escapeHtml(c.tribe)}</span>`;
    const pct5m = Math.min(100, Math.round((best5m / grandGoal) * 100));

    if (isUnl) {
      return `
        <article class="colossal-award-card unlocked ${isBuddy ? 'active-buddy' : ''}">
          <div class="colossal-visual-col">
            <button type="button" class="colossal-portrait-box clickable" data-action="open-companion-detail" data-companion-id="${escapeHtml(c.id)}">
              <img src="${escapeHtml(c.image)}" alt="${escapeHtml(c.name)}" />
            </button>
            <span class="colossal-scale-pill">🏔️ ${escapeHtml(c.scaleLabel || '3× Colossal Ancient Dragon')}</span>
          </div>
          <div class="colossal-info-col">
            <div class="colossal-lore-badges">${loreChipsHTML}</div>
            <h3 class="colossal-title">${escapeHtml(c.name)}</h3>
            <div class="colossal-champion-banner">👑 ${grandGoal}-FACT GRAND CHAMPION • Best: ${best5m} Facts (${best5mPace.toFixed(1)}/min)</div>
            <p class="colossal-bio">${escapeHtml(c.bio)}</p>
            <p class="colossal-quote">"${escapeHtml(c.quotes[0])}"</p>
            <div class="colossal-actions-row">
              <button type="button" class="colossal-secondary-btn" data-action="open-companion-detail" data-companion-id="${escapeHtml(c.id)}">🔍 View Giant Portrait</button>
              <button
                type="button"
                class="colossal-buddy-btn ${isBuddy ? 'selected' : ''}"
                data-action="choose-study-buddy"
                data-companion-id="${escapeHtml(c.id)}"
              >
                ${isBuddy ? '★ Active Study Buddy' : `🐉 Choose ${escapeHtml(c.name)} as Active Study Buddy`}
              </button>
            </div>
          </div>
        </article>
      `;
    }

    return `
      <article class="colossal-award-card locked">
        <div class="colossal-visual-col">
          <div class="colossal-portrait-box">
            <img src="${escapeHtml(c.image)}" alt="Locked ${escapeHtml(c.name)}" />
            <div class="colossal-lock-overlay">
              <span style="font-size:2.4rem;">🔒</span>
              <span class="colossal-lock-badge">Solve ${grandGoal}+ Facts in ≤ ${grandDurLabel}</span>
            </div>
          </div>
          <span class="colossal-scale-pill">🏔️ ${escapeHtml(c.scaleLabel || '3× Colossal Ancient Dragon')}</span>
        </div>
        <div class="colossal-info-col">
          <div class="colossal-lore-badges">${loreChipsHTML}</div>
          <h3 class="colossal-title">${escapeHtml(c.name)}</h3>
          <div class="colossal-progress-box">
            <div class="colossal-progress-stats">
              <span>🏆 Best 5-Minute Run: <strong>${best5m} / ${grandGoal}</strong> facts</span>
              <span>⚡ Best Pace: <strong>${best5mPace.toFixed(1)} / 20.0</strong> facts/min</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width:${pct5m}%"></div>
            </div>
          </div>
          <p class="colossal-bio">Reach <strong>${grandGoal}+ first-try multiplication facts in ${grandDurLabel}</strong> in the 5-Minute Challenge to awaken this colossal three-moon NightWing-IceWing legend and make him your Study Buddy!</p>
          <div class="colossal-actions-row">
            <button type="button" class="colossal-cta-btn" data-action="start-round" data-mode-id="${escapeHtml(grandModeId)}">⚡ Take the 5-Minute Challenge →</button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  const trainableLocked = isSequential
    ? getTrainableCompanions(gameDef).filter(x => !isCompanionUnlocked(gameSave, x.id))
    : [];

  const companionsGridHTML = regularCompanions.map(c => {
    const isUnl = isCompanionUnlocked(gameSave, c.id);
    const isBuddy = gameSave.activeBuddyId === c.id && isUnl;
    const modeMeta = getModeMeta(gameDef, c.modeId);
    const kindEmoji = c.kind === 'Cat' ? '🐱' : (c.kind === 'Power' ? '⚡' : (c.kind === 'Skill' ? '🥋' : (c.kind === 'Object / Person' ? '🤡' : '💎')));

    if (isUnl) {
      let actionBtnHTML;
      if (gameDef.onlyCatsAsBuddy) {
        if (isSelectableBuddy(gameSave, gameDef, c)) {
          actionBtnHTML = `
            <button
              type="button"
              class="buddy-select-btn ${isBuddy ? 'selected' : ''}"
              data-action="choose-study-buddy"
              data-companion-id="${escapeHtml(c.id)}"
            >
              ${isBuddy ? '★ Active Study Buddy' : 'Choose as Buddy'}
            </button>
          `;
        } else {
          const ownerCat = gameDef.companions.find(x => x.id === c.ownerCatId);
          const ownerUnlocked = ownerCat && isCompanionUnlocked(gameSave, ownerCat.id);
          const ownerIsBuddy = ownerUnlocked && gameSave.activeBuddyId === ownerCat.id;
          actionBtnHTML = ownerUnlocked
            ? `
              <button
                type="button"
                class="buddy-select-btn ${ownerIsBuddy ? 'selected' : ''}"
                data-action="choose-study-buddy"
                data-companion-id="${escapeHtml(ownerCat.id)}"
              >
                ${ownerIsBuddy ? `★ With ${escapeHtml(ownerCat.name)} (Active)` : `🐱 Train with ${escapeHtml(ownerCat.name)}`}
              </button>
            `
            : `<span class="quest-pill">For ${escapeHtml(c.ownerCatName || 'Crew')}</span>`;
        }
      } else {
        actionBtnHTML = `
          <button
            type="button"
            class="buddy-select-btn ${isBuddy ? 'selected' : ''}"
            data-action="choose-study-buddy"
            data-companion-id="${escapeHtml(c.id)}"
          >
            ${isBuddy ? '★ Active Study Buddy' : 'Choose as Buddy'}
          </button>
        `;
      }

      return `
        <div class="dragon-card unlocked ${isBuddy ? 'active-buddy' : ''}" data-action="open-companion-detail" data-companion-id="${escapeHtml(c.id)}">
          <div class="dragon-portrait-box">
            <img src="${escapeHtml(c.image)}" alt="${escapeHtml(c.name)}" loading="lazy" />
          </div>
          <div class="dragon-badges-row">
            <span class="tribe-pill">${escapeHtml(c.tribe)}</span>
            ${c.kind ? `<span class="prize-kind-pill">${kindEmoji} ${escapeHtml(c.kind)}</span>` : `<span class="quest-pill">${modeMeta.icon} ${escapeHtml(modeMeta.shortTitle)}</span>`}
          </div>
          <h3 class="dragon-name">${escapeHtml(c.name)}</h3>
          <p class="dragon-bio">${escapeHtml(c.bio)}</p>
          ${actionBtnHTML}
        </div>
      `;
    }

    const portraitVisualHTML = typeof gameDef.renderLockedCardVisualHTML === 'function'
      ? `
        <div class="dragon-portrait-box has-shadow-svg">
          ${gameDef.renderLockedCardVisualHTML(c)}
          <div class="lock-overlay shadow-overlay">
            <span class="lock-star-pill">${c.isCat ? '🐱 Cat Shadow' : (isWand ? `🪄 ${escapeHtml(c.kind || 'Prize')}` : `${modeMeta.icon} ${escapeHtml(modeMeta.shortTitle)}`)}</span>
          </div>
        </div>
      `
      : `
        <div class="dragon-portrait-box">
          <img src="${escapeHtml(c.image)}" alt="Locked Mystery ${escapeHtml(gameDef.companionNoun)}" loading="lazy" />
          <div class="lock-overlay">
            <span style="font-size:1.5rem;">🔒</span>
            <span class="lock-star-pill">${modeMeta.icon} ${escapeHtml(modeMeta.shortTitle)}</span>
          </div>
        </div>
      `;

    if (isSequential) {
      let lockedBioHTML;
      let targetModeId = c.modeId && c.modeId !== 'starter' ? c.modeId : 'mix';
      if (c.isAutoMilestone) {
        const prevName = c.id === '07_fang' ? 'Misty’s Crew' : 'Fang’s Pack';
        lockedBioHTML = `Unlock all of <strong>${prevName}</strong>’s training prizes to reveal this ${escapeHtml(c.kind || 'Cat')} shadow with the Magic Wand!`;
        targetModeId = 'mix';
      } else {
        const queueIndex = Math.max(0, trainableLocked.findIndex(x => x.id === c.id));
        const needed = queueIndex * 10 + (10 - seqBank);
        lockedBioHTML = `Earn <strong>${needed} more ⭐</strong> in any quest to wave the Magic Wand and unlock this ${escapeHtml(c.kind || 'prize')}${c.ownerCatName ? ` for ${escapeHtml(c.ownerCatName)}` : ''}!`;
      }
      return `
        <div class="dragon-card locked">
          ${portraitVisualHTML}
          <div class="dragon-badges-row">
            <span class="tribe-pill">${escapeHtml(c.tribe)}</span>
            ${c.kind ? `<span class="prize-kind-pill">${kindEmoji} ${escapeHtml(c.kind)}</span>` : ''}
          </div>
          <h3 class="dragon-name">${c.isCat ? '??? (Cat Shadow)' : '???'}</h3>
          <p class="dragon-bio">${lockedBioHTML}</p>
          <button type="button" class="locked-quest-btn" data-action="start-round" data-mode-id="${escapeHtml(targetModeId)}">Train Quest →</button>
        </div>
      `;
    }

    const lockedInMode = getModeCompanions(gameDef, c.modeId).filter(x => !isCompanionUnlocked(gameSave, x.id));
    const queueIndex = Math.max(0, lockedInMode.findIndex(x => x.id === c.id));
    const needed = queueIndex * 10 + (10 - (gameSave.modeBank[c.modeId] || 0));
    return `
      <div class="dragon-card locked">
        ${portraitVisualHTML}
        <div class="dragon-badges-row">
          <span class="tribe-pill">${escapeHtml(c.tribe)}</span>
          <span class="quest-pill">${modeMeta.icon} ${escapeHtml(modeMeta.shortTitle)}</span>
        </div>
        <h3 class="dragon-name">???</h3>
        <p class="dragon-bio">Earn <strong>${needed} more ⭐</strong> in ${escapeHtml(modeMeta.title)} to hatch this ${escapeHtml(c.tribe)} friend!</p>
        <button type="button" class="locked-quest-btn" data-action="start-round" data-mode-id="${escapeHtml(c.modeId)}">Play Quest →</button>
      </div>
    `;
  }).join('');

  const ctaLabel = escapeHtml(gameDef.mixMeta.ctaLabel || 'Play 10-Puzzle Series →');

  container.innerHTML = `
    <header class="hero-header">
      <div class="buddy-strip">
        <div id="header-buddy-avatar" class="buddy-avatar-wrap" data-action="switch-tab" data-tab="sanctuary" title="Tap to visit Sanctuary">
          <img id="header-buddy-img" src="${escapeHtml(buddy.image)}" alt="Active Study Buddy" />
        </div>
        <div class="buddy-meta">
          <div class="app-brand-row">
            <h1 class="app-title">${escapeHtml(gameDef.title)}</h1>
            ${gameDef.authorCredit ? `<span class="author-credit-pill">✨ ${escapeHtml(gameDef.authorCredit)}</span>` : ''}
            <span id="header-buddy-badge" class="tribe-pill">${escapeHtml(buddy.name)} • ${escapeHtml(buddy.tribe)}</span>
          </div>
          <p id="header-buddy-quote" class="buddy-quote">"${escapeHtml(buddy.quotes[0])}"</p>
        </div>
      </div>

      <div class="star-progress-panel">
        <div class="star-progress-main">
          <div class="star-stats-row">
            <span class="star-total-badge">⭐ <span id="stat-total-stars">${gameSave.stars}</span> Stars</span>
            ${rightStatHTML}
          </div>
          <div class="progress-track">
            <div id="stat-progress-fill" class="progress-fill" style="width:${progressPct}%"></div>
          </div>
          <div id="stat-next-caption" class="next-unlock-caption">${escapeHtml(nextCaption)}</div>
        </div>
        <div id="next-dragon-peek" class="next-dragon-peek ${peekAllUnlocked ? 'all-unlocked' : ''} ${peekVisualHTML ? 'has-shadow-svg' : ''}" data-action="switch-tab" data-tab="sanctuary" title="Next ${escapeHtml(gameDef.companionNoun)} to Unlock">
          ${peekVisualHTML || `<img id="next-dragon-img" src="${escapeHtml(peekImg)}" alt="Next mystery companion" />`}
          <span id="next-dragon-q" class="peek-q ${peekAllUnlocked ? 'hidden' : ''}">?</span>
        </div>
      </div>
    </header>

    <nav class="nav-bar" aria-label="Game Navigation">
      <div class="nav-tabs">
        <button type="button" class="nav-tab" data-action="go-arcade">← All Games</button>
        <button type="button" id="tab-btn-play" class="nav-tab ${currentTab === 'play' ? 'active' : ''}" data-action="switch-tab" data-tab="play">🎯 Math Quests</button>
        <button type="button" id="tab-btn-sanctuary" class="nav-tab ${currentTab === 'sanctuary' ? 'active' : ''}" data-action="switch-tab" data-tab="sanctuary">
          ${gameDef.sanctuaryTabLabel} <span id="tab-sanctuary-count">(${unlocked.length}/${gameDef.companions.length})</span>
        </button>
        <button type="button" id="tab-btn-guide" class="nav-tab ${currentTab === 'guide' ? 'active' : ''}" data-action="switch-tab" data-tab="guide">${gameDef.guideTabLabel}</button>
      </div>
      <div class="utility-btns">
        <span class="profile-chip-static">${escapeHtml(profile.avatar)} ${escapeHtml(profile.name)}</span>
        <button type="button" id="btn-sound-home" class="icon-pill-btn" data-action="toggle-sound">
          ${soundOn ? '🔊 Sound On' : '🔇 Muted'}
        </button>
        <button type="button" id="btn-parent-open" class="icon-pill-btn ${currentTab === 'parents' ? 'active' : ''}" data-action="switch-tab" data-tab="parents">🔒 Parents</button>
      </div>
    </nav>

    <main id="tab-play" class="${currentTab === 'play' ? '' : 'hidden'}">
      <div id="card-mode-mix" class="featured-mix-banner" data-action="start-round" data-mode-id="mix" role="button" tabindex="0">
        <div class="featured-mix-top">
          <div class="featured-mix-info">
            <h2>${gameDef.mixMeta.bannerTitle}</h2>
            <p>${gameDef.mixMeta.bannerDesc}</p>
          </div>
          <div class="start-cta-pill">${ctaLabel}</div>
        </div>
        <div class="featured-mix-meta-row">
          <span id="mix-record-pill" class="mix-record-pill ${mixMastered ? 'mastered' : ''}">${mixRecordText}</span>
          <div id="mix-dragon-progress" class="mix-dragon-progress">${mixProgHTML}</div>
        </div>
      </div>

      <div id="modes-grid" class="modes-grid">
        ${modeCardsHTML}
      </div>
    </main>

    <section id="tab-sanctuary" class="${currentTab === 'sanctuary' ? '' : 'hidden'}">
      <div class="sanctuary-header">
        <div>
          <h2 style="margin:0; font-size:1.3rem;">${gameDef.sanctuaryTitle}</h2>
          <p style="margin:3px 0 0; font-size:0.9rem; color:var(--ink-700);">${gameDef.sanctuarySubtitle}</p>
        </div>
        ${filters.length > 0 ? `
          <div id="sanctuary-filters" class="filter-pills">
            ${filters.map(f => `
              <button type="button" class="filter-pill ${activeFilter === f ? 'active' : ''}" data-action="set-sanctuary-filter" data-filter="${escapeHtml(f)}">${escapeHtml(f)}</button>
            `).join('')}
          </div>
        ` : ''}
      </div>
      ${typeof gameDef.renderSanctuaryOverviewHTML === 'function' ? gameDef.renderSanctuaryOverviewHTML(gameSave, gameDef) : ''}
      ${colossalSectionHTML}
      ${colossalCompanions.length > 0 && regularCompanions.length > 0 ? '<h3 class="sanctuary-subhead">🌟 Your Study Coach</h3>' : ''}
      <div id="dragons-grid" class="dragons-grid">
        ${companionsGridHTML}
      </div>
    </section>

    <section id="tab-guide" class="${currentTab === 'guide' ? '' : 'hidden'}">
      <div style="margin-bottom:14px;">
        <h2 style="margin:0; font-size:1.3rem;">${gameDef.guideTitle}</h2>
        <p style="margin:3px 0 0; font-size:0.9rem; color:var(--ink-700);">${gameDef.guideSubtitle}</p>
      </div>
      ${gameDef.guideHTML}
    </section>

    <section id="tab-parents" class="${currentTab === 'parents' ? '' : 'hidden'}"></section>
  `;
}
