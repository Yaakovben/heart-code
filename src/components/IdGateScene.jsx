import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playSent, playError, unlockAudio } from "../lib/chatSounds";

// 👇 הסיסמה — מה שיעקב עונה
const ALLOWED = ["משהו", "משהו!", "משהו.", "משהוו", "משהוווו"];

export default function IdGateScene({ onUnlock }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [step, setStep] = useState(0);
  // "Incoming call" answered → unlocks audio + starts the chat sequence.
  const [answered, setAnswered] = useState(false);

  const handleAnswer = () => {
    if (answered) return;
    unlockAudio();
    setAnswered(true);
  };

  // Auto-paced reveal — only starts AFTER the "call" is answered.
  useEffect(() => {
    if (!answered) return;
    const times = [900, 1100, 1500, 1200];
    if (step >= times.length) return;
    const timer = setTimeout(() => {
      const next = step + 1;
      if (next === 1 || next === 3) playSent();
      setStep(next);
    }, times[step]);
    return () => clearTimeout(timer);
  }, [step, answered]);

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
      {!answered && (
        <motion.div
          className="prep-gate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.5 }}
        >
          <div className="prep-gate-bg" aria-hidden />
          <div className="prep-gate-content">
            <motion.span
              className="prep-gate-heart"
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden
            >
              ❤️
            </motion.span>
            <motion.h2
              className="prep-gate-question"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              מוכנה לזיהוי קצר?
            </motion.h2>
            <motion.div
              className="prep-gate-volume-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.75 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              🔊 כדאי להעלות את הווליום
            </motion.div>
            <motion.button
              className="prep-gate-yes"
              onClick={handleAnswer}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              כן
            </motion.button>
          </div>
        </motion.div>
      )}

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
                      <svg viewBox="0 0 28 28" width="24" height="24" aria-hidden>
                        <path
                          d="M2.5 22l24-9.5L2.5 3l5 9.5L2.5 22z"
                          fill="#fff"
                          stroke="#fff"
                          strokeWidth="0.5"
                          strokeLinejoin="round"
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
