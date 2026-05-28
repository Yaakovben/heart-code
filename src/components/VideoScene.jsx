import { useEffect, useRef, useState } from "react";
import { motion, usePresence } from "framer-motion";
import { localVideoUrl } from "../lib/demoAssets";

export default function VideoScene() {
  const videoRef = useRef(null);
  const [hasVideo, setHasVideo] = useState(true);
  const [isPresent, safeToRemove] = usePresence();

  // The moment AnimatePresence starts our exit animation, pause + detach the
  // video so its audio track stops well before unmount. Then schedule the
  // actual removal after the exit animation duration — usePresence makes us
  // responsible for calling safeToRemove(), otherwise the scene stays in the
  // DOM forever and the letter never mounts.
  useEffect(() => {
    if (isPresent) return;
    const v = videoRef.current;
    if (v) {
      try {
        v.pause();
        v.removeAttribute("src");
        v.load();
      } catch {}
    }
    const t = setTimeout(() => safeToRemove?.(), 900);
    return () => clearTimeout(t);
  }, [isPresent, safeToRemove]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onMeta = () => {
      if (!isFinite(v.duration) || v.duration < 1) setHasVideo(false);
    };
    const onErr = () => setHasVideo(false);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("error", onErr);
    v.play().catch(() => {
      v.muted = true;
      v.play().catch(() => {});
    });
    return () => {
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("error", onErr);
      // Explicitly stop the video on unmount — without this, mobile browsers
      // sometimes keep the audio track playing for a beat after the element
      // is removed, layering it on top of the background music when the
      // reader returns to the letter.
      try {
        v.pause();
        v.removeAttribute("src");
        v.load();
      } catch {}
    };
  }, []);

  const goFullscreen = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.requestFullscreen) v.requestFullscreen();
    else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
  };

  return (
    <motion.section
      className="scene v3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}
    >
      {/* Romantic blurred gradient blobs */}
      <div className="v3-aura v3-aura-1" />
      <div className="v3-aura v3-aura-2" />
      <div className="v3-aura v3-aura-3" />

      {/* Hearts flying in from every direction */}
      <div className="v3-hearts" aria-hidden>
        {Array.from({ length: 28 }).map((_, i) => {
          const dir = i % 4; // 0=bottom→up, 1=top→down, 2=left→right, 3=right→left
          const cross = ((i * 41) % 95) + 2; // 2-97 % across the perpendicular axis
          const delay = (i * 0.4) % 14;
          const dur = 10 + (i % 6) * 1.6;
          const size = 12 + (i % 5) * 5; // 12,17,22,27,32 px
          const tones = ["#ff5a82", "#ff7aa0", "#ff9aae", "#ffb8c8", "#ffc4d2"];
          const tone = tones[i % tones.length];

          let from, to, side;
          if (dir === 0) { // bottom → top
            side = { left: `${cross}%`, bottom: 0, top: "auto" };
            from = { y: "10vh", x: 0 };
            to   = { y: "-110vh", x: ((i % 3) - 1) * 40 };
          } else if (dir === 1) { // top → bottom
            side = { left: `${cross}%`, top: 0, bottom: "auto" };
            from = { y: "-10vh", x: 0 };
            to   = { y: "110vh", x: ((i % 3) - 1) * 40 };
          } else if (dir === 2) { // left → right
            side = { top: `${cross}%`, left: 0, right: "auto" };
            from = { x: "-10vw", y: 0 };
            to   = { x: "110vw", y: ((i % 3) - 1) * 60 };
          } else { // right → left
            side = { top: `${cross}%`, right: 0, left: "auto" };
            from = { x: "10vw", y: 0 };
            to   = { x: "-110vw", y: ((i % 3) - 1) * 60 };
          }

          return (
            <motion.svg
              key={i}
              className="v3-heart-svg"
              viewBox="0 0 32 28"
              style={{ ...side, width: size, height: size, color: tone }}
              initial={{ ...from, opacity: 0 }}
              animate={{
                ...to,
                opacity: [0, 0.9, 0.9, 0],
                rotate: [-8, 10, -4, 8],
              }}
              transition={{
                duration: dur,
                delay,
                repeat: Infinity,
                ease: "linear",
                opacity: { duration: dur, delay, repeat: Infinity, times: [0, 0.15, 0.85, 1] },
              }}
            >
              <path
                d="M16 26 C 5 18, 0 12, 0 7 C 0 3, 3 0, 7 0 C 11 0, 14 2, 16 5 C 18 2, 21 0, 25 0 C 29 0, 32 3, 32 7 C 32 12, 27 18, 16 26 Z"
                fill="currentColor"
              />
            </motion.svg>
          );
        })}
      </div>

      <motion.div
        className="v3-overline"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.9 }}
      >
        <span className="v3-overline-heart">♥</span>
        <span>בשבילך, אהובתי</span>
        <span className="v3-overline-heart">♥</span>
      </motion.div>


      <motion.div
        className="v3-frame"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <video
          ref={videoRef}
          src={localVideoUrl}
          playsInline
          autoPlay
          preload="auto"
          // @ts-ignore — non-standard but supported on Chromium-based browsers
          fetchpriority="high"
          controls={hasVideo}
          style={{ display: hasVideo ? "block" : "none" }}
        />
        {!hasVideo && (
          <div className="v3-demo">
            <motion.div
              className="v3-play"
              animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              ▶
            </motion.div>
            <p>הסרטון שלך</p>
          </div>
        )}
        {hasVideo && (
          <button
            className="v3-fs"
            onClick={goFullscreen}
            aria-label="מסך מלא"
            title="מסך מלא"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </motion.div>

      <motion.div
        className="v3-meta"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.9 }}
      >
        <div className="v3-track-title">תהני מהערב, יפהפייה</div>
        <div className="v3-track-sub">~ באהבה אינסופית, יעקב ~</div>
      </motion.div>
    </motion.section>
  );
}
