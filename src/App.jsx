import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import IdGateScene from "./components/IdGateScene";
import LetterScene from "./components/LetterScene";
import VideoScene from "./components/VideoScene";
import Particles from "./components/Particles";
import { localMusicUrl, localVideoUrl } from "./lib/demoAssets";
import { loadFont } from "./components/HandwritingCanvas";

const TARGET_VOLUME = 0.7;
const FADE_DURATION_MS = 1200;
const FADE_DOWN_MS = 200;

export default function App() {
  const [stage, setStage] = useState("gate");
  const [muted, setMuted] = useState(false);
  // Native <audio> ref — using the exact pipeline the working VideoScene
  // audio uses on this iPhone. No Howler, no Web Audio, no AudioContext.
  const audioRef = useRef(null);
  const fadeRafRef = useRef(null);

  useEffect(() => {
    loadFont().catch(() => {});
  }, []);

  useEffect(() => {
    fetch(localMusicUrl).catch(() => {});
    fetch(localVideoUrl).catch(() => {});
  }, []);

  // Start the audio on the first user gesture (typing, tap, click).
  // Native <audio>.play() inside a gesture handler is the most universally
  // compatible pattern — same pipeline as <video>, which works for the user.
  useEffect(() => {
    const start = () => {
      const a = audioRef.current;
      if (!a || !a.paused) return;
      a.volume = 0;
      a.play().catch(() => {});
    };
    const evs = ["pointerdown", "touchstart", "click", "keydown"];
    evs.forEach((ev) => window.addEventListener(ev, start, { passive: true }));
    return () => evs.forEach((ev) => window.removeEventListener(ev, start));
  }, []);

  // Volume control on stage / mute changes — manual rAF fade so we don't
  // depend on any third-party audio library at all.
  useEffect(() => {
    if (stage === "gate") return;
    const a = audioRef.current;
    if (!a) return;
    a.muted = muted;
    // If the gesture-bound play got blocked (e.g. autoplay policy), retry it
    // now — this useEffect runs in response to a user-initiated stage change.
    if (a.paused) a.play().catch(() => {});

    const target = stage === "video" ? 0 : TARGET_VOLUME;
    if (fadeRafRef.current) cancelAnimationFrame(fadeRafRef.current);
    const from = a.volume;
    if (Math.abs(from - target) < 0.001) return;
    const dur = target === 0 ? FADE_DOWN_MS : FADE_DURATION_MS;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      try { a.volume = from + (target - from) * p; } catch {}
      if (p < 1) fadeRafRef.current = requestAnimationFrame(tick);
      else fadeRafRef.current = null;
    };
    fadeRafRef.current = requestAnimationFrame(tick);
  }, [stage, muted]);

  // Backgrounding / focus recovery — native <audio> handles most of this
  // itself, but iOS sometimes pauses on tab-hide without auto-resuming.
  useEffect(() => {
    const onShow = () => {
      const a = audioRef.current;
      if (!a || muted || stage === "gate" || stage === "video") return;
      if (a.paused) a.play().catch(() => {});
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") onShow();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onShow);
    window.addEventListener("focus", onShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onShow);
      window.removeEventListener("focus", onShow);
    };
  }, [stage, muted]);

  useEffect(() => () => {
    if (fadeRafRef.current) cancelAnimationFrame(fadeRafRef.current);
  }, []);

  return (
    <div className="app-shell">
      {/* Single, native <audio> for the background music — same pipeline as
          the VideoScene <video> the user has confirmed works on iPhone. */}
      <audio
        ref={audioRef}
        src={localMusicUrl}
        loop
        playsInline
        preload="auto"
        // @ts-ignore — iOS-specific, still respected by older Safari.
        webkit-playsinline="true"
        aria-hidden
        style={{ display: "none" }}
      />
      <Particles />

      {stage !== "gate" && (
        <>
          {stage !== "video" && (
            <motion.button
              className="mute-btn"
              onClick={() => setMuted((m) => !m)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              title={muted ? "השמע" : "השתק"}
            >
              {muted ? "🔇" : "♪"}
            </motion.button>
          )}

          {/* Back arrow — top-left corner, discreet */}
          {stage === "video" && (
            <motion.button
              className="nav-back-top"
              onClick={() => setStage("letter")}
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.94 }}
              aria-label="חזרה למכתב"
            >
              <span>חזרה למכתב</span>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.button>
          )}

          {/* Primary continue — floating, bottom-left (Hebrew RTL forward = left) */}
          {stage === "letter" && (
            <motion.button
              className="nav-continue"
              onClick={() => setStage("video")}
              initial={{ x: -30, y: 12, opacity: 0 }}
              animate={{ x: 0, y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              aria-label="המשך"
            >
              <span>להמשך</span>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.button>
          )}
        </>
      )}

      <AnimatePresence mode="wait">
        {stage === "gate" && (
          <IdGateScene key="gate" onUnlock={() => setStage("letter")} />
        )}
        {stage === "letter" && <LetterScene key="letter" muted={muted} />}
        {stage === "video" && <VideoScene key="video" />}
      </AnimatePresence>
    </div>
  );
}
