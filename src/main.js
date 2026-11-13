import { GAMES, getGameById } from './games/registry.js';
import { SFX, setSoundEnabled } from './shared/audio.js';
import {
  getActiveProfile,
  getGameSave,
  loadFamilyState,
  saveFamilyState
} from './shared/storage.js';
import { renderArcadeView } from './shared/views/arcade-view.js';
import { renderGameHubShell } from './shared/views/game-hub-view.js';
import { createArenaController } from './shared/views/arena-view.js';
import { createParentsController } from './shared/views/parents-view.js';

let familyState = loadFamilyState(GAMES);
setSoundEnabled(familyState.soundOn);

let currentGameId = GAMES[0].id;
let currentTab = 'play';
let activeSanctuaryFilter = 'All';

const shellEl = document.getElementById('shell-main');
const arenaEl = document.getElementById('arena-screen');
const confettiLayerEl = document.getElementById('confetti-layer');
const modalResultsEl = document.getElementById('modal-results');
const modalUnlockEl = document.getElementById('modal-unlock');
const modalDetailEl = document.getElementById('modal-dragon-detail');

function persistFamily() {
  saveFamilyState(familyState);
}

const VALID_GAME_TABS = new Set(['play', 'sanctuary', 'guide', 'parents']);

function parseRoute(hashStr) {
  const clean = String(hashStr || '').replace(/^#/, '');
  if (!clean || clean === '/') {
    return { screen: 'arcade' };
  }
  if (clean === '/parents') {
    return { screen: 'arcade-parents' };
  }
  const gameTabMatch = clean.match(/^\/game\/([^/]+)(?:\/([^/]+))?$/);
  if (gameTabMatch) {
    const g = getGameById(gameTabMatch[1]);
    if (!g) return { screen: 'arcade' };
    const tab = gameTabMatch[2] && VALID_GAME_TABS.has(gameTabMatch[2]) ? gameTabMatch[2] : 'play';
    return { screen: 'game', gameId: g.id, tab };
  }
  return { screen: 'arcade' };
}

function navigateHash(hash) {
  if (window.location.hash === hash) {
    renderRoute();
  } else {
    window.location.hash = hash;
  }
}

function getActiveContext() {
  const profile = getActiveProfile(familyState);
  const owned = GAMES.find(g => g.assignedProfileId === profile.id) || GAMES[0];
  const candidate = getGameById(currentGameId);
  const gameDef = (candidate && candidate.assignedProfileId === profile.id) ? candidate : owned;
  const gameSave = getGameSave(familyState, profile.id, gameDef);
  return { familyState, profile, gameDef, gameSave };
}

let arenaController = null;
let parentsController = null;

function renderCurrentView() {
  const route = parseRoute(window.location.hash);

  if (route.screen === 'arcade') {
    document.body.dataset.theme = 'parchment';
    document.title = 'Family Math Arcade';
    renderArcadeView({
      container: shellEl,
      familyState,
      games: GAMES
    });
    return;
  }

  if (route.screen === 'arcade-parents') {
    document.body.dataset.theme = 'parchment';
    document.title = 'Parents Dashboard — Family Math Arcade';
    parentsController.render(shellEl, {
      backLabel: '← Back to Family Arcade',
      showContextHeader: true
    });
    return;
  }

  // Game screen (enforcing per-profile ownership)
  const profile = getActiveProfile(familyState);
  const requestedGame = getGameById(route.gameId);
  if (!requestedGame || requestedGame.assignedProfileId !== profile.id) {
    window.location.hash = '#/';
    return;
  }

  currentGameId = requestedGame.id;
  const { gameDef, gameSave } = getActiveContext();
  document.body.dataset.theme = gameDef.theme || 'parchment';
  document.title = `${gameDef.title} — Family Math Arcade`;

  renderGameHubShell({
    container: shellEl,
    gameDef,
    gameSave,
    profile,
    soundOn: familyState.soundOn,
    currentTab,
    activeFilter: activeSanctuaryFilter
  });

  if (currentTab === 'parents') {
    const pMount = document.getElementById('tab-parents');
    parentsController.render(pMount, {
      backLabel: '← Back to Math Quests',
      showContextHeader: false
    });
  }
}

function renderRoute() {
  const route = parseRoute(window.location.hash);
  if (arenaController && arenaController.isActive()) {
    arenaController.resetRound();
  }
  shellEl.classList.remove('hidden');

  if (route.screen === 'game') {
    const profile = getActiveProfile(familyState);
    const requestedGame = getGameById(route.gameId);
    if (!requestedGame || requestedGame.assignedProfileId !== profile.id) {
      parentsController.lock();
      window.history.replaceState(null, '', '#/');
      document.body.dataset.theme = 'parchment';
      document.title = 'Family Math Arcade';
      renderArcadeView({ container: shellEl, familyState, games: GAMES });
      return;
    }

    if (route.gameId !== currentGameId) {
      activeSanctuaryFilter = 'All';
    }
    currentGameId = route.gameId;
    currentTab = route.tab || 'play';
    if (currentTab !== 'parents') {
      parentsController.lock();
    } else {
      parentsController.setContext(profile.id, currentGameId);
    }
  } else if (route.screen === 'arcade-parents') {
    const profile = getActiveProfile(familyState);
    const assignedGame = GAMES.find(g => g.assignedProfileId === profile.id) || GAMES[0];
    parentsController.setContext(profile.id, assignedGame.id);
  } else {
    parentsController.lock();
  }

  renderCurrentView();
}

arenaController = createArenaController({
  arenaEl,
  shellEl,
  confettiLayerEl,
  modalResultsEl,
  modalUnlockEl,
  modalDetailEl,
  getContext: getActiveContext,
  onSave: persistFamily,
  onRenderHub: renderCurrentView
});

parentsController = createParentsController({
  games: GAMES,
  getFamilyState: () => familyState,
  setFamilyState: (next) => {
    familyState = next;
    setSoundEnabled(familyState.soundOn);
  },
  onSave: persistFamily,
  onStartModeForProfile: (profileId, gameId, modeId) => {
    parentsController.lock();
    familyState.activeProfileId = profileId;
    currentGameId = gameId;
    currentTab = 'play';
    persistFamily();
    window.history.replaceState(null, '', `#/game/${gameId}`);
    renderCurrentView();
    arenaController.startRound(modeId);
  },
  onBackToGameOrArcade: () => {
    const route = parseRoute(window.location.hash);
    if (route.screen === 'arcade-parents') {
      navigateHash('#/');
    } else {
      currentTab = 'play';
      if (window.location.hash.endsWith('/parents')) {
        navigateHash(`#/game/${currentGameId}`);
      } else {
        renderCurrentView();
      }
    }
  }
});

function toggleSoundGlobal() {
  familyState.soundOn = !familyState.soundOn;
  setSoundEnabled(familyState.soundOn);
  GAMES.forEach(g => {
    familyState.profiles.forEach(p => {
      const save = getGameSave(familyState, p.id, g);
      save.soundOn = familyState.soundOn;
    });
  });
  persistFamily();
  if (familyState.soundOn) SFX.tap();
  if (arenaController.isActive()) {
    arenaController.updateArenaTopControls();
  } else {
    renderCurrentView();
  }
}

function handleDocumentClick(e) {
  if (e.target === modalDetailEl) {
    modalDetailEl.classList.add('hidden');
    return;
  }

  const actionEl = e.target.closest('[data-action]');
  if (!actionEl) return;

  const action = actionEl.dataset.action;

  if (arenaController.handleAction(actionEl)) return;
  if (parentsController.handleAction(actionEl, renderCurrentView)) return;

  switch (action) {
    case 'select-profile': {
      SFX.tap();
      const pid = actionEl.dataset.profileId;
      if (familyState.profiles.some(p => p.id === pid)) {
        familyState.activeProfileId = pid;
        persistFamily();
        renderCurrentView();
      }
      return;
    }
    case 'open-game': {
      SFX.tap();
      const gid = actionEl.dataset.gameId;
      const profile = getActiveProfile(familyState);
      const targetGame = getGameById(gid);
      if (!targetGame || targetGame.assignedProfileId !== profile.id) return;
      currentTab = 'play';
      activeSanctuaryFilter = 'All';
      navigateHash(`#/game/${gid}`);
      return;
    }
    case 'go-arcade':
      SFX.tap();
      parentsController.lock();
      navigateHash('#/');
      return;
    case 'open-arcade-parents':
      SFX.tap();
      navigateHash('#/parents');
      return;
    case 'toggle-sound':
      toggleSoundGlobal();
      return;
    case 'switch-tab': {
      SFX.tap();
      const nextTab = VALID_GAME_TABS.has(actionEl.dataset.tab) ? actionEl.dataset.tab : 'play';
      if (nextTab !== 'parents') {
        parentsController.lock();
      } else {
        const profile = getActiveProfile(familyState);
        parentsController.setContext(profile.id, currentGameId);
      }
      const targetHash = nextTab === 'play'
        ? `#/game/${currentGameId}`
        : `#/game/${currentGameId}/${nextTab}`;
      navigateHash(targetHash);
      return;
    }
    case 'start-round':
      parentsController.lock();
      currentTab = 'play';
      arenaController.startRound(actionEl.dataset.modeId);
      return;
    case 'set-sanctuary-filter':
      SFX.tap();
      activeSanctuaryFilter = actionEl.dataset.filter || 'All';
      renderCurrentView();
      return;
    case 'open-companion-detail':
      arenaController.openCompanionDetail(actionEl.dataset.companionId);
      return;
    case 'choose-study-buddy': {
      e.stopPropagation();
      const { gameDef, gameSave } = getActiveContext();
      const cid = actionEl.dataset.companionId;
      const comp = gameDef.companions.find(c => c.id === cid);
      if (comp && gameSave.unlockedDragons.includes(cid)) {
        SFX.correct(false);
        gameSave.activeBuddyId = cid;
        persistFamily();
        renderCurrentView();
      }
      return;
    }
    default:
      break;
  }
}

document.addEventListener('click', handleDocumentClick);

document.addEventListener('input', (e) => {
  parentsController.handleInputEvent(e.target);
});

document.addEventListener('change', (e) => {
  parentsController.handleChangeEvent(e.target, renderCurrentView);
});

window.addEventListener('keydown', (e) => {
  if (parentsController.handleKeyDown(e, renderCurrentView)) return;
  if (e.target && e.target.id === 'card-mode-mix' && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    arenaController.startRound('mix');
    return;
  }
  arenaController.handleKeyDown(e);
});

window.addEventListener('hashchange', renderRoute);

renderRoute();
