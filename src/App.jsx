import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import IdGateScene from "./components/IdGateScene";
import LetterScene from "./components/LetterScene";
import VideoScene from "./components/VideoScene";
import Particles from "./components/Particles";
import { localMusicUrl, localVideoUrl } from "./lib/demoAssets";
import { loadFont } from "./components/HandwritingCanvas";
import { useBackgroundMusic } from "./lib/useBackgroundMusic";

const MUSIC_VOLUME = 0.7;
const STAGES = { GATE: "gate", LETTER: "letter", VIDEO: "video" };

export default function App() {
  const [stage, setStage] = useState(STAGES.GATE);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => { loadFont().catch(() => {}); }, []);

  useEffect(() => {
    fetch(localMusicUrl).catch(() => {});
    fetch(localVideoUrl).catch(() => {});
  }, []);

  useBackgroundMusic(audioRef, {
    audible: stage === STAGES.LETTER && !muted,
    volume: MUSIC_VOLUME,
  });

  return (
    <div className="app-shell">
      <audio
        ref={audioRef}
        src={localMusicUrl}
        loop
        playsInline
        preload="auto"
        webkit-playsinline="true"
        aria-hidden
        style={{ display: "none" }}
      />
      <Particles />

      {stage !== STAGES.GATE && (
        <>
          {stage !== STAGES.VIDEO && (
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

          {stage === STAGES.VIDEO && (
            <motion.button
              className="nav-back-top"
              onClick={() => setStage(STAGES.LETTER)}
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

          {stage === STAGES.LETTER && (
            <motion.button
              className="nav-continue"
              onClick={() => setStage(STAGES.VIDEO)}
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
        {stage === STAGES.GATE && (
          <IdGateScene key="gate" onUnlock={() => setStage(STAGES.LETTER)} />
        )}
        {stage === STAGES.LETTER && <LetterScene key="letter" muted={muted} />}
        {stage === STAGES.VIDEO && <VideoScene key="video" />}
      </AnimatePresence>
    </div>
  );
}
