import { useState } from "react";
import { motion } from "framer-motion";
import { photoEnvelope } from "../lib/demoAssets";

export default function EnvelopeScene({ onOpen }) {
  const [opening, setOpening] = useState(false);

  const handleOpen = () => {
    if (opening) return;
    setOpening(true);
    setTimeout(onOpen, 1400);
  };

  return (
    <motion.section
      className="scene"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}
    >
      <motion.h1
        className="h-display"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: opening ? 0 : 1, y: opening ? -10 : 0 }}
        transition={{ duration: 1, delay: 0.3 }}
      >
        פתחי בעדינות
      </motion.h1>
      <motion.p
        className="h-soft"
        initial={{ opacity: 0 }}
        animate={{ opacity: opening ? 0 : 1 }}
        transition={{ duration: 1, delay: 0.6 }}
      >
        יש כאן משהו קטן בשבילך
      </motion.p>

      <motion.button
        className="real-envelope"
        onClick={handleOpen}
        aria-label="פתחי את המעטפה"
        whileHover={!opening ? { scale: 1.04, rotate: 1 } : undefined}
        whileTap={!opening ? { scale: 0.97 } : undefined}
        animate={
          opening
            ? { scale: [1, 1.1, 1.5], y: [0, -10, -120], opacity: [1, 1, 0], rotate: [0, -4, 8] }
            : { y: [0, -8, 0], rotate: [-1, 1, -1] }
        }
        transition={
          opening
            ? { duration: 1.4, ease: [0.7, 0, 0.3, 1] }
            : { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }
        }
      >
        <div className="real-env-glow" />
        <img
          src={photoEnvelope}
          alt=""
          className="real-env-img"
          onError={(e) => { e.currentTarget.style.opacity = "0"; }}
        />
        {/* Wax seal overlay on top */}
        <motion.div
          className="real-env-seal"
          animate={opening ? { scale: [1, 1.3, 0], opacity: [1, 1, 0] } : { scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          ♥
        </motion.div>
      </motion.button>

      <motion.div
        className="hint"
        initial={{ opacity: 0 }}
        animate={{ opacity: opening ? 0 : 1 }}
        transition={{ duration: 1, delay: 1.4 }}
      >
        לחיצה לפתיחה
      </motion.div>
    </motion.section>
  );
}
