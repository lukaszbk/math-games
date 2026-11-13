export function stripHtml(str) {
  return String(str || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function launchConfetti(layerEl, count = 26) {
  if (!layerEl || typeof document === 'undefined') return;
  const symbols = ['⭐', '✨', '🌟', '🐉', '💎', '🎉'];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'confetti-piece';
    el.textContent = symbols[i % symbols.length];
    el.style.left = (Math.random() * 96 + 2).toFixed(1) + '%';
    el.style.animationDuration = (1.6 + Math.random() * 1.4).toFixed(2) + 's';
    el.style.animationDelay = (Math.random() * 0.35).toFixed(2) + 's';
    layerEl.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 3500);
  }
}

export function speakText(text) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  try {
    const synth = window.speechSynthesis;
    if (!synth || typeof window.SpeechSynthesisUtterance !== 'function') return false;
    synth.cancel();
    const spoken = stripHtml(text)
      .replace(/−/g, ' minus ')
      .replace(/\+/g, ' plus ')
      .replace(/÷/g, ' divided by ')
      .replace(/×/g, ' times ')
      .replace(/\s+/g, ' ')
      .trim();
    const utter = new window.SpeechSynthesisUtterance(spoken);
    utter.rate = 0.94;
    utter.pitch = 1.05;
    synth.speak(utter);
    return true;
  } catch (_) {
    return false;
  }
}

export function stopSpeaking() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch (_) {}
}
