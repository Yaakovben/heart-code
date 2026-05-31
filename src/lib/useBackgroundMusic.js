import { useEffect, useRef } from "react";
import { unlockAudio as unlockChatAudio } from "./chatSounds";

const PLAY_RETRY_LIMIT = 6;
const PLAY_RETRY_INTERVAL_MS = 200;
const UNLOCK_EVENTS = ["pointerdown", "touchstart", "click", "keydown"];
const RESUME_EVENTS = ["pointerdown", "touchstart"];

// Background-music controller for the single <audio> element.
//
// iOS Safari constraints handled here:
//   1. Playback requires a user gesture — we start it muted on the first
//      tap so subsequent unmutes don't need a fresh gesture.
//   2. `audio.volume` is read-only on iOS — only `muted` is respected,
//      so audibility is gated entirely through `.muted`.
//   3. iOS may pause the element on backgrounding / interruption —
//      we resume on visibility, pageshow, focus, and any tap.
export function useBackgroundMusic(audioRef, { audible, volume }) {
  const unlockedRef = useRef(false);

  useEffect(() => {
    const unlock = () => {
      unlockChatAudio();
      if (unlockedRef.current) return;
      const a = audioRef.current;
      if (!a) return;
      unlockedRef.current = true;
      a.muted = true;
      a.volume = 0;
      a.play().catch(() => {});
    };
    UNLOCK_EVENTS.forEach((ev) => window.addEventListener(ev, unlock, { passive: true }));
    return () => UNLOCK_EVENTS.forEach((ev) => window.removeEventListener(ev, unlock));
  }, [audioRef]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = !audible;
    a.volume = volume;
    if (!audible) return;

    let attempts = 0;
    const ensurePlaying = () => {
      if (!a.paused) return;
      a.play().catch(() => {
        if (++attempts <= PLAY_RETRY_LIMIT) {
          setTimeout(ensurePlaying, PLAY_RETRY_INTERVAL_MS);
        }
      });
    };
    ensurePlaying();
  }, [audioRef, audible, volume]);

  useEffect(() => {
    if (!audible) return;
    const resume = () => {
      const a = audioRef.current;
      if (a && a.paused) a.play().catch(() => {});
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") resume();
    };
    RESUME_EVENTS.forEach((ev) => window.addEventListener(ev, resume, { passive: true }));
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", resume);
    window.addEventListener("focus", resume);
    return () => {
      RESUME_EVENTS.forEach((ev) => window.removeEventListener(ev, resume));
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", resume);
      window.removeEventListener("focus", resume);
    };
  }, [audioRef, audible]);
}
