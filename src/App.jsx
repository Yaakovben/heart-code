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

  // Init music with Howler — starts after the ID gate is unlocked.
  // First 12 seconds of the track are skipped on every play AND every loop.
  useEffect(() => {
    if (stage === "gate") return;
    if (!soundRef.current) {
      soundRef.current = new Howl({
        src: [localMusicUrl],
        loop: false, // we'll loop manually via onend so we can skip to 12s every time
        volume: 0,
        html5: true,
        preload: true,
        onplay: function () {
          // Skip intro on the very first play of each loop cycle.
          if (this.seek() < 12) this.seek(12);
        },
        onend: function () {
          // Manual loop — restart at 12s.
          this.seek(12);
          this.play();
        },
      });
    }
    const s = soundRef.current;
    const hide = stage === "video" || muted;
    if (hide) {
      s.fade(s.volume(), 0, 600);
    } else {
      if (!s.playing()) s.play();
      s.fade(s.volume(), 0.4, 1500);
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
