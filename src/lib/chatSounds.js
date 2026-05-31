// Chat-bubble sound effects.
//
// The tones are synthesized once into WAV blobs and played through plain
// HTML5 <audio> elements — the same pipeline as the background music.
// Web Audio was tried first but iOS Safari silently suspends its
// AudioContext between user gestures, which left the "sent" ping mute.

const SAMPLE_RATE = 44100;

let sentAudio = null;
let errorAudio = null;
let primed = false;

// ---------- WAV encoder (mono, 16-bit PCM) ----------
function encodeWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);             // PCM chunk size
  view.setUint16(20, 1, true);              // PCM format
  view.setUint16(22, 1, true);              // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true);              // block align
  view.setUint16(34, 16, true);             // bits per sample
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([view], { type: "audio/wav" });
}

function renderSamples(duration, build) {
  const count = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(count);
  for (let i = 0; i < count; i++) out[i] = build(i / SAMPLE_RATE);
  return out;
}

// Bright two-tone ting (1320Hz + 2200Hz, exponential envelope).
function makeSentBuffer() {
  const partials = [
    { freq: 1320, peak: 0.35, length: 0.20, delay: 0     },
    { freq: 2200, peak: 0.22, length: 0.18, delay: 0.025 },
  ];
  return renderSamples(0.22, (t) => {
    let v = 0;
    for (const { freq, peak, length, delay } of partials) {
      const localT = t - delay;
      if (localT < 0 || localT > length) continue;
      const env = localT < 0.008
        ? (localT / 0.008) * peak
        : peak * Math.exp(-(localT - 0.008) * 12);
      v += Math.sin(2 * Math.PI * freq * localT) * env;
    }
    return v;
  });
}

// Low descending blip.
function makeErrorBuffer() {
  return renderSamples(0.28, (t) => {
    const freq = 380 * Math.exp(-t * 3); // 380Hz → ~220Hz
    const env = t < 0.02
      ? (t / 0.02) * 0.18
      : 0.18 * Math.exp(-(t - 0.02) * 8);
    return Math.sin(2 * Math.PI * freq * t) * env;
  });
}

function buildAudio(buffer) {
  const url = URL.createObjectURL(encodeWav(buffer, SAMPLE_RATE));
  const audio = new Audio(url);
  audio.preload = "auto";
  return audio;
}

// Prime the audio elements during a user gesture. Touching .play() inside
// the gesture is what gives iOS permission to re-play them later.
function primeForIos(audio) {
  audio.muted = true;
  const playPromise = audio.play();
  const settle = () => {
    try { audio.pause(); audio.currentTime = 0; audio.muted = false; } catch {}
  };
  if (playPromise?.then) playPromise.then(settle).catch(settle);
  else settle();
}

// Call from a user gesture (click / touchstart / etc.) before playing.
export function unlockAudio() {
  if (primed) {
    sentAudio?.load();
    errorAudio?.load();
    return;
  }
  primed = true;
  try {
    sentAudio = buildAudio(makeSentBuffer());
    errorAudio = buildAudio(makeErrorBuffer());
    primeForIos(sentAudio);
    primeForIos(errorAudio);
  } catch {}
}

function fire(audio) {
  if (!audio) return;
  try {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch {}
}

export function playSent()  { fire(sentAudio); }
export function playError() { fire(errorAudio); }
