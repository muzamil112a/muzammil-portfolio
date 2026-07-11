import { useEffect, useRef, useState } from 'react';

// SPEC (portfolio_implementation_prompt.md): one hardcoded line per narrated
// section, keyed by narration index — narration-1 is Hero (dispatched from
// Loading.jsx's gate timeline), 2-4 are About/Projects/Hub (dispatched from
// Experience.jsx's scroll-driven scheduleNarration). Contact/Terminal have
// no narration audio and so intentionally have no line here.
const SUBTITLE_LINES = {
  1: 'In every fog... there is one who does not lose his way. I am Muhammad Muzammil.',
  2: 'Where others see chaos... I see the architecture of what could be.',
  3: 'Every door in this mansion... was forged by my own hands.',
  4: 'Four paths lie before you... choose.',
};

const FADE_MS = 450;

// Bottom-center subtitle line, global across every narrated section — driven
// entirely by the 'narration-start' event useAudioManager.js's playNarration
// dispatches (carrying the real decoded AudioBuffer.duration), rather than a
// separate hand-timed schedule. That means this automatically covers: every
// section (not just Hero), replays on scroll-direction re-entry (since
// playNarration is already replay-capable), and stays exactly in sync with
// the actual voice-over length instead of a guessed duration. Lives outside
// Loading.jsx/Experience.jsx on purpose — a single sibling in App.jsx that
// outlives both, so it doesn't care which one triggered the narration.
export default function Subtitles() {
  const [text, setText] = useState(null);
  const [visible, setVisible] = useState(false);
  const hideTimeoutRef = useRef(null);
  const clearTimeoutRef = useRef(null);

  useEffect(() => {
    function handleNarrationStart(e) {
      const { index, duration } = e.detail;
      const line = SUBTITLE_LINES[index];
      if (!line) return;

      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);

      setText(line);
      setVisible(true);

      const durationMs = (duration > 0 ? duration : 4) * 1000;
      hideTimeoutRef.current = setTimeout(() => setVisible(false), Math.max(0, durationMs - FADE_MS));
      clearTimeoutRef.current = setTimeout(() => {
        setText((current) => (current === line ? null : current));
      }, durationMs);
    }

    window.addEventListener('narration-start', handleNarrationStart);
    return () => {
      window.removeEventListener('narration-start', handleNarrationStart);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
    };
  }, []);

  if (!text) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-16 z-40 flex justify-center px-6 sm:bottom-20"
    >
      <p
        className={`max-w-xl text-center font-serif text-sm italic tracking-wide text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)] transition-opacity duration-500 ease-out motion-reduce:transition-none sm:text-base ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {text}
      </p>
    </div>
  );
}
