import { escapeHtml } from '../dom.js';
import { getActiveProfile, getGameSave, isGamePackEnabled, loadDeviceSettings } from '../storage.js';
import { getActiveBuddy, getUnlockedCompanions, isCompanionUnlocked } from '../progression.js';

export function renderArcadeView({ container, familyState, games, deviceSettings = null }) {
  if (!container) return;
  const activeProfile = getActiveProfile(familyState);
  const effectiveDeviceSettings = deviceSettings || loadDeviceSettings(games);
  const profileOwnedGames = games.filter(g => g.assignedProfileId === activeProfile.id);
  const assignedGames = profileOwnedGames.filter(g => isGamePackEnabled(effectiveDeviceSettings, g.id));

  const renderGameCard = (game) => {
    const save = getGameSave(familyState, activeProfile.id, game);
    const buddy = getActiveBuddy(save, game);
    const isTimedSprint = game.gameType === 'timed-sprint';
    const unlockedCount = getUnlockedCompanions(save, game).length;
    const totalCompanions = game.companions.length;

    let statsHTML = '';
    if (isTimedSprint) {
      const grandModeId = game.grandPrizeModeId || 'mix';
      const grandGoal = game.grandPrizeGoalFacts || 100;
      const best5m = (save.sprintStats && save.sprintStats[grandModeId] && save.sprintStats[grandModeId].bestScore) || 0;
      const prizeUnlocked = game.grandPrizeId ? isCompanionUnlocked(save, game.grandPrizeId) : false;
      statsHTML = `
        <span>🏆 Best 5m: ${best5m}/${grandGoal}</span>
        <span>${game.companionEmoji} ${prizeUnlocked ? 'Darkstalker Awakened!' : 'Grand Prize Locked'}</span>
        <span>🎯 ${save.totalSolved} Solved</span>
      `;
    } else {
      statsHTML = `
        <span>⭐ ${save.stars} Stars</span>
        <span>${game.companionEmoji} ${unlockedCount} / ${totalCompanions} ${escapeHtml(game.companionNounPlural)}</span>
        <span>🎯 ${save.totalSolved} Solved</span>
      `;
    }

    return `
      <button
        type="button"
        class="arcade-game-card featured"
        data-card-theme="${escapeHtml(game.theme)}"
        data-action="open-game"
        data-game-id="${escapeHtml(game.id)}"
      >
        <div class="arcade-game-top">
          <div class="arcade-buddy-thumb">
            <img src="${escapeHtml(buddy.image)}" alt="${escapeHtml(buddy.name)}" />
          </div>
          <div class="arcade-game-title-wrap">
            <div class="arcade-game-badges">
              <span class="tribe-pill">${escapeHtml(game.gradeLabel)}</span>
              ${game.authorCredit ? `<span class="author-credit-pill">✨ ${escapeHtml(game.authorCredit)}</span>` : ''}
            </div>
            <h3>${escapeHtml(game.title)}</h3>
            <p>${game.companionEmoji} Buddy: ${escapeHtml(buddy.name)}</p>
          </div>
        </div>
        <p class="arcade-game-desc">${escapeHtml(game.cardDescription)}</p>
        <div class="arcade-game-stats">
          ${statsHTML}
        </div>
        <div class="arcade-play-cta">
          <span>Open ${escapeHtml(game.title)}</span>
          <span>Play →</span>
        </div>
      </button>
    `;
  };

  container.innerHTML = `
    <header class="arcade-topbar">
      <div class="arcade-brand">
        <div class="arcade-logo-badge">🎓</div>
        <div>
          <h1>Family Math Arcade</h1>
          <p>Choose your profile and jump into your math adventure!</p>
        </div>
      </div>
      <div class="arcade-right-controls">
        <div class="profile-switcher" role="group" aria-label="Kid Profiles">
          ${familyState.profiles.map(p => `
            <button
              type="button"
              class="profile-pill ${p.id === activeProfile.id ? 'active' : ''}"
              data-action="select-profile"
              data-profile-id="${escapeHtml(p.id)}"
            >
              <span>${escapeHtml(p.avatar)}</span>
              <span>${escapeHtml(p.name)}</span>
            </button>
          `).join('')}
        </div>
        <button type="button" class="icon-pill-btn" data-action="toggle-sound">
          ${familyState.soundOn ? '🔊 Sound On' : '🔇 Muted'}
        </button>
        <button type="button" class="icon-pill-btn" data-action="open-arcade-parents">
          🔒 Parents
        </button>
      </div>
    </header>

    <section class="arcade-shelf">
      <div class="arcade-shelf-header">
        <h2 class="arcade-shelf-title">
          <span>${escapeHtml(activeProfile.avatar)} ${escapeHtml(activeProfile.name)}’s Math Quest</span>
          <span class="shelf-badge">Picked for You</span>
        </h2>
      </div>
      ${assignedGames.length > 0 ? `
        <div class="arcade-games-grid">
          ${assignedGames.map(renderGameCard).join('')}
        </div>
      ` : `
        <div class="arcade-empty-card">
          <div class="arcade-empty-icon" aria-hidden="true">📵</div>
          <h3>No game packs enabled on this device</h3>
          <p>Game packs for <strong>${escapeHtml(activeProfile.name)}</strong> are currently turned off on this device. A parent can re-enable them anytime in Parent Settings.</p>
          <button type="button" class="secondary-action-btn" data-action="open-arcade-parents">🔒 Open Parent Settings</button>
        </div>
      `}
    </section>
  `;
}
