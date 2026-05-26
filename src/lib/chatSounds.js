// Synthesized chat sounds — no external assets.
// Browsers may block until first user gesture; calls fail silently.

let ctxRef = null;

function getCtx() {
  if (!ctxRef) {
    try {
      ctxRef = new (window.AudioContext || window.webkitAudioContext)();
    } catch {}
  }
  return ctxRef;
}
function isReady() {
  const ctx = getCtx();
  return ctx && ctx.state === "running";
}

// External check — used by UI to delay events until audio is alive
export function isAudioReady() {
  return isReady();
}

// Resume context (call on any user interaction)
export function unlockAudio() {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
}

// Try hard to play in real-time: if context is suspended, attempt resume() first
function bufferOrPlay(fn) {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "running") {
    fn();
    return;
  }
  ctx.resume().then(() => fn()).catch(() => {});
}

// Soft incoming-message tap (two-note pop)
export function playReceived() {
  if (!isReady()) return;
  playReceivedInner();
}
function playReceivedInner() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [820, 1180].forEach((freq, i) => {
      const t = now + i * 0.045;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.07, t + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.11);
    });
  } catch {}
}

// Sent — bright clean two-tone "ting", reliable across browsers.
// IMPORTANT: only plays if audio is ready RIGHT NOW. Never queued/delayed —
// otherwise late playback would feel disconnected from the on-screen action.
export function playSent() {
  if (!isReady()) return;
  playSentInner();
}
function playSentInner() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Two ascending sine partials = clear bell, audible & WhatsApp-ish.
    const partials = [
      { freq: 1320, peak: 0.35, dur: 0.20, delay: 0 },
      { freq: 2200, peak: 0.22, dur: 0.18, delay: 0.025 },
    ];
    for (const { freq, peak, dur, delay } of partials) {
      const t0 = now + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    }
  } catch {}
}

// Tiny keyboard tap — dry, low, distinct from "sent" ting
export function playKey() {
  if (!isReady()) return; // never buffer keys — only real-time
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Brief noise burst → soft "tk"
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.03, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 80);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1100;
    bp.Q.value = 1.4;
    const gain = ctx.createGain();
    gain.gain.value = 0.09;
    src.connect(bp).connect(gain).connect(ctx.destination);
    src.start(now);
  } catch {}
}

// Soft error blip (low descending tone)
export function playError() {
  if (!isReady()) return;
  playErrorInner();
}
function playErrorInner() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.18);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  } catch {}
}
