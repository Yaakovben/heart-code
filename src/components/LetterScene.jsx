import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import message from "../data/message.txt?raw";
import HandwritingCanvas from "./HandwritingCanvas";

const lines = message
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean);

// Soft quill scratch — ticks while writing
function useQuillTicker(active) {
  const ctxRef = useRef(null);
  const bufRef = useRef(null);
  const idRef = useRef(null);

  useEffect(() => {
    if (!active) {
      clearInterval(idRef.current);
      idRef.current = null;
      return;
    }
    const play = () => {
      try {
        if (!ctxRef.current) {
          ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
          const ctx = ctxRef.current;
          const buf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
          const data = buf.getChannelData(0);
          for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
          bufRef.current = buf;
        }
        const ctx = ctxRef.current;
        const now = ctx.currentTime;
        const src = ctx.createBufferSource();
        src.buffer = bufRef.current;
        src.start(now, Math.random() * 0.2, 0.05);
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 2300 + Math.random() * 600;
        bp.Q.value = 1.6;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.012, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
        src.connect(bp).connect(gain).connect(ctx.destination);
      } catch {}
    };
    idRef.current = setInterval(play, 110);
    return () => clearInterval(idRef.current);
  }, [active]);
}

export default function LetterScene() {
  const [done, setDone] = useState(false);
  useQuillTicker(!done);

  return (
    <motion.section
      className="scene"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="letter-stage-real"
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      >
        <div className="letter-paper-real">
          <div className="letter-monogram">~ ❦ ~</div>
          <div className="hw-scroll">
            <HandwritingCanvas
              lines={lines}
              fontSize={26}
              speed={520}
              lineGap={1.5}
              onDone={() => setDone(true)}
            />
          </div>
          {done && (
            <motion.div
              className="letter-signature"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 1.2 }}
            >
              ~ שלך, תמיד
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.section>
  );
}
