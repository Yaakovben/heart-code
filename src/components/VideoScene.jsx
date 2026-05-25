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
      className="scene video-scene-luxe"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Romantic ambient glow */}
      <div className="video-bg-glow" aria-hidden />

      {/* Floating petals around the frame */}
      <div className="petals" aria-hidden>
        {[
          { l: "6%", t: "12%", d: 0, dur: 9, r: -15 },
          { l: "92%", t: "18%", d: 1.4, dur: 11, r: 18 },
          { l: "8%", t: "72%", d: 2.6, dur: 10, r: 12 },
          { l: "90%", t: "78%", d: 0.7, dur: 12, r: -22 },
          { l: "50%", t: "4%", d: 3.2, dur: 9, r: 6 },
          { l: "16%", t: "44%", d: 4.5, dur: 13, r: -8 },
          { l: "84%", t: "48%", d: 5.1, dur: 12, r: 14 },
        ].map((p, i) => (
          <motion.span
            key={i}
            className="petal"
            style={{ left: p.l, top: p.t }}
            animate={{
              y: [0, -10, 0],
              x: [0, 8, 0],
              rotate: [p.r, p.r + 12, p.r],
              opacity: [0.55, 0.95, 0.55],
            }}
            transition={{ duration: p.dur, repeat: Infinity, ease: "easeInOut", delay: p.d }}
          >
            🌹
          </motion.span>
        ))}
      </div>

      <motion.div
        className="video-overline"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        <span className="overline-line" />
        <span className="overline-heart">♥</span>
        <span className="overline-text">A moment for you</span>
        <span className="overline-heart">♥</span>
        <span className="overline-line" />
      </motion.div>

      <motion.h2
        className="video-title"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 1 }}
      >
        בשבילך, אהובתי
      </motion.h2>

      <motion.div
        className="video-frame-luxe"
        initial={{ y: 28, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="corner corner-tl" />
        <span className="corner corner-tr" />
        <span className="corner corner-bl" />
        <span className="corner corner-br" />

        <div className="video-inner-luxe">
          <video
            ref={videoRef}
            src={localVideoUrl}
            playsInline
            autoPlay
            controls={hasVideo}
            style={{ display: hasVideo ? "block" : "none" }}
          />
          {!hasVideo && (
            <div className="video-demo">
              <div>
                <motion.div
                  className="play-pulse"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  ▶
                </motion.div>
                <p style={{ margin: 0, fontFamily: "Cormorant Garamond, serif", fontStyle: "italic" }}>
                  הסרטון שלך
                </p>
              </div>
            </div>
          )}
        </div>

        {hasVideo && (
          <motion.button
            className="fs-btn"
            onClick={goFullscreen}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            title="מסך מלא"
          >
            ⛶
          </motion.button>
        )}
      </motion.div>

      <motion.div
        className="video-ornament"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 1 }}
      >
        <span className="orn-line" />
        <motion.span
          className="orn-diamond"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          ♥
        </motion.span>
        <span className="orn-line" />
      </motion.div>

      <motion.p
        className="video-tagline"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.05, duration: 1 }}
      >
        תהני מהערב, יפהפייה<br />
        <span className="tagline-soft">העולם כולו שלך הלילה</span>
      </motion.p>

      <motion.div
        className="video-signature"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
      >
        ~ באהבה אינסופית, שלך ~
      </motion.div>
    </motion.section>
  );
}
