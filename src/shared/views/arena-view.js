import { pick } from '../math.js';
import { escapeHtml, launchConfetti, speakText, stopSpeaking } from '../dom.js';
import { SFX } from '../audio.js';
import {
  applyRoundCompletion,
  applySprintCompletion,
  computeSprintPaceTelemetry,
  formatDurationClock,
  getActiveBuddy,
  getModeCompanions,
  getModeMeta,
  getNextCompanionSpotlight,
  getNextSequentialPrize,
  getUnlockedCompanions,
  isCompanionUnlocked,
  resolveStudyBuddyId
} from '../progression.js';
import {
  createRoundState,
  formatCorrectAnswer,
  recordMistakeInSave,
  recordSkillAttemptInSave
} from '../round-engine.js';
import { renderHundredsChartDrawerHTML, renderSieveDrawerHTML, renderTenFrameDrawerHTML } from '../manipulatives.js';

export function createArenaController({
  arenaEl,
  shellEl,
  confettiLayerEl,
  modalResultsEl,
  modalUnlockEl,
  modalDetailEl,
  getContext,
  onSave,
  onRenderHub
}) {
  let roundState = null;
  let fluencyTimer = null;
  let sprintTimer = null;
  let pendingUnlocks = [];
  let lastFinishedMode = 'mix';
  let detailCompanionId = null;

  function stopFluencyTimer() {
    if (fluencyTimer) {
      clearInterval(fluencyTimer);
      fluencyTimer = null;
    }
  }

  function stopSprintTimer() {
    if (sprintTimer) {
      clearInterval(sprintTimer);
      sprintTimer = null;
    }
  }

  function renderSprintTopbarSkeleton() {
    const container = document.getElementById('progress-gems');
    if (!container || !roundState) return;
    container.innerHTML = `
      <div class="sprint-topbar-strip">
        <span id="sprint-clock-pill" class="sprint-clock-pill">⏱️ ${formatDurationClock(roundState.durationSec)}</span>
        <span id="sprint-score-pill" class="sprint-score-pill">✅ 0 / ${roundState.targetFacts}</span>
        <span id="sprint-rate-pill" class="sprint-rate-pill">⚡ 0.0/min</span>
      </div>
    `;
  }

  function tickSprintHud() {
    if (!roundState || !roundState.isTimedSprint) {
      stopSprintTimer();
      return;
    }

    const now = Date.now();
    const elapsedMs = now - roundState.startMs;
    const tel = computeSprintPaceTelemetry({
      correctSolved: roundState.correctSolved,
      elapsedMs,
      durationSec: roundState.durationSec,
      targetFacts: roundState.targetFacts,
      bestPacePerMin: roundState.prevBestPacePerMin,
      bestScore: roundState.prevBestScore
    });

    const clockEl = document.getElementById('sprint-clock-pill');
    if (clockEl) {
      clockEl.textContent = `⏱️ ${tel.formattedClock}`;
      clockEl.classList.toggle('low-time', tel.remainingMs <= 30000 && tel.remainingMs > 10000);
      clockEl.classList.toggle('critical-time', tel.remainingMs <= 10000);
    }

    const scoreEl = document.getElementById('sprint-score-pill');
    if (scoreEl) {
      scoreEl.textContent = roundState.correctSolved >= roundState.targetFacts
        ? `🏆 ${roundState.correctSolved} Solved!`
        : `✅ ${roundState.correctSolved} / ${roundState.targetFacts}`;
      scoreEl.classList.toggle('goal-met', roundState.correctSolved >= roundState.targetFacts);
    }

    const rateEl = document.getElementById('sprint-rate-pill');
    if (rateEl) {
      rateEl.textContent = `⚡ ${tel.livePacePerMin.toFixed(1)}/min`;
    }

    const youFill = document.getElementById('sprint-you-fill');
    if (youFill) {
      youFill.style.width = `${tel.youPct.toFixed(1)}%`;
      youFill.className = `sprint-you-fill state-${tel.targetState}`;
    }

    const targetMarker = document.getElementById('sprint-target-marker');
    if (targetMarker) {
      targetMarker.style.left = `${tel.targetPct.toFixed(1)}%`;
    }

    const ghostMarker = document.getElementById('sprint-ghost-marker');
    if (ghostMarker) {
      if (roundState.prevBestPacePerMin > 0) {
        ghostMarker.classList.remove('hidden');
        ghostMarker.style.left = `${tel.ghostPct.toFixed(1)}%`;
      } else {
        ghostMarker.classList.add('hidden');
      }
    }

    const targetStatus = document.getElementById('sprint-target-status');
    if (targetStatus) {
      targetStatus.textContent = tel.targetStatusText;
      targetStatus.className = `sprint-status-pill state-${tel.targetState}`;
    }

    const ghostLabel = document.getElementById('sprint-ghost-label');
    if (ghostLabel) {
      ghostLabel.textContent = roundState.prevBestPacePerMin > 0
        ? `👻 Best Pace: ${roundState.prevBestPacePerMin.toFixed(1)}/min (${roundState.prevBestScore} facts)`
        : '👻 First Run — Setting Your Ghost Pace!';
    }

    const ghostStatus = document.getElementById('sprint-ghost-status');
    if (ghostStatus) {
      ghostStatus.textContent = tel.ghostStatusText;
      ghostStatus.className = `sprint-status-pill ghost state-${tel.ghostState}`;
    }

    if (now >= roundState.endMs) {
      finishSprintRound();
    }
  }

  function startFluencyTimer(seconds) {
    stopFluencyTimer();
    const { gameSave } = getContext();
    const wrap = document.getElementById('fluency-bar-wrap');
    const fill = document.getElementById('fluency-bar-fill');
    if (!wrap || !fill) return;
    if (gameSave.pace === 'relaxed') {
      wrap.classList.add('hidden');
      return;
    }
    wrap.classList.remove('hidden');
    fill.style.width = '100%';
    const startMs = Date.now();
    const totalMs = seconds * 1000;
    roundState.withinFluency = true;

    fluencyTimer = setInterval(() => {
      if (!roundState) {
        stopFluencyTimer();
        return;
      }
      const elapsed = Date.now() - startMs;
      const pct = Math.max(0, 100 - (elapsed / totalMs) * 100);
      fill.style.width = pct.toFixed(1) + '%';
      if (pct <= 0) {
        roundState.withinFluency = false;
        stopFluencyTimer();
      }
    }, 80);
  }

  function updateArenaTopControls() {
    const { gameSave, familyState } = getContext();
    const paceBtn = document.getElementById('btn-pace-toggle');
    if (paceBtn) {
      paceBtn.classList.toggle('hidden', Boolean(roundState && roundState.isTimedSprint));
      if (gameSave.pace === 'brisk') {
        paceBtn.textContent = '⚡ Brisk';
        paceBtn.classList.remove('relaxed');
      } else {
        paceBtn.textContent = '🌿 Relaxed';
        paceBtn.classList.add('relaxed');
      }
    }
    const soundArenaBtn = document.getElementById('btn-sound-arena');
    if (soundArenaBtn) soundArenaBtn.textContent = familyState.soundOn ? '🔊' : '🔇';
  }

  function renderProgressGems() {
    if (roundState && roundState.isTimedSprint) return;
    const container = document.getElementById('progress-gems');
    if (!container || !roundState) return;
    container.innerHTML = roundState.results.map((res, idx) => {
      let cls = 'gem-dot';
      let label = String(idx + 1);
      if (res === 'perfect') { cls += ' perfect'; label = '★'; }
      else if (res === 'solved') { cls += ' solved'; label = '✓'; }
      else if (idx === roundState.index) { cls += ' current'; }
      return `<div class="${cls}">${label}</div>`;
    }).join('');
  }

  function setCoachLine(htmlText) {
    const { gameDef, gameSave } = getContext();
    const buddy = getActiveBuddy(gameSave, gameDef);
    const imgEl = document.getElementById('arena-coach-img');
    const speechEl = document.getElementById('arena-coach-speech');
    if (imgEl) imgEl.src = buddy.image;
    if (speechEl) speechEl.innerHTML = htmlText;
  }

  function getStepLabels(q) {
    return (q && q.slotLabels) || { a: 'Step 1 (Make 10)', b: 'Step 2 (Answer)' };
  }

  function renderInputPanel(q) {
    const panel = document.getElementById('input-panel');
    if (!panel) return;

    if (q.inputType === 'numpad' || q.inputType === 'quot_rem' || q.inputType === 'step_pair' || q.inputType === 'multi_slot') {
      if (
        roundState &&
        roundState.isTimedSprint &&
        q.inputType === 'numpad' &&
        panel.querySelector('.numpad-grid') &&
        !panel.querySelector('#btn-switch-qr')
      ) {
        return;
      }
      const isMultiSlot = q.inputType === 'multi_slot';
      const slots = isMultiSlot && Array.isArray(q.slots) ? q.slots : [];
      const isDual = q.inputType === 'quot_rem' || q.inputType === 'step_pair';
      const showSwitch = isDual || (isMultiSlot && slots.length > 1);
      let switchLabel = '';
      let switchAction = 'toggle-dual-slot';
      if (q.inputType === 'quot_rem') {
        switchLabel = 'Editing: Quotient → Tap for Remainder (R)';
      } else if (q.inputType === 'step_pair') {
        const labels = getStepLabels(q);
        switchLabel = `Editing: ${escapeHtml(labels.a)} → Tap for ${escapeHtml(labels.b)}`;
      } else if (isMultiSlot && slots.length > 1) {
        switchAction = 'cycle-multi-slot';
        switchLabel = `Editing: ${escapeHtml(slots[0].label)} • Tap Next Box ↻`;
      }
      const enterLabel = (isDual || (isMultiSlot && slots.length > 1)) ? 'Next ➔' : 'Check ✓';
      panel.innerHTML = `
        <div class="numpad-grid">
          ${showSwitch ? `<button type="button" id="btn-switch-qr" class="num-key key-switch" data-action="${switchAction}">${switchLabel}</button>` : ''}
          <button type="button" class="num-key" data-action="press-digit" data-digit="1">1</button>
          <button type="button" class="num-key" data-action="press-digit" data-digit="2">2</button>
          <button type="button" class="num-key" data-action="press-digit" data-digit="3">3</button>
          <button type="button" class="num-key" data-action="press-digit" data-digit="4">4</button>
          <button type="button" class="num-key" data-action="press-digit" data-digit="5">5</button>
          <button type="button" class="num-key" data-action="press-digit" data-digit="6">6</button>
          <button type="button" class="num-key" data-action="press-digit" data-digit="7">7</button>
          <button type="button" class="num-key" data-action="press-digit" data-digit="8">8</button>
          <button type="button" class="num-key" data-action="press-digit" data-digit="9">9</button>
          <button type="button" class="num-key key-back" data-action="press-backspace">⌫</button>
          <button type="button" class="num-key" data-action="press-digit" data-digit="0">0</button>
          <button type="button" id="btn-numpad-enter" class="num-key key-enter" data-action="press-enter">${enterLabel}</button>
        </div>
      `;
      return;
    }

    if (q.inputType === 'choice') {
      const twoCol = q.choices.length === 4 && q.choices.every(c => c.label.length <= 14);
      panel.innerHTML = `
        <div class="choices-stack ${twoCol ? 'two-col' : ''}">
          ${q.choices.map((c, idx) => `
            <button type="button" id="choice-btn-${idx}" class="choice-btn" data-action="submit-choice" data-index="${idx}">
              ${escapeHtml(c.label)}
              ${c.sub ? `<span class="choice-sub">${escapeHtml(c.sub)}</span>` : ''}
            </button>
          `).join('')}
        </div>
      `;
      return;
    }

    if (q.inputType === 'multiselect') {
      panel.innerHTML = `
        <div class="multi-chips-wrap">
          <div style="font-size:0.88rem; font-weight:800; color:var(--ink-700); text-align:center;">Tap each factor to highlight it in gold:</div>
          <div class="multi-chips-grid">
            ${q.choices.map(val => `
              <button type="button" id="mchip-${val}" class="chip-toggle" data-action="toggle-multi-chip" data-value="${val}">${val}</button>
            `).join('')}
          </div>
          <button type="button" class="submit-multi-btn" data-action="submit-multi-select">Check Selected Factors ✓</button>
        </div>
      `;
    }
  }

  function renderCurrentQuestion() {
    if (!roundState) return;
    const { gameDef, gameSave } = getContext();
    const q = roundState.questions[roundState.index];

    roundState.missedCurrent = false;
    roundState.usedPeekCurrent = false;
    roundState.lockedTransition = false;
    roundState.numBuf = '';
    roundState.qBuf = '';
    roundState.rBuf = '';
    roundState.aBuf = '';
    roundState.bBuf = '';
    roundState.slotBufs = {};
    roundState.lockedSlots = new Set();
    if (q.inputType === 'multi_slot' && Array.isArray(q.slots) && q.slots.length > 0) {
      q.slots.forEach(s => {
        roundState.slotBufs[s.id] = '';
      });
      roundState.activeSlot = q.slots[0].id;
    } else {
      roundState.activeSlot = q.inputType === 'step_pair' ? 'a' : 'q';
    }
    roundState.multiSelected = new Set();
    roundState.sieveOpen = false;
    roundState.sieveCrossed = new Set();
    roundState.chartOpen = false;
    roundState.chartSpotlight = null;
    roundState.tenFrameOpen = false;
    roundState.tenFrameCells = new Array(20).fill(0);

    stopSpeaking();
    renderProgressGems();
    const fb = document.getElementById('learning-feedback');
    if (fb) {
      fb.classList.add('hidden');
      fb.innerHTML = '';
    }

    const buddy = getActiveBuddy(gameSave, gameDef);
    const introQuote = pick(buddy.quotes);
    setCoachLine(`<strong>${escapeHtml(buddy.name)}:</strong> "${escapeHtml(introQuote)}"`);

    const helperButtons = [];
    if (q.helperText) {
      helperButtons.push('<button type="button" class="helper-toggle-btn" data-action="reveal-strategy-peek">💡 Strategy Peek</button>');
    }
    if (q.enableSieve) {
      helperButtons.push('<button type="button" class="helper-toggle-btn" data-action="toggle-sieve-grid">🔢 Toggle 1–100 Detective Grid</button>');
    }
    if (q.enableHundredsChart) {
      helperButtons.push(`<button type="button" class="helper-toggle-btn" data-action="toggle-hundreds-chart">🗺️ Peek at 1–${q.chartMax || 100} Chart</button>`);
    }
    if (q.enableTenFrame) {
      helperButtons.push('<button type="button" class="helper-toggle-btn" data-action="toggle-tenframe-drawer">🧮 Toggle 20-Frame Counters</button>');
    }

    const readBtnHTML = gameDef.enableReadAloud
      ? '<button type="button" class="read-aloud-btn" data-action="read-prompt">🔊 Read</button>'
      : '';

    const badgeText = roundState.isTimedSprint
      ? `${escapeHtml(q.topicLabel)} • Card #${roundState.attempted + 1}`
      : `${escapeHtml(q.topicLabel)} • Puzzle ${roundState.index + 1} of 10`;

    const stage = document.getElementById('question-stage');
    if (stage) {
      stage.innerHTML = `
        <div class="question-badge-row">
          <span class="question-topic-badge">${badgeText}</span>
          ${readBtnHTML}
        </div>
        <p class="question-prompt">${q.prompt}</p>
        ${q.stageHTML || ''}
        ${helperButtons.length ? `<div class="stage-helper-row">${helperButtons.join('')}</div>` : ''}
        <div id="helper-peek-box" class="helper-peek-box hidden"></div>
        <div id="sieve-container" class="hidden"></div>
        <div id="hundreds-chart-container" class="hidden"></div>
        <div id="tenframe-container" class="hidden"></div>
      `;
    }

    renderInputPanel(q);
    if (q.inputType === 'multi_slot') {
      syncMultiSlotDisplay();
    }
    if (!roundState.isTimedSprint) {
      startFluencyTimer(q.fluencySeconds || 16);
    }
  }

  function syncMultiSlotDisplay() {
    if (!roundState) return;
    const q = roundState.questions[roundState.index];
    if (!q || !Array.isArray(q.slots)) return;

    q.slots.forEach(s => {
      const el = document.getElementById(`mslot-${s.id}`);
      if (!el) return;
      const isLocked = roundState.lockedSlots.has(s.id);
      const buf = roundState.slotBufs[s.id] || '';
      const valEl = el.querySelector('.cross-slot-val') || el;
      valEl.textContent = buf === '' ? '?' : buf;
      el.classList.toggle('active', roundState.activeSlot === s.id && !isLocked);
      el.classList.toggle('slot-locked-ok', isLocked);
    });

    const unlocked = q.slots.filter(s => !roundState.lockedSlots.has(s.id));
    const sw = document.getElementById('btn-switch-qr');
    if (sw) {
      if (unlocked.length <= 1) {
        sw.classList.add('hidden');
      } else {
        sw.classList.remove('hidden');
        const activeMeta = q.slots.find(s => s.id === roundState.activeSlot) || unlocked[0];
        sw.textContent = `Editing: ${activeMeta.label} • Tap Next Box ↻`;
      }
    }

    const ent = document.getElementById('btn-numpad-enter');
    if (ent) {
      const allUnlockedFilled = unlocked.length > 0 && unlocked.every(s => (roundState.slotBufs[s.id] || '') !== '');
      ent.textContent = allUnlockedFilled ? 'Check ✓' : 'Next ➔';
    }
  }

  function syncDualDisplay() {
    if (!roundState) return;
    const q = roundState.questions[roundState.index];
    const sw = document.getElementById('btn-switch-qr');
    const ent = document.getElementById('btn-numpad-enter');

    if (q.inputType === 'step_pair') {
      const sa = document.getElementById('slot-a');
      const sb = document.getElementById('slot-b');
      if (!sa || !sb) return;
      sa.textContent = roundState.aBuf === '' ? '?' : roundState.aBuf;
      sb.textContent = roundState.bBuf === '' ? '?' : roundState.bBuf;
      sa.classList.toggle('active', roundState.activeSlot === 'a');
      sb.classList.toggle('active', roundState.activeSlot === 'b');
      const labels = getStepLabels(q);
      if (sw) {
        sw.textContent = roundState.activeSlot === 'a'
          ? `Editing: ${labels.a} → Tap for ${labels.b}`
          : `Editing: ${labels.b} → Tap for ${labels.a}`;
      }
      if (ent) {
        ent.textContent = (roundState.activeSlot === 'a' && roundState.bBuf === '') ? 'Next ➔' : 'Check ✓';
      }
      return;
    }

    const sq = document.getElementById('slot-q');
    const sr = document.getElementById('slot-r');
    if (!sq || !sr) return;
    sq.textContent = roundState.qBuf === '' ? '?' : roundState.qBuf;
    sr.textContent = roundState.rBuf === '' ? '?' : roundState.rBuf;
    sq.classList.toggle('active', roundState.activeSlot === 'q');
    sr.classList.toggle('active', roundState.activeSlot === 'r');
    if (sw) {
      sw.textContent = roundState.activeSlot === 'q'
        ? 'Editing: Quotient → Tap for Remainder (R)'
        : 'Editing: Remainder (R) → Tap for Quotient';
    }
    if (ent) {
      ent.textContent = (roundState.activeSlot === 'q' && roundState.rBuf === '') ? 'Next ➔' : 'Check ✓';
    }
  }

  function handleWrongAttempt(retryInstructionHTML) {
    stopFluencyTimer();
    const { gameDef, gameSave } = getContext();
    const q = roundState.questions[roundState.index];
    if (!roundState.missedCurrent && q) {
      if (roundState.isTimedSprint) roundState.attempted++;
      recordMistakeInSave(gameSave, roundState, q);
      onSave();
    }
    roundState.missedCurrent = true;
    SFX.oops();

    const box = document.getElementById('learning-feedback');
    if (box) {
      box.innerHTML = `
        <h4>💡 Let’s Look Together!</h4>
        <p>${q.explanationHTML}</p>
        <div class="retry-prompt">👉 ${retryInstructionHTML}</div>
      `;
      box.classList.remove('hidden');
    }

    const buddy = getActiveBuddy(gameSave, gameDef);
    if (roundState.isTimedSprint) {
      setCoachLine(`<strong>${escapeHtml(buddy.name)}:</strong> "Quick catch! Enter <strong>${q.answer}</strong> to lock it in and keep racing!"`);
    } else {
      setCoachLine(`<strong>${escapeHtml(buddy.name)}:</strong> "Ooh, tricky one! Check the golden clue below and enter the answer to lock it in!"`);
    }
  }

  function handleCorrectSolve() {
    stopFluencyTimer();
    const { gameDef, gameSave } = getContext();
    const firstTry = !roundState.missedCurrent;
    const q = roundState.questions[roundState.index];

    if (roundState.isTimedSprint) {
      if (firstTry) {
        roundState.correctSolved++;
        roundState.attempted++;
        if (
          roundState.correctSolved === roundState.targetFacts &&
          roundState.modeId === (gameDef.grandPrizeModeId || 'mix') &&
          !roundState.hundredthFactMs
        ) {
          roundState.hundredthFactMs = Date.now() - roundState.startMs;
          launchConfetti(confettiLayerEl, 28);
        }
      }
      roundState.withinFluency = firstTry;
      recordSkillAttemptInSave(gameSave, roundState, q, firstTry);
      onSave();
      SFX.correct(firstTry);

      roundState.questions[0] = roundState.deck.nextQuestion();
      roundState.index = 0;
      renderCurrentQuestion();
      tickSprintHud();

      const scorePill = document.getElementById('sprint-score-pill');
      if (scorePill) {
        scorePill.classList.remove('pulse');
        void scorePill.offsetWidth;
        scorePill.classList.add('pulse');
      }
      return;
    }

    roundState.lockedTransition = true;
    if (firstTry && roundState.withinFluency) roundState.fastCount++;

    recordSkillAttemptInSave(gameSave, roundState, q, firstTry);
    onSave();

    roundState.results[roundState.index] = firstTry ? 'perfect' : 'solved';
    renderProgressGems();
    SFX.correct(firstTry);

    const buddy = getActiveBuddy(gameSave, gameDef);
    if (firstTry) {
      setCoachLine(`<strong>${escapeHtml(buddy.name)}:</strong> "${roundState.withinFluency && gameSave.pace === 'brisk' ? '⚡ Lightning fast!!' : '★ Spot on — first try!!'}"`);
    } else {
      setCoachLine(`<strong>${escapeHtml(buddy.name)}:</strong> "Awesome — locked into memory! Onward!"`);
    }

    setTimeout(() => {
      if (!roundState) return;
      if (roundState.index < 9) {
        roundState.index++;
        renderCurrentQuestion();
      } else {
        finishRound();
      }
    }, firstTry ? 480 : 620);
  }

  function showNextUnlockModal() {
    const { gameDef, gameSave } = getContext();
    if (pendingUnlocks.length === 0) {
      modalResultsEl.classList.remove('hidden');
      return;
    }
    const companion = pendingUnlocks[0];
    const modeMeta = getModeMeta(gameDef, companion.modeId);
    const isColossal = Boolean(companion.isColossal);
    const isWand = gameDef.unlockPodType === 'wand';
    SFX.roundFanfare();

    const unlockCard = modalUnlockEl.querySelector('.modal-card');
    unlockCard?.classList.toggle('colossal-modal', isColossal);

    const milestoneEl = document.getElementById('unlock-milestone-kicker');
    if (milestoneEl) {
      if (isColossal) {
        milestoneEl.textContent = '👑 100 FACTS IN 5 MINUTES CONQUERED! 👑';
      } else if (isWand && companion.isAutoMilestone) {
        milestoneEl.textContent = '🌟 Full Crew Trained — Bonus Cat Awakens! 🌟';
      } else if (isWand) {
        milestoneEl.textContent = '🌟 10-Star Wand Milestone Reached! 🌟';
      } else {
        milestoneEl.textContent = '🌟 10-Star Milestone Reached! 🌟';
      }
    }
    const tapPromptEl = document.getElementById('unlock-tap-prompt');
    if (tapPromptEl) {
      if (isColossal) {
        tapPromptEl.textContent = '👆 Tap the ancient animus scroll to awaken King Darkstalker!';
      } else if (isWand) {
        tapPromptEl.textContent = companion.isCat
          ? '👆 Tap the glowing magic wand to reveal your new cat!'
          : '👆 Tap the glowing magic wand to cast your unlock spell!';
      } else {
        tapPromptEl.textContent = '👆 Tap the glowing egg to hatch your new friend!';
      }
    }

    document.getElementById('egg-tribe-hint').textContent = isColossal
      ? `${companion.scaleLabel || companion.tribe} • ${companion.tribe}`
      : (isWand
        ? `${companion.tribe} • ${companion.isAutoMilestone ? 'Auto-Unlocked!' : (companion.kind || modeMeta.title)}`
        : `${companion.tribe} • ${modeMeta.icon} ${modeMeta.title}`);
    document.getElementById('unlock-heading').textContent = isWand
      ? (companion.isCat ? '🪄 A Mystery Cat Shadow Appears!' : (gameDef.unlockHeading || '🪄 Wave the Magic Training Wand!'))
      : (gameDef.unlockHeading || `A ${gameDef.companionNoun} Egg Is Hatching!`);

    const podEl = document.getElementById('unlock-pod-emoji');
    if (podEl) {
      podEl.className = isWand ? 'magic-wand-pod' : 'dragon-egg-btn';
      if (isWand && typeof gameDef.renderUnlockPodHTML === 'function') {
        podEl.innerHTML = gameDef.renderUnlockPodHTML(companion);
      } else {
        podEl.textContent = gameDef.unlockPodEmoji || '✨';
      }
    }

    document.getElementById('unlock-reveal-kicker').textContent = isColossal
      ? '👑 Colossal Grand Champion Awakened! 👑'
      : (isWand
        ? (companion.isCat ? '✨ New Hero Cat Joined! ✨' : `✨ New ${companion.kind || 'Prize'} Unlocked! ✨`)
        : `✨ New ${gameDef.companionNoun} Unlocked! ✨`);
    document.getElementById('unlock-dragon-name').textContent = companion.name;
    document.getElementById('unlock-dragon-tribe').textContent = isColossal
      ? `${companion.scaleLabel || companion.tribe} • ${companion.tribe}`
      : (isWand ? `${companion.tribe}${companion.kind ? ` • ${companion.kind}` : ''}` : `${companion.tribe} • ${modeMeta.title}`);
    document.getElementById('unlock-dragon-img').src = companion.image;
    document.getElementById('unlock-dragon-bio').textContent = companion.bio;
    document.getElementById('unlock-dragon-quote').textContent = `"${companion.quotes[0]}"`;

    const extraBanner = document.getElementById('unlock-extra-banner');
    if (extraBanner) {
      const allDone = Boolean(
        gameDef.victoryBannerText &&
        pendingUnlocks.length === 1 &&
        getUnlockedCompanions(gameSave, gameDef).length >= gameDef.companions.length
      );
      const gift = companion.starterGiftId
        ? gameDef.companions.find(c => c.id === companion.starterGiftId)
        : null;
      if (allDone) {
        extraBanner.className = 'unlock-extra-banner is-victory';
        extraBanner.textContent = `👑 ${gameDef.victoryBannerText} 👑`;
      } else if (gift) {
        extraBanner.className = 'unlock-extra-banner';
        extraBanner.textContent = `🎁 Starting ${gift.kind || 'Power'} Unlocked Too: ${gift.name}!`;
      } else {
        extraBanner.className = 'unlock-extra-banner hidden';
        extraBanner.textContent = '';
      }
    }

    const makeBuddyBtn = document.getElementById('btn-unlock-make-buddy');
    if (makeBuddyBtn) {
      if (gameDef.onlyCatsAsBuddy) {
        makeBuddyBtn.textContent = companion.isCat
          ? `🐱 Make ${companion.name} My Study Buddy!`
          : `🐱 Train with ${companion.ownerCatName || 'Crew'}!`;
      } else {
        makeBuddyBtn.textContent = `${gameDef.companionEmoji} Make My Study Buddy!`;
      }
    }

    document.getElementById('unlock-egg-step').classList.remove('hidden');
    document.getElementById('unlock-reveal-step').classList.add('hidden');
    modalUnlockEl.classList.remove('hidden');
  }

  function finishSprintRound() {
    stopFluencyTimer();
    stopSprintTimer();
    stopSpeaking();
    if (!roundState) return;
    const { gameDef, gameSave } = getContext();
    const {
      modeId,
      correctSolved,
      attempted,
      durationSec,
      targetFacts,
      hundredthFactMs
    } = roundState;
    lastFinishedMode = modeId;

    const completion = applySprintCompletion({
      gameSave,
      gameDef,
      modeId,
      correctSolved,
      attempted,
      durationSec,
      hundredthFactMs
    });
    pendingUnlocks = completion.pendingUnlocks;
    onSave();

    arenaEl.classList.add('hidden');
    arenaEl.classList.remove('is-timed-sprint');
    document.getElementById('sprint-pace-hud')?.classList.add('hidden');
    document.getElementById('btn-pace-toggle')?.classList.remove('hidden');
    shellEl.classList.remove('hidden');
    onRenderHub();

    const modeMeta = getModeMeta(gameDef, modeId);
    const kickerEl = document.getElementById('results-kicker');
    if (kickerEl) kickerEl.textContent = `${modeMeta.shortTitle} Complete!`;

    let headline = 'Great Fluency Practice!';
    if (modeId === (gameDef.grandPrizeModeId || 'mix') && correctSolved >= targetFacts) {
      headline = '100+ Facts Conquered!! 👑';
    } else if (completion.isNewBestScore && correctSolved > 0) {
      headline = 'New Personal Best!! ⚡';
    } else if (completion.pacePerMin >= 20) {
      headline = 'Lightning Fluency Pace!';
    }
    document.getElementById('results-headline').textContent = headline;
    document.getElementById('results-stars-row').textContent = '⭐'.repeat(completion.starsEarned);

    const accPct = attempted > 0 ? Math.round((correctSolved / attempted) * 100) : 100;
    const ghostCompareText = completion.prevBestScore > 0
      ? (correctSolved > completion.prevBestScore
          ? `Beat ${completion.prevBestScore} (+${correctSolved - completion.prevBestScore}!)`
          : (correctSolved === completion.prevBestScore ? `Tied Best (${completion.prevBestScore})` : `${correctSolved} vs Best ${completion.prevBestScore}`))
      : `${correctSolved} (New Baseline!)`;

    const summaryRows = [
      { label: '✅ First-Try Facts Solved', val: `${correctSolved} / ${targetFacts} Goal` },
      { label: '⚡ Fluency Speed Pace', val: `${completion.pacePerMin.toFixed(1)} facts/min (Goal: 20.0)` },
      { label: '🎯 First-Try Accuracy', val: `${accPct}% (${correctSolved}/${attempted})` },
      { label: '👻 Personal Best Ghost', val: ghostCompareText }
    ];
    if (hundredthFactMs > 0) {
      summaryRows.push({
        label: '⏱️ 100th Fact Split Time',
        val: formatDurationClock(hundredthFactMs / 1000)
      });
    }

    document.getElementById('results-breakdown').innerHTML = [
      ...summaryRows.map(r => `<div class="breakdown-row"><span>${r.label}</span><span style="color:var(--jade-700);">${r.val}</span></div>`),
      ...completion.breakdown.map(b => `<div class="breakdown-row"><span>${b.label}</span><span style="color:var(--gold-700);">${b.val}</span></div>`),
      `<div class="breakdown-row" style="border-top:1px solid var(--border-warm); padding-top:6px; margin-top:4px;">
        <span>Total Stars Collected</span>
        <span style="color:var(--jade-700);">⭐ ${gameSave.stars} Stars</span>
      </div>`
    ].join('');

    const grandModeId = gameDef.grandPrizeModeId || 'mix';
    const grandGoal = gameDef.grandPrizeGoalFacts || 100;
    const best5m = (gameSave.sprintStats && gameSave.sprintStats[grandModeId] && gameSave.sprintStats[grandModeId].bestScore) || 0;
    const prizeUnlocked = gameDef.grandPrizeId && isCompanionUnlocked(gameSave, gameDef.grandPrizeId);
    const fillEl = document.getElementById('results-progress-fill');
    const capEl = document.getElementById('results-progress-caption');
    const suggestWrap = document.getElementById('results-suggest-wrap');

    if (prizeUnlocked) {
      fillEl.style.width = '100%';
      capEl.textContent = `👑 Colossal King Darkstalker Awakened! Best 5-Min Run: ${best5m} facts!`;
      suggestWrap.innerHTML = '';
    } else {
      fillEl.style.width = `${Math.min(100, (best5m / grandGoal) * 100).toFixed(1)}%`;
      const needed = Math.max(0, grandGoal - best5m);
      capEl.textContent = `Best 5-Min Run: ${best5m} / ${grandGoal} facts — ${needed} more in 5:00 to awaken Colossal King Darkstalker!`;
      suggestWrap.innerHTML = modeId !== grandModeId
        ? `<button type="button" id="btn-results-suggest-mode" class="suggest-mode-btn" data-action="play-suggested-mode" data-mode-id="${escapeHtml(grandModeId)}">⚡ Try the 5-Minute 100-Fact Challenge →</button>`
        : '';
    }

    const replayBtn = document.getElementById('btn-results-replay');
    if (replayBtn) replayBtn.textContent = '🔄 Run Again →';

    roundState = null;

    if (pendingUnlocks.length > 0) {
      showNextUnlockModal();
    } else {
      if (correctSolved >= targetFacts || completion.isNewBestScore) launchConfetti(confettiLayerEl, 26);
      SFX.roundFanfare();
      modalResultsEl.classList.remove('hidden');
    }
  }

  function finishRound() {
    stopFluencyTimer();
    stopSprintTimer();
    stopSpeaking();
    const { gameDef, gameSave } = getContext();
    const firstTryCount = roundState.results.filter(r => r === 'perfect').length;
    const modeId = roundState.modeId;
    lastFinishedMode = modeId;

    const completion = applyRoundCompletion({
      gameSave,
      gameDef,
      modeId,
      firstTryCount
    });
    pendingUnlocks = completion.pendingUnlocks;
    onSave();

    arenaEl.classList.add('hidden');
    arenaEl.classList.remove('is-timed-sprint');
    document.getElementById('sprint-pace-hud')?.classList.add('hidden');
    document.getElementById('btn-pace-toggle')?.classList.remove('hidden');
    shellEl.classList.remove('hidden');
    onRenderHub();

    const kickerEl = document.getElementById('results-kicker');
    if (kickerEl) kickerEl.textContent = '10-Puzzle Series Complete!';
    const replayBtn = document.getElementById('btn-results-replay');
    if (replayBtn) replayBtn.textContent = '🔄 Play Another 10 →';

    const headline = firstTryCount === 10
      ? `Flawless 10/10 ${gameDef.companionNoun} Master!!`
      : (firstTryCount >= 8 ? 'Super Sharp 10-Puzzle Run!' : '10 Puzzles Conquered!');
    document.getElementById('results-headline').textContent = headline;
    document.getElementById('results-stars-row').textContent = '⭐'.repeat(completion.starsEarned);

    document.getElementById('results-breakdown').innerHTML = completion.breakdown.map(b => `
      <div class="breakdown-row"><span>${b.label}</span><span style="color:var(--gold-700);">${b.val}</span></div>
    `).join('') + `
      <div class="breakdown-row" style="border-top:1px solid var(--border-warm); padding-top:6px; margin-top:4px;">
        <span>Total Stars Collected</span>
        <span style="color:var(--jade-700);">⭐ ${gameSave.stars} Stars</span>
      </div>
    `;

    const modeMeta = getModeMeta(gameDef, modeId);
    const fillEl = document.getElementById('results-progress-fill');
    const capEl = document.getElementById('results-progress-caption');
    const suggestWrap = document.getElementById('results-suggest-wrap');

    if (gameDef.progressionType === 'sequential') {
      const nextPrize = getNextSequentialPrize(gameSave, gameDef);
      if (nextPrize) {
        const bank = gameSave.trainingBank || 0;
        fillEl.style.width = (bank * 10) + '%';
        capEl.textContent = `${10 - bank} more ⭐ with the Magic Wand to unlock ${nextPrize.name}!`;
      } else {
        fillEl.style.width = '100%';
        capEl.textContent = `👑 ${gameDef.victoryBannerText || `All ${gameDef.companions.length} ${gameDef.companionNounPlural} Unlocked!`}`;
      }
      suggestWrap.innerHTML = '';
    } else {
      const nextInMode = getModeCompanions(gameDef, modeId).find(c => !isCompanionUnlocked(gameSave, c.id));
      if (nextInMode) {
        const bank = gameSave.modeBank[modeId] || 0;
        fillEl.style.width = (bank * 10) + '%';
        capEl.textContent = `${10 - bank} more ⭐ in ${modeMeta.shortTitle} to unlock ${nextInMode.name} (${nextInMode.tribe})!`;
        suggestWrap.innerHTML = '';
      } else {
        fillEl.style.width = '100%';
        const suggested = getNextCompanionSpotlight(gameSave, gameDef, modeId);
        if (suggested) {
          const sugMeta = getModeMeta(gameDef, suggested.modeId);
          capEl.textContent = `🎉 All ${gameDef.companionNounPluralLower} in ${modeMeta.title} unlocked!`;
          suggestWrap.innerHTML = `<button type="button" id="btn-results-suggest-mode" class="suggest-mode-btn" data-action="play-suggested-mode" data-mode-id="${escapeHtml(suggested.modeId)}">${gameDef.unlockPodType === 'wand' ? '🪄' : '🥚'} Unlock ${escapeHtml(gameDef.companionNounPlural)} in ${escapeHtml(sugMeta.shortTitle)} →</button>`;
        } else {
          capEl.textContent = `🎉 All ${gameDef.companions.length} ${gameDef.companionNounPlural} Unlocked!`;
          suggestWrap.innerHTML = '';
        }
      }
    }

    roundState = null;

    if (pendingUnlocks.length > 0) {
      showNextUnlockModal();
    } else {
      if (firstTryCount === 10) launchConfetti(confettiLayerEl, 26, gameDef.confettiSymbols);
      SFX.roundFanfare();
      modalResultsEl.classList.remove('hidden');
    }
  }

  function startRound(modeId) {
    SFX.tap();
    stopFluencyTimer();
    stopSprintTimer();
    const { gameDef, gameSave } = getContext();
    const isTimedSprint = gameDef.gameType === 'timed-sprint' && typeof gameDef.createSprintQuestionDeck === 'function';

    if (isTimedSprint) {
      const modeMeta = getModeMeta(gameDef, modeId);
      const durationSec = modeMeta.durationSec || 300;
      const targetFacts = modeMeta.targetFacts || 100;
      const deck = gameDef.createSprintQuestionDeck(modeId);
      const firstQ = deck.nextQuestion();
      const sprintStat = (gameSave.sprintStats && gameSave.sprintStats[modeId]) || { bestScore: 0, bestPacePerMin: 0 };
      const now = Date.now();

      roundState = Object.assign(createRoundState(modeId, [firstQ]), {
        isTimedSprint: true,
        deck,
        durationSec,
        targetFacts,
        startMs: now,
        endMs: now + durationSec * 1000,
        correctSolved: 0,
        attempted: 0,
        hundredthFactMs: 0,
        prevBestPacePerMin: sprintStat.bestPacePerMin || 0,
        prevBestScore: sprintStat.bestScore || 0
      });

      arenaEl.classList.add('is-timed-sprint');
      document.getElementById('fluency-bar-wrap')?.classList.add('hidden');
      document.getElementById('sprint-pace-hud')?.classList.remove('hidden');
      const targetLbl = document.getElementById('sprint-target-label');
      if (targetLbl) {
        const paceGoal = Math.round(targetFacts / (durationSec / 60));
        targetLbl.textContent = `🎯 ${targetFacts} Facts in ${formatDurationClock(durationSec)} (${paceGoal}/min Pace)`;
      }
      renderSprintTopbarSkeleton();
    } else {
      arenaEl.classList.remove('is-timed-sprint');
      document.getElementById('sprint-pace-hud')?.classList.add('hidden');
      const questions = gameDef.buildRoundQuestions(modeId);
      roundState = createRoundState(modeId, questions);
    }

    shellEl.classList.add('hidden');
    arenaEl.classList.remove('hidden');
    if (typeof document !== 'undefined' && document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
    updateArenaTopControls();
    renderCurrentQuestion();
    if (roundState.isTimedSprint) {
      tickSprintHud();
      sprintTimer = setInterval(tickSprintHud, 100);
    }
  }

  function exitArena() {
    SFX.tap();
    stopFluencyTimer();
    stopSprintTimer();
    stopSpeaking();
    roundState = null;
    arenaEl.classList.add('hidden');
    arenaEl.classList.remove('is-timed-sprint');
    document.getElementById('sprint-pace-hud')?.classList.add('hidden');
    document.getElementById('btn-pace-toggle')?.classList.remove('hidden');
    shellEl.classList.remove('hidden');
    onRenderHub();
  }

  function togglePace() {
    SFX.tap();
    const { gameSave } = getContext();
    gameSave.pace = gameSave.pace === 'brisk' ? 'relaxed' : 'brisk';
    onSave();
    updateArenaTopControls();
    if (roundState) {
      const q = roundState.questions[roundState.index];
      if (gameSave.pace === 'relaxed') {
        stopFluencyTimer();
        document.getElementById('fluency-bar-wrap')?.classList.add('hidden');
      } else if (!roundState.missedCurrent) {
        startFluencyTimer(q.fluencySeconds || 16);
      }
    }
  }

  const SPATIAL_MOVES = {
    top:    { ArrowDown: ['center', 'bottom'], ArrowLeft: ['left'], ArrowRight: ['right'] },
    center: { ArrowUp: ['top'], ArrowDown: ['bottom'], ArrowLeft: ['left'], ArrowRight: ['right'] },
    bottom: { ArrowUp: ['center', 'top'], ArrowLeft: ['left'], ArrowRight: ['right'] },
    left:   { ArrowUp: ['top'], ArrowDown: ['bottom'], ArrowRight: ['center', 'right'] },
    right:  { ArrowUp: ['top'], ArrowDown: ['bottom'], ArrowLeft: ['center', 'left'] }
  };

  function pressDigit(d) {
    if (!roundState || roundState.lockedTransition) return;
    const q = roundState.questions[roundState.index];
    SFX.tap();

    if (q.inputType === 'numpad') {
      if (roundState.numBuf.length >= 3) return;
      roundState.numBuf = roundState.numBuf === '0' ? d : roundState.numBuf + d;
      const slot = document.getElementById('slot-main');
      if (slot) (slot.querySelector('.cross-slot-val') || slot).textContent = roundState.numBuf;
    } else if (q.inputType === 'quot_rem') {
      if (roundState.activeSlot === 'q') {
        if (roundState.qBuf.length >= 2) return;
        roundState.qBuf = roundState.qBuf === '0' ? d : roundState.qBuf + d;
      } else {
        if (roundState.rBuf.length >= 2) return;
        roundState.rBuf = roundState.rBuf === '0' ? d : roundState.rBuf + d;
      }
      syncDualDisplay();
    } else if (q.inputType === 'step_pair') {
      if (roundState.activeSlot === 'a') {
        if (roundState.aBuf.length >= 2) return;
        roundState.aBuf = roundState.aBuf === '0' ? d : roundState.aBuf + d;
      } else {
        if (roundState.bBuf.length >= 2) return;
        roundState.bBuf = roundState.bBuf === '0' ? d : roundState.bBuf + d;
      }
      syncDualDisplay();
    } else if (q.inputType === 'multi_slot') {
      const sid = roundState.activeSlot;
      if (!sid || roundState.lockedSlots.has(sid)) return;
      const slotMeta = (q.slots || []).find(s => s.id === sid);
      const maxDigits = (slotMeta && slotMeta.maxDigits) || 3;
      const cur = roundState.slotBufs[sid] || '';
      if (cur.length >= maxDigits) return;
      roundState.slotBufs[sid] = cur === '0' ? d : cur + d;
      syncMultiSlotDisplay();
    }
  }

  function pressBackspace() {
    if (!roundState || roundState.lockedTransition) return;
    const q = roundState.questions[roundState.index];
    SFX.tap();

    if (q.inputType === 'numpad') {
      roundState.numBuf = roundState.numBuf.slice(0, -1);
      const slot = document.getElementById('slot-main');
      if (slot) (slot.querySelector('.cross-slot-val') || slot).textContent = roundState.numBuf === '' ? '?' : roundState.numBuf;
    } else if (q.inputType === 'quot_rem') {
      if (roundState.activeSlot === 'r' && roundState.rBuf === '') {
        roundState.activeSlot = 'q';
      }
      if (roundState.activeSlot === 'q') {
        roundState.qBuf = roundState.qBuf.slice(0, -1);
      } else {
        roundState.rBuf = roundState.rBuf.slice(0, -1);
      }
      syncDualDisplay();
    } else if (q.inputType === 'step_pair') {
      if (roundState.activeSlot === 'b' && roundState.bBuf === '') {
        roundState.activeSlot = 'a';
      }
      if (roundState.activeSlot === 'a') {
        roundState.aBuf = roundState.aBuf.slice(0, -1);
      } else {
        roundState.bBuf = roundState.bBuf.slice(0, -1);
      }
      syncDualDisplay();
    } else if (q.inputType === 'multi_slot') {
      const unlocked = (q.slots || []).filter(s => !roundState.lockedSlots.has(s.id));
      if (unlocked.length === 0) return;
      let curIdx = unlocked.findIndex(s => s.id === roundState.activeSlot);
      if (curIdx < 0) {
        curIdx = 0;
        roundState.activeSlot = unlocked[0].id;
      }
      const curBuf = roundState.slotBufs[roundState.activeSlot] || '';
      if (curBuf === '' && curIdx > 0) {
        roundState.activeSlot = unlocked[curIdx - 1].id;
      }
      const sid = roundState.activeSlot;
      roundState.slotBufs[sid] = (roundState.slotBufs[sid] || '').slice(0, -1);
      syncMultiSlotDisplay();
    }
  }

  function pressEnterKey() {
    if (!roundState || roundState.lockedTransition) return;
    const q = roundState.questions[roundState.index];

    if (q.inputType === 'numpad') {
      if (roundState.numBuf === '') return;
      const val = Number(roundState.numBuf);
      if (val === q.answer) {
        document.getElementById('slot-main')?.classList.add('correct-flash');
        handleCorrectSolve();
      } else {
        const slot = document.getElementById('slot-main');
        if (slot) {
          slot.classList.remove('wrong-flash');
          void slot.offsetWidth;
          slot.classList.add('wrong-flash');
        }
        roundState.numBuf = '';
        if (roundState.isTimedSprint) {
          if (slot) (slot.querySelector('.cross-slot-val') || slot).textContent = '?';
        } else {
          setTimeout(() => {
            if (slot && roundState && !roundState.lockedTransition && roundState.numBuf === '') {
              (slot.querySelector('.cross-slot-val') || slot).textContent = '?';
            }
          }, 340);
        }
        handleWrongAttempt(`Enter <strong>${q.answer}</strong> on the keypad to lock it into memory!`);
      }
      return;
    }

    if (q.inputType === 'quot_rem') {
      if (roundState.activeSlot === 'q' && roundState.rBuf === '') {
        if (roundState.qBuf === '') return;
        roundState.activeSlot = 'r';
        SFX.tap();
        syncDualDisplay();
        return;
      }
      if (roundState.qBuf === '' || roundState.rBuf === '') return;
      const uq = Number(roundState.qBuf);
      const ur = Number(roundState.rBuf);
      const sq = document.getElementById('slot-q');
      const sr = document.getElementById('slot-r');

      if (uq === q.answer.q && ur === q.answer.r) {
        sq?.classList.add('correct-flash');
        sr?.classList.add('correct-flash');
        handleCorrectSolve();
      } else {
        if (sq) { sq.classList.remove('wrong-flash'); void sq.offsetWidth; sq.classList.add('wrong-flash'); }
        if (sr) { sr.classList.remove('wrong-flash'); void sr.offsetWidth; sr.classList.add('wrong-flash'); }
        roundState.qBuf = '';
        roundState.rBuf = '';
        roundState.activeSlot = 'q';
        setTimeout(() => {
          if (roundState && !roundState.lockedTransition) syncDualDisplay();
        }, 360);
        handleWrongAttempt(`Now enter Quotient <strong>${q.answer.q}</strong> and Remainder <strong>${q.answer.r}</strong> to continue!`);
      }
      return;
    }

    if (q.inputType === 'step_pair') {
      if (roundState.activeSlot === 'a' && roundState.bBuf === '') {
        if (roundState.aBuf === '') return;
        roundState.activeSlot = 'b';
        SFX.tap();
        syncDualDisplay();
        return;
      }
      if (roundState.aBuf === '' || roundState.bBuf === '') return;
      const ua = Number(roundState.aBuf);
      const ub = Number(roundState.bBuf);
      const sa = document.getElementById('slot-a');
      const sb = document.getElementById('slot-b');

      if (ua === q.answer.a && ub === q.answer.b) {
        sa?.classList.add('correct-flash');
        sb?.classList.add('correct-flash');
        handleCorrectSolve();
      } else {
        if (sa) { sa.classList.remove('wrong-flash'); void sa.offsetWidth; sa.classList.add('wrong-flash'); }
        if (sb) { sb.classList.remove('wrong-flash'); void sb.offsetWidth; sb.classList.add('wrong-flash'); }
        roundState.aBuf = '';
        roundState.bBuf = '';
        roundState.activeSlot = 'a';
        setTimeout(() => {
          if (roundState && !roundState.lockedTransition) syncDualDisplay();
        }, 360);
        handleWrongAttempt(`Now enter <strong>${q.answer.a}</strong> in the first box and <strong>${q.answer.b}</strong> in the second box to lock it into memory!`);
      }
      return;
    }

    if (q.inputType === 'multi_slot') {
      const slots = q.slots || [];
      const unlocked = slots.filter(s => !roundState.lockedSlots.has(s.id));
      const hasEmptyUnlocked = unlocked.some(u => (roundState.slotBufs[u.id] || '') === '');

      if (hasEmptyUnlocked) {
        if ((roundState.slotBufs[roundState.activeSlot] || '') === '') return;
        const curPos = Math.max(0, unlocked.findIndex(s => s.id === roundState.activeSlot));
        for (let step = 1; step <= unlocked.length; step++) {
          const cand = unlocked[(curPos + step) % unlocked.length];
          if ((roundState.slotBufs[cand.id] || '') === '') {
            roundState.activeSlot = cand.id;
            break;
          }
        }
        SFX.tap();
        syncMultiSlotDisplay();
        return;
      }

      const allMatch = slots.every(s => Number(roundState.slotBufs[s.id]) === q.answer[s.id]);
      if (allMatch) {
        slots.forEach(s => {
          document.getElementById(`mslot-${s.id}`)?.classList.add('correct-flash');
        });
        handleCorrectSolve();
        return;
      }

      slots.forEach(s => {
        if (!roundState.lockedSlots.has(s.id) && Number(roundState.slotBufs[s.id]) === q.answer[s.id]) {
          roundState.lockedSlots.add(s.id);
        }
      });

      const wrongSlots = slots.filter(s => !roundState.lockedSlots.has(s.id));
      slots.forEach(s => {
        const el = document.getElementById(`mslot-${s.id}`);
        if (!el) return;
        if (roundState.lockedSlots.has(s.id)) {
          el.classList.remove('active', 'wrong-flash');
          el.classList.add('slot-locked-ok');
        } else {
          el.classList.remove('wrong-flash');
          void el.offsetWidth;
          el.classList.add('wrong-flash');
          roundState.slotBufs[s.id] = '';
        }
      });

      if (wrongSlots.length > 0) {
        roundState.activeSlot = wrongSlots[0].id;
      }

      setTimeout(() => {
        if (!roundState || roundState.lockedTransition) return;
        wrongSlots.forEach(ws => document.getElementById(`mslot-${ws.id}`)?.classList.remove('wrong-flash'));
        syncMultiSlotDisplay();
      }, 360);

      const fixList = wrongSlots
        .map(ws => `<strong>${escapeHtml(ws.shortLabel || ws.label)}: ${q.answer[ws.id]}</strong>`)
        .join(', ');
      const retryHTML = roundState.lockedSlots.size > 0
        ? `Nice job locking in ${roundState.lockedSlots.size} ${roundState.lockedSlots.size === 1 ? 'box' : 'boxes'}! Now enter ${fixList} to lock it into memory!`
        : `Enter ${fixList} to lock it into memory!`;
      handleWrongAttempt(retryHTML);
    }
  }

  function handleKeyDown(e) {
    if (!roundState || roundState.lockedTransition) return;
    const q = roundState.questions[roundState.index];
    if (q.inputType !== 'numpad' && q.inputType !== 'quot_rem' && q.inputType !== 'step_pair' && q.inputType !== 'multi_slot') return;
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      pressDigit(e.key);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      pressBackspace();
    } else if (e.key === 'Tab' || e.key === 'r' || e.key === 'R') {
      if (q.inputType === 'quot_rem') {
        e.preventDefault();
        roundState.activeSlot = roundState.activeSlot === 'q' ? 'r' : 'q';
        SFX.tap();
        syncDualDisplay();
      } else if (q.inputType === 'step_pair' && e.key === 'Tab') {
        e.preventDefault();
        roundState.activeSlot = roundState.activeSlot === 'a' ? 'b' : 'a';
        SFX.tap();
        syncDualDisplay();
      } else if (q.inputType === 'multi_slot' && e.key === 'Tab') {
        const unlocked = (q.slots || []).filter(s => !roundState.lockedSlots.has(s.id));
        if (unlocked.length > 1) {
          e.preventDefault();
          const curIdx = Math.max(0, unlocked.findIndex(s => s.id === roundState.activeSlot));
          const delta = e.shiftKey ? -1 : 1;
          roundState.activeSlot = unlocked[(curIdx + delta + unlocked.length) % unlocked.length].id;
          SFX.tap();
          syncMultiSlotDisplay();
        }
      }
    } else if (q.inputType === 'multi_slot' && SPATIAL_MOVES[roundState.activeSlot]?.[e.key]) {
      const unlockedIds = new Set((q.slots || []).filter(s => !roundState.lockedSlots.has(s.id)).map(s => s.id));
      const targetId = SPATIAL_MOVES[roundState.activeSlot][e.key].find(cand => unlockedIds.has(cand));
      if (targetId) {
        e.preventDefault();
        roundState.activeSlot = targetId;
        SFX.tap();
        syncMultiSlotDisplay();
      }
    } else if (e.key === 'Enter' || (e.key === ' ' && q.inputType === 'numpad')) {
      if (e.key === ' ' && roundState.numBuf === '' && !roundState.isTimedSprint) return;
      e.preventDefault();
      pressEnterKey();
    }
  }

  function openCompanionDetail(id) {
    const { gameDef, gameSave } = getContext();
    const c = gameDef.companions.find(x => x.id === id);
    if (!c || !gameSave.unlockedDragons.includes(id)) return;
    const modeMeta = getModeMeta(gameDef, c.modeId);
    const isColossal = Boolean(c.isColossal);
    SFX.tap();
    detailCompanionId = id;
    modalDetailEl.querySelector('.modal-card')?.classList.toggle('colossal-modal', isColossal);
    document.getElementById('detail-dragon-name').textContent = c.name;
    document.getElementById('detail-dragon-tribe').textContent = isColossal
      ? `${c.scaleLabel || c.tribe} • ${c.tribe}`
      : `${c.tribe} • ${modeMeta.title}`;
    document.getElementById('detail-dragon-img').src = c.image;
    document.getElementById('detail-dragon-bio').textContent = c.bio;
    document.getElementById('detail-dragon-quote').textContent = `"${pick(c.quotes)}"`;
    const btn = document.getElementById('detail-select-btn');
    if (gameDef.onlyCatsAsBuddy && !c.isCat) {
      const ownerCatName = c.ownerCatName || 'Crew';
      btn.textContent = gameSave.activeBuddyId === c.ownerCatId
        ? `★ ${ownerCatName} Is Active Buddy`
        : `🐱 Train with ${ownerCatName}`;
    } else {
      btn.textContent = gameSave.activeBuddyId === c.id ? '★ Active Study Buddy' : `${gameDef.companionEmoji} Set as Study Buddy`;
    }
    modalDetailEl.classList.remove('hidden');
  }

  function handleAction(actionEl) {
    const action = actionEl.dataset.action;
    if (!action) return false;
    const { gameDef, gameSave } = getContext();

    switch (action) {
      case 'exit-arena':
        exitArena();
        return true;
      case 'toggle-pace':
        togglePace();
        return true;
      case 'focus-dual-slot':
        if (roundState && !roundState.lockedTransition) {
          SFX.tap();
          const q = roundState.questions[roundState.index];
          if (q.inputType === 'step_pair') {
            roundState.activeSlot = actionEl.dataset.slot === 'b' ? 'b' : 'a';
          } else {
            roundState.activeSlot = actionEl.dataset.slot === 'r' ? 'r' : 'q';
          }
          syncDualDisplay();
        }
        return true;
      case 'toggle-dual-slot':
        if (roundState && !roundState.lockedTransition) {
          const q = roundState.questions[roundState.index];
          if (q.inputType === 'step_pair') {
            roundState.activeSlot = roundState.activeSlot === 'a' ? 'b' : 'a';
          } else {
            roundState.activeSlot = roundState.activeSlot === 'q' ? 'r' : 'q';
          }
          SFX.tap();
          syncDualDisplay();
        }
        return true;
      case 'press-digit':
        pressDigit(actionEl.dataset.digit);
        return true;
      case 'press-backspace':
        pressBackspace();
        return true;
      case 'press-enter':
        pressEnterKey();
        return true;
      case 'submit-choice': {
        if (!roundState || roundState.lockedTransition) return true;
        const idx = Number(actionEl.dataset.index);
        const q = roundState.questions[roundState.index];
        const chosen = q.choices[idx];
        const btn = document.getElementById(`choice-btn-${idx}`);
        const stageCards = document.querySelectorAll(`#question-stage [data-action="submit-choice"][data-index="${idx}"]`);
        if (!chosen) return true;
        if (chosen.id === q.answer) {
          btn?.classList.add('correct');
          stageCards.forEach(el => el.classList.add('correct'));
          handleCorrectSolve();
        } else {
          btn?.classList.add('wrong');
          stageCards.forEach(el => el.classList.add('wrong'));
          handleWrongAttempt(`Tap <strong>${escapeHtml(formatCorrectAnswer(q))}</strong> to lock it into memory and continue!`);
        }
        return true;
      }
      case 'toggle-multi-chip': {
        if (!roundState || roundState.lockedTransition) return true;
        const val = Number(actionEl.dataset.value);
        SFX.tap();
        if (roundState.multiSelected.has(val)) roundState.multiSelected.delete(val);
        else roundState.multiSelected.add(val);
        document.getElementById(`mchip-${val}`)?.classList.toggle('selected', roundState.multiSelected.has(val));
        return true;
      }
      case 'submit-multi-select': {
        if (!roundState || roundState.lockedTransition) return true;
        const q = roundState.questions[roundState.index];
        const sel = Array.from(roundState.multiSelected).sort((a, b) => a - b);
        if (sel.length === 0) return true;
        const isExact = sel.length === q.answer.length && sel.every((v, i) => v === q.answer[i]);
        if (isExact) {
          handleCorrectSolve();
        } else {
          handleWrongAttempt(`Make sure ONLY <strong>${q.answer.join(', ')}</strong> are highlighted in gold, then tap Check!`);
        }
        return true;
      }
      case 'reveal-strategy-peek': {
        if (!roundState) return true;
        SFX.tap();
        const q = roundState.questions[roundState.index];
        const box = document.getElementById('helper-peek-box');
        if (box && q.helperText) {
          box.textContent = q.helperText;
          box.classList.remove('hidden');
        }
        return true;
      }
      case 'toggle-sieve-grid': {
        if (!roundState) return true;
        SFX.tap();
        roundState.sieveOpen = !roundState.sieveOpen;
        const container = document.getElementById('sieve-container');
        if (container) {
          container.classList.toggle('hidden', !roundState.sieveOpen);
          if (roundState.sieveOpen) container.innerHTML = renderSieveDrawerHTML(roundState.sieveCrossed);
        }
        return true;
      }
      case 'toggle-sieve-num': {
        if (!roundState) return true;
        SFX.tap();
        const n = Number(actionEl.dataset.num);
        if (roundState.sieveCrossed.has(n)) roundState.sieveCrossed.delete(n);
        else roundState.sieveCrossed.add(n);
        const container = document.getElementById('sieve-container');
        if (container) container.innerHTML = renderSieveDrawerHTML(roundState.sieveCrossed);
        return true;
      }
      case 'focus-multi-slot': {
        if (roundState && !roundState.lockedTransition) {
          const q = roundState.questions[roundState.index];
          const sid = actionEl.dataset.slot;
          if (q.inputType === 'multi_slot' && (q.slots || []).some(s => s.id === sid) && !roundState.lockedSlots.has(sid)) {
            SFX.tap();
            roundState.activeSlot = sid;
            syncMultiSlotDisplay();
          }
        }
        return true;
      }
      case 'cycle-multi-slot': {
        if (roundState && !roundState.lockedTransition) {
          const q = roundState.questions[roundState.index];
          const unlocked = (q.slots || []).filter(s => !roundState.lockedSlots.has(s.id));
          if (unlocked.length > 1) {
            const idx = Math.max(0, unlocked.findIndex(s => s.id === roundState.activeSlot));
            roundState.activeSlot = unlocked[(idx + 1) % unlocked.length].id;
            SFX.tap();
            syncMultiSlotDisplay();
          }
        }
        return true;
      }
      case 'toggle-hundreds-chart': {
        if (!roundState) return true;
        SFX.tap();
        roundState.chartOpen = !roundState.chartOpen;
        const container = document.getElementById('hundreds-chart-container');
        const q = roundState.questions[roundState.index];
        if (container) {
          container.classList.toggle('hidden', !roundState.chartOpen);
          if (roundState.chartOpen) {
            container.innerHTML = renderHundredsChartDrawerHTML({
              maxNum: q.chartMax || 100,
              spotlightNum: roundState.chartSpotlight,
              clueNums: q.chartClues || []
            });
          }
        }
        return true;
      }
      case 'spotlight-chart-num': {
        if (!roundState) return true;
        SFX.tap();
        const num = Number(actionEl.dataset.num);
        roundState.chartSpotlight = roundState.chartSpotlight === num ? null : num;
        const container = document.getElementById('hundreds-chart-container');
        const q = roundState.questions[roundState.index];
        if (container && roundState.chartOpen) {
          container.innerHTML = renderHundredsChartDrawerHTML({
            maxNum: q.chartMax || 100,
            spotlightNum: roundState.chartSpotlight,
            clueNums: q.chartClues || []
          });
        }
        return true;
      }
      case 'toggle-tenframe-drawer': {
        if (!roundState) return true;
        SFX.tap();
        roundState.tenFrameOpen = !roundState.tenFrameOpen;
        const container = document.getElementById('tenframe-container');
        if (container) {
          container.classList.toggle('hidden', !roundState.tenFrameOpen);
          if (roundState.tenFrameOpen) container.innerHTML = renderTenFrameDrawerHTML(roundState.tenFrameCells);
        }
        return true;
      }
      case 'toggle-tenframe-cell': {
        if (!roundState) return true;
        SFX.tap();
        const idx = Number(actionEl.dataset.index);
        roundState.tenFrameCells[idx] = (roundState.tenFrameCells[idx] + 1) % 3;
        const container = document.getElementById('tenframe-container');
        if (container) container.innerHTML = renderTenFrameDrawerHTML(roundState.tenFrameCells);
        return true;
      }
      case 'clear-tenframe': {
        if (!roundState) return true;
        SFX.tap();
        roundState.tenFrameCells = new Array(20).fill(0);
        const container = document.getElementById('tenframe-container');
        if (container) container.innerHTML = renderTenFrameDrawerHTML(roundState.tenFrameCells);
        return true;
      }
      case 'read-prompt': {
        if (!roundState) return true;
        const q = roundState.questions[roundState.index];
        speakText(q.prompt);
        return true;
      }
      case 'crack-egg': {
        SFX.hatchFanfare();
        const allDone = Boolean(
          gameDef.victoryBannerText &&
          getUnlockedCompanions(gameSave, gameDef).length >= gameDef.companions.length
        );
        launchConfetti(confettiLayerEl, allDone ? 65 : 38, gameDef.confettiSymbols);
        document.getElementById('unlock-egg-step')?.classList.add('hidden');
        document.getElementById('unlock-reveal-step')?.classList.remove('hidden');
        return true;
      }
      case 'close-unlock-modal': {
        SFX.tap();
        const makeBuddy = actionEl.dataset.makeBuddy === 'true';
        const unlocked = pendingUnlocks.shift();
        if (makeBuddy && unlocked) {
          const targetId = resolveStudyBuddyId(gameSave, gameDef, unlocked.id);
          if (targetId) {
            gameSave.activeBuddyId = targetId;
            onSave();
            onRenderHub();
          }
        }
        modalUnlockEl.classList.add('hidden');
        if (pendingUnlocks.length > 0) {
          setTimeout(showNextUnlockModal, 180);
        } else {
          modalResultsEl.classList.remove('hidden');
        }
        return true;
      }
      case 'close-results':
        SFX.tap();
        modalResultsEl.classList.add('hidden');
        onRenderHub();
        return true;
      case 'replay-same-mode':
        modalResultsEl.classList.add('hidden');
        startRound(lastFinishedMode);
        return true;
      case 'play-suggested-mode':
        modalResultsEl.classList.add('hidden');
        startRound(actionEl.dataset.modeId);
        return true;
      case 'close-detail-modal':
        modalDetailEl.classList.add('hidden');
        return true;
      case 'select-detail-buddy': {
        const targetId = detailCompanionId ? resolveStudyBuddyId(gameSave, gameDef, detailCompanionId) : null;
        if (targetId) {
          SFX.correct(false);
          gameSave.activeBuddyId = targetId;
          onSave();
          onRenderHub();
        }
        modalDetailEl.classList.add('hidden');
        return true;
      }
      default:
        return false;
    }
  }

  function resetRound() {
    stopFluencyTimer();
    stopSprintTimer();
    stopSpeaking();
    roundState = null;
    arenaEl.classList.add('hidden');
    arenaEl.classList.remove('is-timed-sprint');
    document.getElementById('sprint-pace-hud')?.classList.add('hidden');
    document.getElementById('btn-pace-toggle')?.classList.remove('hidden');
    modalResultsEl.classList.add('hidden');
    modalUnlockEl.classList.add('hidden');
    modalDetailEl.classList.add('hidden');
  }

  return {
    startRound,
    exitArena,
    resetRound,
    updateArenaTopControls,
    openCompanionDetail,
    handleAction,
    handleKeyDown,
    isActive: () => Boolean(roundState)
  };
}
