import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playSent, playError, unlockAudio } from "../lib/chatSounds";

// 👇 הסיסמה — מה שיעקב עונה
const ALLOWED = ["משהו", "משהו!", "משהו.", "משהוו", "משהוווו"];

export default function IdGateScene({ onUnlock }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [step, setStep] = useState(0);

  // Unlock audio on the first real user gesture. Browser policy requires it,
  // otherwise the AudioContext stays suspended and playSent() is silent.
  useEffect(() => {
    const evs = ["pointerdown", "touchstart", "click", "keydown"];
    evs.forEach((ev) => window.addEventListener(ev, unlockAudio, { passive: true }));
    return () => evs.forEach((ev) => window.removeEventListener(ev, unlockAudio));
  }, []);

  // Auto-paced reveal. Never blocks on audio — if the first "sent" sound is
  // skipped on cold refresh (no interaction yet), all subsequent ones still play.
  useEffect(() => {
    const times = [900, 1100, 1500, 1200];
    if (step >= times.length) return;
    const timer = setTimeout(() => {
      const next = step + 1;
      if (next === 1 || next === 3) playSent();
      setStep(next);
    }, times[step]);
    return () => clearTimeout(timer);
  }, [step]);

  const showHisInitialTyping = step === 0;
  const showHisQ = step >= 1;
  const showHerTyping = step >= 1 && step < 3;
  const showHer = step >= 3;
  const showHisTyping = step >= 3 && step < 4;
  const showInput = step >= 4;

  const submit = (e) => {
    e?.preventDefault();
    if (unlocking) return;
    unlockAudio();
    const v = value.trim().toLowerCase();
    if (ALLOWED.some((a) => a.toLowerCase() === v)) {
      setError(false);
      setUnlocking(true);
      playSent();
      // celebratory double-ting
      setTimeout(playSent, 220);
      setTimeout(onUnlock, 700);
    } else {
      setError(true);
      playError();
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <motion.section
      className="scene gate-scene"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.9 }}
    >
      <motion.div
        className={`chat-window2 ${unlocking ? "is-success" : ""}`}
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: unlocking ? [1, 1.04, 1] : 1,
        }}
        transition={{
          opacity: { duration: 1 },
          y: { duration: 1 },
          scale: unlocking
            ? { duration: 0.6, ease: [0.34, 1.6, 0.64, 1] }
            : { duration: 1 },
        }}
      >
        {/* WhatsApp-style header */}
        <div className="wa-header">
          <button className="wa-icon-btn wa-back" aria-label="חזרה">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
              <path d="M15.5 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="wa-avatar-real">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
              <circle cx="12" cy="8" r="4" fill="rgba(255,255,255,0.85)"/>
              <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="rgba(255,255,255,0.85)"/>
            </svg>
          </div>
          <div className="wa-meta">
            <div className="wa-name">לב שלי<span className="wa-name-heart">❤️</span></div>
            <div className="wa-status">מחובר/ת</div>
          </div>
        </div>

        <div className="chat2-body">
          <AnimatePresence>
            {showHisInitialTyping && (
              <motion.div
                key="hinittyp"
                className="chat2-row chat2-row-his"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.35 }}
              >
                <div className="chat2-name chat2-name-his">יעקב</div>
                <div className="chat2-bubble chat2-bubble-his chat2-bubble-typing">
                  <span /><span /><span />
                </div>
              </motion.div>
            )}

            {showHisQ && (
              <motion.div
                key="hq"
                className="chat2-row chat2-row-his"
                initial={{ opacity: 0, y: 12, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.55, ease: [0.34, 1.4, 0.64, 1] }}
              >
                <div className="chat2-name chat2-name-his">יעקב</div>
                <div className="chat2-bubble chat2-bubble-his">
                  אפשר להגיד לך משהו?
                </div>
              </motion.div>
            )}

            {showHerTyping && (
              <motion.div
                key="hertyp"
                className="chat2-row chat2-row-hers"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.35 }}
              >
                <div className="chat2-bubble chat2-bubble-hers chat2-bubble-typing">
                  <span /><span /><span />
                </div>
              </motion.div>
            )}

            {showHer && (
              <motion.div
                key="her"
                className="chat2-row chat2-row-hers"
                initial={{ opacity: 0, y: 12, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.55, ease: [0.34, 1.4, 0.64, 1] }}
              >
                <div className="chat2-name chat2-name-hers">רות</div>
                <div className="chat2-bubble chat2-bubble-hers">כן</div>
              </motion.div>
            )}

            {showHisTyping && (
              <motion.div
                key="histyp"
                className="chat2-row chat2-row-his"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.35 }}
              >
                <div className="chat2-bubble chat2-bubble-his chat2-bubble-typing">
                  <span /><span /><span />
                </div>
              </motion.div>
            )}

            {showInput && (
              <motion.div
                key="inputrow"
                className="chat2-row chat2-row-his"
                initial={{ opacity: 0, y: 14, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.55, ease: [0.34, 1.4, 0.64, 1] }}
              >
                <div className="chat2-name chat2-name-his">יעקב</div>
                <motion.form
                  onSubmit={submit}
                  className={`chat2-bubble chat2-bubble-his chat2-bubble-input ${error ? "is-error" : ""}`}
                  animate={{ x: error ? [-10, 10, -6, 6, 0] : 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <input
                    type="text"
                    maxLength={20}
                    placeholder="התשובה שלי..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="chat2-input"
                    autoFocus
                    aria-label="התשובה של יעקב"
                  />
                  <motion.button
                    type="submit"
                    className={`chat2-send-wa ${value.length >= 1 && !unlocking ? "is-ready" : ""}`}
                    disabled={value.length < 1 || unlocking}
                    aria-label="שלח"
                    whileTap={!unlocking ? { scale: 0.9 } : undefined}
                    whileHover={value.length >= 1 && !unlocking ? { scale: 1.08 } : undefined}
                  >
                    {unlocking ? (
                      <motion.span
                        style={{ fontSize: "1.3rem", display: "grid", placeItems: "center" }}
                        animate={{ scale: [1, 1.25, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      >
                        ♥
                      </motion.span>
                    ) : (
                      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
                        <path
                          d="M2.01 21l20.99-9L2.01 3 2 10l15 2-15 2z"
                          fill="currentColor"
                        />
                      </svg>
                    )}
                  </motion.button>
                </motion.form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Clear, elegant instruction below the chat */}
        <div className="chat2-footer">
          {showInput && (
            <motion.div
              className="chat2-instr"
              key={error ? "err" : "hint"}
              initial={{ opacity: 0, y: error ? 0 : 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: error ? 0.15 : 0.6, delay: error ? 0 : 0.5 }}
            >
              {error ? (
                <span className="chat2-instr-error">
                  עוד אחת שחולמת להיות רות...
                </span>
              ) : (
                <>
                  <span className="chat2-instr-line" />
                  <span>סיימי במקומי — את כבר יודעת 😉</span>
                  <span className="chat2-instr-line" />
                </>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.section>
  );
}
