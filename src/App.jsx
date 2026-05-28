import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Howl, Howler } from "howler";
import IdGateScene from "./components/IdGateScene";
import LetterScene from "./components/LetterScene";
import VideoScene from "./components/VideoScene";
import Particles from "./components/Particles";
import { localMusicUrl } from "./lib/demoAssets";

export default function App() {
  const [stage, setStage] = useState("gate");
  const [muted, setMuted] = useState(false);
  const soundRef = useRef(null);

  // Warm the handwriting-font cache early so the letter scene mounts instantly.
  useEffect(() => {
    fetch(new URL("./assets/fonts/gveret.ttf", import.meta.url).href).catch(() => {});
  }, []);

  // Create the Howl immediately at app mount. The 5MB MP3 starts downloading
  // and decoding while the reader is still in the gate scene — by the time
  // they unlock, the audio is ready and play() is instant (no startup delay).
  // We don't call play() here; iOS would block it without a user gesture.
  useEffect(() => {
    if (soundRef.current) return;
    soundRef.current = new Howl({
      src: [localMusicUrl],
      loop: true,
      volume: 0,
      html5: false,
      preload: true,
    });
  }, []);

  // Resume Howler's AudioContext on the very first user interaction. Without
  // this, ctx stays suspended (Howl was created before any gesture) and the
  // delayed play() inside the gate submit's setTimeout falls outside the
  // gesture window — iOS silently blocks playback.
  useEffect(() => {
    const unlock = () => {
      const ctx = Howler.ctx;
      if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
    };
    const evs = ["pointerdown", "touchstart", "click", "keydown"];
    evs.forEach((ev) => window.addEventListener(ev, unlock, { passive: true }));
    return () => evs.forEach((ev) => window.removeEventListener(ev, unlock));
  }, []);

  // Volume / start logic — runs every time stage or muted changes.
  useEffect(() => {
    if (stage === "gate") return;
    const s = soundRef.current;
    if (!s) return;
    if (!s.playing()) s.play();
    s.mute(muted);
    // Do NOT call play() here again. The init block above started it once and
    // loop:true keeps it alive across stages. A second play() spawns a parallel
    // playback instance in Howler — what the user heard as "doubled music".
    const target = stage === "video" ? 0 : 0.4;
    const cur = s.volume();
    // Skip the fade entirely when we're already at target — otherwise a re-render
    // would cancel an in-flight fade and immediately restart it, audible as a
    // flutter. The previous explicit volume() snap is what caused that bug.
    if (Math.abs(cur - target) > 0.001) {
      s.fade(cur, target, target === 0 ? 180 : 1200);
    }
  }, [stage, muted]);

  useEffect(() => () => soundRef.current?.unload(), []);

  // When the screen turns off / tab hides on mobile, the AudioContext gets
  // suspended and the playback may halt. On return, explicitly resume the
  // context and re-start the sound if it's not playing.
  useEffect(() => {
    // Explicit pause when the page goes background — Howler then remembers
    // the current seek position. On return, play() resumes from that point
    // instead of restarting at 0 (which is what happened before).
    const onHide = () => {
      const s = soundRef.current;
      if (s && s.playing()) s.pause();
    };
    const onShow = () => {
      const s = soundRef.current;
      if (!s) return;
      const ctx = Howler.ctx;
      const resumePlay = () => { if (!s.playing()) s.play(); };
      if (ctx && ctx.state === "suspended") {
        ctx.resume().then(resumePlay).catch(resumePlay);
      } else {
        resumePlay();
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") onHide();
      else onShow();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onShow);
    window.addEventListener("pagehide", onHide);
    window.addEventListener("blur", onHide);
    window.addEventListener("focus", onShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onShow);
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("blur", onHide);
      window.removeEventListener("focus", onShow);
    };
  }, []);

  return (
    <div className="app-shell">
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
