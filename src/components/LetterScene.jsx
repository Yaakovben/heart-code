import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import message from "../data/message.txt?raw";
import HandwritingCanvas from "./HandwritingCanvas";

const lines = message
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean);

// Soft writing sound — fountain pen on paper, gentle and warm.
function useQuillTicker(active) {
  const ctxRef = useRef(null);
  const bufRef = useRef(null);
  const idRef = useRef(null);

  useEffect(() => {
    if (!active) {
      if (idRef.current) clearTimeout(idRef.current);
      idRef.current = null;
      return;
    }
    const play = () => {
      try {
        if (!ctxRef.current) {
          ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
          const ctx = ctxRef.current;
          // Brown-noise-ish buffer (low frequencies only) — feels like cloth/paper rustle.
          const len = ctx.sampleRate * 1.2;
          const buf = ctx.createBuffer(1, len, ctx.sampleRate);
          const data = buf.getChannelData(0);
          let last = 0;
          for (let i = 0; i < len; i++) {
            const white = Math.random() * 2 - 1;
            last = (last + 0.02 * white) / 1.02;
            data[i] = last * 3.0;
          }
          bufRef.current = buf;
        }
        const ctx = ctxRef.current;
        const now = ctx.currentTime;
        const src = ctx.createBufferSource();
        src.buffer = bufRef.current;
        // Long soft swish (200-400ms) — pen gliding across paper.
        const swishDur = 0.22 + Math.random() * 0.18;
        src.start(now, Math.random() * 0.8, swishDur);

        // Very dark filter — only the soft low rumble passes.
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 900;
        lp.Q.value = 0.4;

        // Subtle "shape" — slight bandpass around 500Hz for paper texture.
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 480 + Math.random() * 120;
        bp.Q.value = 0.5;

        const gain = ctx.createGain();
        // Smooth attack/decay — never harsh, never punchy.
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.006, now + swishDur * 0.35);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + swishDur);
        src.connect(bp).connect(lp).connect(gain).connect(ctx.destination);
      } catch {}
      // Long gentle pauses between swishes — like writing real sentences.
      const next = 320 + Math.random() * 280;
      idRef.current = setTimeout(play, next);
    };
    idRef.current = setTimeout(play, 250);
    return () => {
      if (idRef.current) clearTimeout(idRef.current);
    };
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
