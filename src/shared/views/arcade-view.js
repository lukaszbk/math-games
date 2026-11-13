import { escapeHtml } from '../dom.js';
import { getActiveProfile, getGameSave } from '../storage.js';
import { getActiveBuddy, getUnlockedCompanions } from '../progression.js';

export function renderArcadeView({ container, familyState, games }) {
  if (!container) return;
  const activeProfile = getActiveProfile(familyState);
  const assignedGames = games.filter(g => g.assignedProfileId === activeProfile.id);

  const renderGameCard = (game) => {
    const save = getGameSave(familyState, activeProfile.id, game);
    const buddy = getActiveBuddy(save, game);
    const unlockedCount = getUnlockedCompanions(save, game).length;
    const totalCompanions = game.companions.length;

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
            <span class="tribe-pill">${escapeHtml(game.gradeLabel)}</span>
            <h3>${escapeHtml(game.title)}</h3>
            <p>${game.companionEmoji} Buddy: ${escapeHtml(buddy.name)}</p>
          </div>
        </div>
        <p class="arcade-game-desc">${escapeHtml(game.cardDescription)}</p>
        <div class="arcade-game-stats">
          <span>⭐ ${save.stars} Stars</span>
          <span>${game.companionEmoji} ${unlockedCount} / ${totalCompanions} ${escapeHtml(game.companionNounPlural)}</span>
          <span>🎯 ${save.totalSolved} Solved</span>
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
      <div class="arcade-games-grid">
        ${assignedGames.map(renderGameCard).join('')}
      </div>
    </section>
  `;
}
