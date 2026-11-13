import { pick } from '../math.js';
import { escapeHtml, launchConfetti, speakText, stopSpeaking } from '../dom.js';
import { SFX } from '../audio.js';
import {
  applyRoundCompletion,
  getActiveBuddy,
  getModeCompanions,
  getModeMeta,
  getNextCompanionSpotlight,
  isCompanionUnlocked
} from '../progression.js';
import {
  createRoundState,
  recordMistakeInSave,
  recordSkillAttemptInSave
} from '../round-engine.js';
import { renderSieveDrawerHTML, renderTenFrameDrawerHTML } from '../manipulatives.js';

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
  let pendingUnlocks = [];
  let lastFinishedMode = 'mix';
  let detailCompanionId = null;

  function stopFluencyTimer() {
    if (fluencyTimer) {
      clearInterval(fluencyTimer);
      fluencyTimer = null;
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

    if (q.inputType === 'numpad' || q.inputType === 'quot_rem' || q.inputType === 'step_pair') {
      const isDual = q.inputType === 'quot_rem' || q.inputType === 'step_pair';
      let switchLabel = '';
      if (q.inputType === 'quot_rem') {
        switchLabel = 'Editing: Quotient → Tap for Remainder (R)';
      } else if (q.inputType === 'step_pair') {
        const labels = getStepLabels(q);
        switchLabel = `Editing: ${escapeHtml(labels.a)} → Tap for ${escapeHtml(labels.b)}`;
      }
      panel.innerHTML = `
        <div class="numpad-grid">
          ${isDual ? `<button type="button" id="btn-switch-qr" class="num-key key-switch" data-action="toggle-dual-slot">${switchLabel}</button>` : ''}
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
          <button type="button" id="btn-numpad-enter" class="num-key key-enter" data-action="press-enter">${isDual ? 'Next ➔' : 'Check ✓'}</button>
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
    roundState.activeSlot = q.inputType === 'step_pair' ? 'a' : 'q';
    roundState.multiSelected = new Set();
    roundState.sieveOpen = false;
    roundState.sieveCrossed = new Set();
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
    if (q.enableTenFrame) {
      helperButtons.push('<button type="button" class="helper-toggle-btn" data-action="toggle-tenframe-drawer">🧮 Toggle 20-Frame Counters</button>');
    }

    const readBtnHTML = gameDef.enableReadAloud
      ? '<button type="button" class="read-aloud-btn" data-action="read-prompt">🔊 Read</button>'
      : '';

    const stage = document.getElementById('question-stage');
    if (stage) {
      stage.innerHTML = `
        <div class="question-badge-row">
          <span class="question-topic-badge">${escapeHtml(q.topicLabel)} • Puzzle ${roundState.index + 1} of 10</span>
          ${readBtnHTML}
        </div>
        <p class="question-prompt">${q.prompt}</p>
        ${q.stageHTML || ''}
        ${helperButtons.length ? `<div class="stage-helper-row">${helperButtons.join('')}</div>` : ''}
        <div id="helper-peek-box" class="helper-peek-box hidden"></div>
        <div id="sieve-container" class="hidden"></div>
        <div id="tenframe-container" class="hidden"></div>
      `;
    }

    renderInputPanel(q);
    startFluencyTimer(q.fluencySeconds || 16);
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
    setCoachLine(`<strong>${escapeHtml(buddy.name)}:</strong> "Ooh, tricky one! Check the golden clue below and enter the answer to lock it in!"`);
  }

  function handleCorrectSolve() {
    stopFluencyTimer();
    const { gameDef, gameSave } = getContext();
    roundState.lockedTransition = true;
    const firstTry = !roundState.missedCurrent;
    if (firstTry && roundState.withinFluency) roundState.fastCount++;

    const q = roundState.questions[roundState.index];
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
    const { gameDef } = getContext();
    if (pendingUnlocks.length === 0) {
      modalResultsEl.classList.remove('hidden');
      return;
    }
    const companion = pendingUnlocks[0];
    const modeMeta = getModeMeta(gameDef, companion.modeId);
    SFX.roundFanfare();

    document.getElementById('egg-tribe-hint').textContent = `${companion.tribe} • ${modeMeta.icon} ${modeMeta.title}`;
    document.getElementById('unlock-heading').textContent = gameDef.unlockHeading || `A ${gameDef.companionNoun} Egg Is Hatching!`;
    const podEl = document.getElementById('unlock-pod-emoji');
    if (podEl) podEl.textContent = gameDef.unlockPodEmoji || '✨';
    document.getElementById('unlock-reveal-kicker').textContent = `✨ New ${gameDef.companionNoun} Unlocked! ✨`;
    document.getElementById('unlock-dragon-name').textContent = companion.name;
    document.getElementById('unlock-dragon-tribe').textContent = `${companion.tribe} • ${modeMeta.title}`;
    document.getElementById('unlock-dragon-img').src = companion.image;
    document.getElementById('unlock-dragon-bio').textContent = companion.bio;
    document.getElementById('unlock-dragon-quote').textContent = `"${companion.quotes[0]}"`;
    document.getElementById('btn-unlock-make-buddy').textContent = `${gameDef.companionEmoji} Make My Study Buddy!`;

    document.getElementById('unlock-egg-step').classList.remove('hidden');
    document.getElementById('unlock-reveal-step').classList.add('hidden');
    modalUnlockEl.classList.remove('hidden');
  }

  function finishRound() {
    stopFluencyTimer();
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
    shellEl.classList.remove('hidden');
    onRenderHub();

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
    const nextInMode = getModeCompanions(gameDef, modeId).find(c => !isCompanionUnlocked(gameSave, c.id));
    const fillEl = document.getElementById('results-progress-fill');
    const capEl = document.getElementById('results-progress-caption');
    const suggestWrap = document.getElementById('results-suggest-wrap');

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
        suggestWrap.innerHTML = `<button type="button" id="btn-results-suggest-mode" class="suggest-mode-btn" data-action="play-suggested-mode" data-mode-id="${escapeHtml(suggested.modeId)}">🥚 Unlock ${escapeHtml(gameDef.companionNounPlural)} in ${escapeHtml(sugMeta.shortTitle)} →</button>`;
      } else {
        capEl.textContent = `🎉 All ${gameDef.companions.length} ${gameDef.companionNounPlural} Unlocked!`;
        suggestWrap.innerHTML = '';
      }
    }

    roundState = null;

    if (pendingUnlocks.length > 0) {
      showNextUnlockModal();
    } else {
      if (firstTryCount === 10) launchConfetti(confettiLayerEl, 26);
      SFX.roundFanfare();
      modalResultsEl.classList.remove('hidden');
    }
  }

  function startRound(modeId) {
    SFX.tap();
    const { gameDef } = getContext();
    const questions = gameDef.buildRoundQuestions(modeId);
    roundState = createRoundState(modeId, questions);

    shellEl.classList.add('hidden');
    arenaEl.classList.remove('hidden');
    updateArenaTopControls();
    renderCurrentQuestion();
  }

  function exitArena() {
    SFX.tap();
    stopFluencyTimer();
    stopSpeaking();
    roundState = null;
    arenaEl.classList.add('hidden');
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

  function pressDigit(d) {
    if (!roundState || roundState.lockedTransition) return;
    const q = roundState.questions[roundState.index];
    SFX.tap();

    if (q.inputType === 'numpad') {
      if (roundState.numBuf.length >= 3) return;
      roundState.numBuf = roundState.numBuf === '0' ? d : roundState.numBuf + d;
      const slot = document.getElementById('slot-main');
      if (slot) slot.textContent = roundState.numBuf;
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
    }
  }

  function pressBackspace() {
    if (!roundState || roundState.lockedTransition) return;
    const q = roundState.questions[roundState.index];
    SFX.tap();

    if (q.inputType === 'numpad') {
      roundState.numBuf = roundState.numBuf.slice(0, -1);
      const slot = document.getElementById('slot-main');
      if (slot) slot.textContent = roundState.numBuf === '' ? '?' : roundState.numBuf;
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
        setTimeout(() => {
          if (slot && roundState && !roundState.lockedTransition) slot.textContent = '?';
        }, 340);
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
    }
  }

  function handleKeyDown(e) {
    if (!roundState || roundState.lockedTransition) return;
    const q = roundState.questions[roundState.index];
    if (q.inputType !== 'numpad' && q.inputType !== 'quot_rem' && q.inputType !== 'step_pair') return;
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
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pressEnterKey();
    }
  }

  function openCompanionDetail(id) {
    const { gameDef, gameSave } = getContext();
    const c = gameDef.companions.find(x => x.id === id);
    if (!c || !gameSave.unlockedDragons.includes(id)) return;
    const modeMeta = getModeMeta(gameDef, c.modeId);
    SFX.tap();
    detailCompanionId = id;
    document.getElementById('detail-dragon-name').textContent = c.name;
    document.getElementById('detail-dragon-tribe').textContent = `${c.tribe} • ${modeMeta.title}`;
    document.getElementById('detail-dragon-img').src = c.image;
    document.getElementById('detail-dragon-bio').textContent = c.bio;
    document.getElementById('detail-dragon-quote').textContent = `"${pick(c.quotes)}"`;
    const btn = document.getElementById('detail-select-btn');
    btn.textContent = gameSave.activeBuddyId === c.id ? '★ Active Study Buddy' : `${gameDef.companionEmoji} Set as Study Buddy`;
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
        if (!chosen) return true;
        if (chosen.id === q.answer) {
          btn?.classList.add('correct');
          handleCorrectSolve();
        } else {
          btn?.classList.add('wrong');
          handleWrongAttempt(`Tap <strong>${escapeHtml(q.answer)}</strong> to lock it into memory and continue!`);
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
      case 'crack-egg':
        SFX.hatchFanfare();
        launchConfetti(confettiLayerEl, 38);
        document.getElementById('unlock-egg-step')?.classList.add('hidden');
        document.getElementById('unlock-reveal-step')?.classList.remove('hidden');
        return true;
      case 'close-unlock-modal': {
        SFX.tap();
        const makeBuddy = actionEl.dataset.makeBuddy === 'true';
        const unlocked = pendingUnlocks.shift();
        if (makeBuddy && unlocked) {
          gameSave.activeBuddyId = unlocked.id;
          onSave();
          onRenderHub();
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
        if (detailCompanionId && gameDef.companions.some(c => c.id === detailCompanionId) && gameSave.unlockedDragons.includes(detailCompanionId)) {
          SFX.correct(false);
          gameSave.activeBuddyId = detailCompanionId;
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
    stopSpeaking();
    roundState = null;
    arenaEl.classList.add('hidden');
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
