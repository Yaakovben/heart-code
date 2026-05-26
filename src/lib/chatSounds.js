// Synthesized chat sounds — no external assets.
// Browsers may block until first user gesture; calls fail silently.

let ctx = null;

function getCtx() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {}
  }
  return ctx;
}

// Call directly from a user gesture (touchstart / click / keydown).
// Resumes the context AND plays a silent 1-sample buffer — the trick most
// mobile browsers (especially iOS Safari) need to fully unlock audio.
export function unlockAudio() {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => {});
  try {
    const buf = c.createBuffer(1, 1, 22050);
    const src = c.createBufferSource();
    src.buffer = buf;
    src.connect(c.destination);
    src.start(0);
  } catch {}
}

function isReady() {
  return getCtx()?.state === "running";
}

// Sent — bright two-tone "ting". Only plays in real-time; never queued, so
// late playback can't desync from the on-screen action.
export function playSent() {
  if (!isReady()) return;
  try {
    const c = getCtx();
    const now = c.currentTime;
    const partials = [
      { freq: 1320, peak: 0.35, dur: 0.20, delay: 0 },
      { freq: 2200, peak: 0.22, dur: 0.18, delay: 0.025 },
    ];
    for (const { freq, peak, dur, delay } of partials) {
      const t0 = now + delay;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain).connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    }
  } catch {}
}

// Soft error blip (low descending tone)
export function playError() {
  if (!isReady()) return;
  try {
    const c = getCtx();
    const now = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.18);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.connect(gain).connect(c.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  } catch {}
}
