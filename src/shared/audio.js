let audioCtx = null;
let soundEnabled = true;

export function setSoundEnabled(val) {
  soundEnabled = Boolean(val);
}

export function isSoundEnabled() {
  return soundEnabled;
}

function ensureAudio() {
  if (!soundEnabled || typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (_) {
    return null;
  }
}

function playTone(freq, duration, type, gainVal, delaySec) {
  const ctx = ensureAudio();
  if (!ctx) return;
  try {
    const start = ctx.currentTime + (delaySec || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'triangle';
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(gainVal || 0.12, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration);
  } catch (_) {}
}

export const SFX = {
  tap() {
    playTone(520, 0.045, 'sine', 0.06, 0);
  },
  correct(isPerfect) {
    playTone(523.25, 0.11, 'triangle', 0.13, 0);
    playTone(659.25, 0.12, 'triangle', 0.13, 0.07);
    playTone(783.99, 0.18, 'triangle', 0.14, 0.14);
    if (isPerfect) playTone(1046.5, 0.24, 'sine', 0.12, 0.21);
  },
  oops() {
    playTone(280, 0.14, 'sine', 0.11, 0);
    playTone(220, 0.20, 'sine', 0.11, 0.10);
  },
  roundFanfare() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      playTone(f, 0.22, 'triangle', 0.14, idx * 0.09);
    });
  },
  hatchFanfare() {
    [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.5].forEach((f, idx) => {
      playTone(f, 0.28, 'triangle', 0.15, idx * 0.085);
    });
  }
};
