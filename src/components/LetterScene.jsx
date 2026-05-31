import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import message from "../data/message.txt?raw";
import writingSoundUrl from "../assets/writing.mp3";
import HandwritingCanvas from "./HandwritingCanvas";
import handPenUrl from "../assets/hand-pen.png";

const FLOURISH_D = "M 10 22 C 2 12, 14 2, 28 6 C 42 12, 40 26, 32 24 L 104 20";
const FLOURISH_DELAY_MS = 250;   // matches motion path delay (0.1 + 0.15)
const FLOURISH_DURATION_MS = 850;

const messageLines = message
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean);

// Signature is written by the same hand & font as the body — appended last.
const SIG_LINE_TOP = "שלך לתמיד";
const SIG_LINE_NAME = "יעקב";
const lines = [
  ...messageLines,
  "",
  SIG_LINE_TOP,
  SIG_LINE_NAME,
];

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
      } catch {}
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

  // Resume this context when returning from a backgrounded tab / screen-off —
  // otherwise it stays suspended and the writing sound is silent on return.
  useEffect(() => {
    const wake = () => {
      const ctx = ctxRef.current;
      if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
    };
    const onVisibility = () => { if (document.visibilityState === "visible") wake(); };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", wake);
    window.addEventListener("focus", wake);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", wake);
      window.removeEventListener("focus", wake);
    };
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

export default function LetterScene({ muted = false }) {
  const [done, setDone] = useState(false);
  const [handPos, setHandPos] = useState({ x: 0, y: 0, visible: false });
  const flourishPathRef = useRef(null);
  const flourishSvgRef = useRef(null);
  // Writing sound only plays when the music is muted — otherwise it would
  // layer over the background track and feel noisy.
  useQuillTicker(!done && muted);

  // Animate the hand along the flourish path so the curve looks drawn by it.
  useEffect(() => {
    if (!done) return;
    let raf;
    let started = false;
    const tick = (t) => {
      const path = flourishPathRef.current;
      if (!path) {
        raf = requestAnimationFrame(tick);
        return;
      }
      if (!started) {
        started = t;
      }
      const elapsed = t - started;
      if (elapsed < FLOURISH_DELAY_MS) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const totalLen = path.getTotalLength();
      const progress = Math.min(1, (elapsed - FLOURISH_DELAY_MS) / FLOURISH_DURATION_MS);
      const svgPoint = path.getPointAtLength(progress * totalLen);
      // Map SVG-coord point → pixel position relative to the overlay container.
      const svg = flourishSvgRef.current;
      const rect = svg?.getBoundingClientRect();
      const parentRect = svg?.parentElement?.getBoundingClientRect();
      if (rect && parentRect) {
        const px = rect.left - parentRect.left + (svgPoint.x / 108) * rect.width;
        const py = rect.top - parentRect.top + (svgPoint.y / 38) * rect.height;
        setHandPos({ x: px, y: py, visible: progress < 1 });
      }
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [done]);

  const { w: vw } = useViewportSize();
  // Fluid font + hand sizing across phones, tablets, desktops.
  const fontSize = Math.round(Math.max(18, Math.min(30, vw * 0.045)));
  const handWidth = Math.round(Math.max(110, Math.min(180, vw * 0.28)));

  return (
    <motion.section
      className="scene"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="letter-stage-real"
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="letter-paper-real">
          <div className="letter-scroll">
            <div className="letter-bsd">בס״ד</div>
            <div className="letter-verse">
              "רַבּוֹת בָּנוֹת עָשׂוּ חָיִל, וְאַתְּ עָלִית עַל־כֻּלָּנָה"
            </div>
            <div className="hw-scroll">
              <HandwritingCanvas
                lines={lines}
                fontSize={fontSize}
                handWidth={handWidth}
                lineGap={1.25}
                leftAlignLastN={2}
                onDone={() => setDone(true)}
              />
              {/* Flourish: small loop under ב, then a long sweep right under
                  "יעקב" — like the red sketch the user drew. */}
              {done && (
                <>
                  <motion.svg
                    ref={flourishSvgRef}
                    className="letter-flourish-overlay"
                    viewBox="0 0 108 38"
                    aria-hidden
                    preserveAspectRatio="none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.15 }}
                  >
                    <motion.path
                      ref={flourishPathRef}
                      d={FLOURISH_D}
                      fill="none"
                      stroke="#1a0e08"
                      strokeWidth="1.05"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.15, duration: 0.85, ease: [0.5, 0, 0.3, 1] }}
                    />
                  </motion.svg>
                  {handPos.visible && (
                    <div
                      className="letter-flourish-hand"
                      style={{
                        left: `${handPos.x}px`,
                        top: `${handPos.y}px`,
                      }}
                    >
                      <img
                        src={handPenUrl}
                        alt=""
                        draggable={false}
                        style={{
                          width: `${handWidth}px`,
                          height: "auto",
                          display: "block",
                          transformOrigin: "12px 10px",
                          transform: "translate(-10px, -8px) rotate(-10deg)",
                          filter: "sepia(0.14) saturate(0.95) contrast(1.04) brightness(1.02)",
                          imageRendering: "auto",
                          WebkitMaskImage:
                            "linear-gradient(125deg, #000 0%, #000 78%, rgba(0,0,0,0.55) 90%, transparent 100%)",
                          maskImage:
                            "linear-gradient(125deg, #000 0%, #000 78%, rgba(0,0,0,0.55) 90%, transparent 100%)",
                          userSelect: "none",
                          pointerEvents: "none",
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}
