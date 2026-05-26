import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Howl } from "howler";
import message from "../data/message.txt?raw";
import writingSoundUrl from "../assets/writing.mp3";
import HandwritingCanvas from "./HandwritingCanvas";

const lines = message
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean);

// Gentle writing sound: real pencil-on-paper MP3, but routed through a heavy
// lowpass filter so any click/tap-like high frequencies (footstep-ish noises)
// are stripped out — what's left is a soft warm scrape.
function useQuillTicker(active) {
  const ctxRef = useRef(null);
  const bufferRef = useRef(null);
  const sourceRef = useRef(null);
  const gainRef = useRef(null);

  // Load once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const res = await fetch(writingSoundUrl);
        const arr = await res.arrayBuffer();
        const decoded = await ctx.decodeAudioData(arr);
        if (cancelled) return;
        ctxRef.current = ctx;
        bufferRef.current = decoded;
      } catch (e) {
        console.error("writing sound load fail", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const ctx = ctxRef.current;
    const buf = bufferRef.current;
    if (!ctx || !buf) return;

    if (active) {
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      if (sourceRef.current) return; // already playing
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;

      // Strong lowpass — removes click/tap/heel-like attacks; leaves soft scrape.
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 900;
      lp.Q.value = 0.5;

      // High-shelf cut to further tame any leftover brightness.
      const hs = ctx.createBiquadFilter();
      hs.type = "highshelf";
      hs.frequency.value = 1500;
      hs.gain.value = -18;

      const gain = ctx.createGain();
      gain.gain.value = 0;
      src.connect(lp).connect(hs).connect(gain).connect(ctx.destination);
      src.start();

      // Fade in.
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.6);

      sourceRef.current = src;
      gainRef.current = gain;
    } else if (sourceRef.current) {
      // Fade out then stop.
      const now = ctx.currentTime;
      const gain = gainRef.current;
      if (gain) {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value || 0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
      }
      const src = sourceRef.current;
      sourceRef.current = null;
      setTimeout(() => { try { src.stop(); } catch {} }, 900);
    }
  }, [active]);

  useEffect(() => () => {
    try { sourceRef.current?.stop(); } catch {}
    ctxRef.current?.close().catch(() => {});
  }, []);
}

function useViewportSize() {
  const [size, setSize] = useState(() => ({
    w: typeof window !== "undefined" ? window.innerWidth : 1024,
    h: typeof window !== "undefined" ? window.innerHeight : 768,
  }));
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return size;
}

export default function LetterScene() {
  const [done, setDone] = useState(false);
  useQuillTicker(!done);
  const { w: vw } = useViewportSize();
  // Fluid font + hand sizing across phones, tablets, desktops.
  const fontSize = Math.round(Math.max(18, Math.min(30, vw * 0.045)));
  const handWidth = Math.round(Math.max(110, Math.min(180, vw * 0.28)));

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
          <span className="letter-bsd">בס״ד</span>
          <div className="letter-verse">
            "רַבּוֹת בָּנוֹת עָשׂוּ חָיִל, וְאַתְּ עָלִית עַל־כֻּלָּנָה"
          </div>
          <div className="hw-scroll">
            <HandwritingCanvas
              lines={lines}
              fontSize={fontSize}
              handWidth={handWidth}
              lineGap={1.25}
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
