import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Howl } from "howler";
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

  // Music is created + started the first time we LEAVE the gate. That click
  // is a real user gesture, so the Web Audio context unlocks cleanly on iOS.
  // Once created, we keep the same Howl alive and only fade its volume across
  // stages — never re-create or pause it.
  useEffect(() => {
    if (stage === "gate") return;

    if (!soundRef.current) {
      soundRef.current = new Howl({
        src: [localMusicUrl],
        loop: true,
        volume: 0,
        html5: false, // Web Audio — full volume/mute control on iOS
      });
      soundRef.current.play();
    }

    const s = soundRef.current;
    s.mute(muted);
    if (!s.playing()) s.play();
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
        {stage === "letter" && <LetterScene key="letter" />}
        {stage === "video" && <VideoScene key="video" />}
      </AnimatePresence>
    </div>
  );
}
