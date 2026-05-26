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

  // Init music with Howler — starts after the ID gate is unlocked
  useEffect(() => {
    if (stage === "gate") return;
    if (!soundRef.current) {
      soundRef.current = new Howl({
        src: [localMusicUrl],
        loop: true,
        volume: 0,
        html5: true,
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

          <motion.nav
            className="bottom-nav"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            {stage === "video" && (
              <motion.button
                className="nav-btn"
                onClick={() => setStage("letter")}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                ← חזרה למכתב
              </motion.button>
            )}
            {stage === "letter" && (
              <motion.button
                className="nav-btn primary"
                onClick={() => setStage("video")}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                להמשך ←
              </motion.button>
            )}
          </motion.nav>
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
