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

  // Preload music + handwriting font during the gate so the letter scene
  // appears instantly. Music only starts playing once we leave the gate.
  useEffect(() => {
    if (soundRef.current) return;
    soundRef.current = new Howl({
      src: [localMusicUrl],
      loop: true,
      volume: 0,
      html5: false, // Web Audio — full volume/mute control on iOS
      preload: true,
    });
    // Warm the font cache early.
    fetch(new URL("./assets/fonts/gveret.ttf", import.meta.url).href).catch(() => {});
  }, []);

  // Start playing the music the first time we leave the gate.
  useEffect(() => {
    if (stage === "gate") return;
    const s = soundRef.current;
    if (!s) return;
    if (!s.playing()) s.play();
  }, [stage]);

  // Drive volume + mute from current state. Cancels any in-flight fade so
  // rapid stage changes (letter ↔ video) can't stack and break the audio.
  useEffect(() => {
    const s = soundRef.current;
    if (!s) return;
    s.mute(muted);
    const target = stage === "video" ? 0 : 0.4;
    const cur = s.volume();
    // Snap current volume — this cancels any in-flight fade tween so
    // rapid stage transitions can't stack and produce jittery volume.
    s.volume(cur);
    if (!s.playing()) s.play();
    s.fade(cur, target, target === 0 ? 180 : 1200);
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
