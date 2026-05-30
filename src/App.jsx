import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Howl, Howler } from "howler";
import IdGateScene from "./components/IdGateScene";
import LetterScene from "./components/LetterScene";
import VideoScene from "./components/VideoScene";
import Particles from "./components/Particles";
import { localMusicUrl, localVideoUrl } from "./lib/demoAssets";
import { loadFont } from "./components/HandwritingCanvas";

export default function App() {
  const [stage, setStage] = useState("gate");
  const [muted, setMuted] = useState(false);
  const soundRef = useRef(null);
  // Always resume the SAME sound instance (Howler can host multiple). Calling
  // s.play() with no arg creates a brand-new sound — that's the doubling we
  // kept chasing. s.play(soundId) only resumes the existing one.
  const soundIdRef = useRef(null);

  // Fully parse the handwriting font during the gate, not on letter mount.
  // loadFont() is a singleton in HandwritingCanvas — fetching here populates
  // the cached promise so HandwritingCanvas sees the font as already-loaded
  // and starts the reveal animation instantly.
  useEffect(() => {
    loadFont().catch(() => {});
  }, []);

  // Warm the MP3 + video in the browser cache from the very first paint, so
  // by the time the user reaches each scene the file is already downloaded.
  // We use plain fetch rather than a hidden <video preload> because some
  // mobile browsers autoplay muted preload videos and the audio track would
  // bleed in alongside the music. fetch is silent and equally cache-warming.
  useEffect(() => {
    fetch(localMusicUrl).catch(() => {});
    fetch(localVideoUrl).catch(() => {});
  }, []);

  // Create the Howl and start it (silently, volume:0) on the FIRST user
  // gesture — typing in the gate, tapping, anything. This guarantees:
  //   1. Howler's AudioContext is created inside a gesture window (required
  //      by iOS), so subsequent play() / resume() calls work even if they
  //      fire later from a setTimeout.
  //   2. The audio source is already streaming by the time the letter scene
  //      mounts, so the fade-up is instant — no startup delay.
  useEffect(() => {
    let armed = true;
    const initAudio = () => {
      if (!armed || soundRef.current) return;
      armed = false;
      const s = new Howl({
        src: [localMusicUrl],
        loop: true,
        volume: 0,
        html5: false,
      });
      soundRef.current = s;
      soundIdRef.current = s.play();
    };
    const evs = ["pointerdown", "touchstart", "click", "keydown"];
    evs.forEach((ev) => window.addEventListener(ev, initAudio, { passive: true, once: false }));
    return () => evs.forEach((ev) => window.removeEventListener(ev, initAudio));
  }, []);

  // Volume logic — runs every time stage or muted changes. NEVER calls
  // play() here: initAudio (gesture) starts the single sound, onShow
  // (visibility) resumes it. Calling play() again from here spawns a parallel
  // sound instance in Howler — the "old song + new song" doubling the user
  // reported when navigating video → letter.
  useEffect(() => {
    if (stage === "gate") return;
    const s = soundRef.current;
    if (!s) return;
    s.mute(muted);
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

  // Robust recovery from iOS interruptions (phone calls, screen-off, tab-switch).
  // The AudioContext gets suspended and Howler's playback halts; we have to
  // retry play() multiple times after resume() because iOS occasionally fails
  // the first attempt silently.
  useEffect(() => {
    const onHide = () => {
      const s = soundRef.current;
      const id = soundIdRef.current;
      if (s && id && s.playing(id)) s.pause(id);
    };
    const tryRecover = (attempts = 0) => {
      const s = soundRef.current;
      const id = soundIdRef.current;
      if (!s || !id || muted || stage === "gate" || stage === "video") return;
      const ctx = Howler.ctx;
      const doPlay = () => {
        if (s.playing(id)) return;
        // Always resume the SAME sound id — never s.play() with no arg, which
        // spawns a parallel instance.
        try { s.play(id); } catch {}
        if (!s.playing(id) && attempts < 6) {
          setTimeout(() => tryRecover(attempts + 1), 180);
        }
      };
      if (ctx && ctx.state === "suspended") {
        ctx.resume().then(doPlay).catch(doPlay);
      } else {
        doPlay();
      }
    };
    const onShow = () => tryRecover(0);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") onHide();
      else onShow();
    };

    // Also recover on the user's next tap — covers cases where the
    // visibility events don't fire (e.g. some Android WebViews).
    const onAnyTap = () => {
      const s = soundRef.current;
      const id = soundIdRef.current;
      if (!s || !id) return;
      const ctx = Howler.ctx;
      if (ctx && ctx.state !== "running") ctx.resume().catch(() => {});
      if (!s.playing(id) && !muted && stage !== "gate" && stage !== "video") {
        try { s.play(id); } catch {}
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onShow);
    window.addEventListener("pagehide", onHide);
    window.addEventListener("blur", onHide);
    window.addEventListener("focus", onShow);
    window.addEventListener("pointerdown", onAnyTap, { passive: true });
    window.addEventListener("touchstart", onAnyTap, { passive: true });
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onShow);
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("blur", onHide);
      window.removeEventListener("focus", onShow);
      window.removeEventListener("pointerdown", onAnyTap);
      window.removeEventListener("touchstart", onAnyTap);
    };
  }, [stage, muted]);

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
