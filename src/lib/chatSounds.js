// Chat sounds — synthesized once into WAV blobs, then played via plain
// HTML5 <audio>. This is the exact pipeline iOS Safari is friendliest to
// (same as the background music), and avoids the Web Audio suspension
// issues that left the "sent" ping silent on iPhone.

let sentAudio = null;
let errorAudio = null;
let primed = false;

// ---------- WAV encoder (mono, 16-bit PCM) ----------
function encodeWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (off, s) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);            // PCM chunk size
  view.setUint16(20, 1, true);             // PCM
  view.setUint16(22, 1, true);             // 1 channel
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);             // block align
  view.setUint16(34, 16, true);            // bits per sample
  writeStr(36, "data");
  view.setUint32(40, samples.length * 2, true);
  let off = 44;
  for (let i = 0; i < samples.length; i++, off += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([view], { type: "audio/wav" });
}

function renderSamples(sampleRate, duration, build) {
  const n = Math.floor(sampleRate * duration);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = build(i / sampleRate);
  return out;
}

// "Sent" — bright two-tone ting (1320Hz + 2200Hz, exponential envelope).
function makeSentBuffer() {
  const sr = 44100;
  const dur = 0.22;
  const partials = [
    { freq: 1320, peak: 0.35, len: 0.20, delay: 0 },
    { freq: 2200, peak: 0.22, len: 0.18, delay: 0.025 },
  ];
  return renderSamples(sr, dur, (t) => {
    let v = 0;
    for (const { freq, peak, len, delay } of partials) {
      const lt = t - delay;
      if (lt < 0 || lt > len) continue;
      // exp attack (0→peak in 8ms) then exp decay
      const env = lt < 0.008
        ? (lt / 0.008) * peak
        : peak * Math.exp(-(lt - 0.008) * 12);
      v += Math.sin(2 * Math.PI * freq * lt) * env;
    }
    return v;
  });
}

// "Error" — low descending blip.
function makeErrorBuffer() {
  const sr = 44100;
  const dur = 0.28;
  return renderSamples(sr, dur, (t) => {
    const freq = 380 * Math.exp(-t * 3); // 380→~220
    const env = t < 0.02
      ? (t / 0.02) * 0.18
      : 0.18 * Math.exp(-(t - 0.02) * 8);
    return Math.sin(2 * Math.PI * freq * t) * env;
  });
}

// Build the audio elements ONCE on first user gesture.
export function unlockAudio() {
  if (primed) {
    // Re-prime if iOS suspended things between uses.
    sentAudio?.load();
    errorAudio?.load();
    return;
  }
  primed = true;
  try {
    const sentUrl = URL.createObjectURL(encodeWav(makeSentBuffer(), 44100));
    const errorUrl = URL.createObjectURL(encodeWav(makeErrorBuffer(), 44100));
    sentAudio = new Audio(sentUrl);
    sentAudio.preload = "auto";
    sentAudio.volume = 1;
    errorAudio = new Audio(errorUrl);
    errorAudio.preload = "auto";
    errorAudio.volume = 1;
    // Touch play() inside the gesture so iOS marks them as user-activated.
    sentAudio.muted = true;
    errorAudio.muted = true;
    const p1 = sentAudio.play();
    const p2 = errorAudio.play();
    const settle = (a) => { try { a.pause(); a.currentTime = 0; a.muted = false; } catch {} };
    if (p1?.then) p1.then(() => settle(sentAudio)).catch(() => settle(sentAudio));
    else settle(sentAudio);
    if (p2?.then) p2.then(() => settle(errorAudio)).catch(() => settle(errorAudio));
    else settle(errorAudio);
  } catch {}
}

function fire(a) {
  if (!a) return;
  try {
    a.currentTime = 0;
    a.play().catch(() => {});
  } catch {}
}

export function playSent() { fire(sentAudio); }
export function playError() { fire(errorAudio); }
