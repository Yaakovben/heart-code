import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { localVideoUrl } from "../lib/demoAssets";

export default function VideoScene() {
  const videoRef = useRef(null);
  const [hasVideo, setHasVideo] = useState(true);

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
      {/* Ambient color blobs — Spotify gradient feel */}
      <div className="v3-aura v3-aura-1" />
      <div className="v3-aura v3-aura-2" />
      <div className="v3-aura v3-aura-3" />

      <motion.div
        className="v3-overline"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.9 }}
      >
        Just for you
      </motion.div>

      <motion.h1
        className="v3-title"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.9 }}
      >
        בשבילך
      </motion.h1>

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
        <div className="v3-track-title">מסר אישי</div>
        <div className="v3-track-sub">יעקב · באהבה אינסופית</div>
      </motion.div>
    </motion.section>
  );
}
