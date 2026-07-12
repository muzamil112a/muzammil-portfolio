import { useEffect, useRef, useState } from 'react';

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*+=-<>/\\';
const TICK_MS = 40;
const CHAR_LOCK_STAGGER = 2; // ticks between each subsequent character locking into place

function randomChar() {
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
}

// Decrypt-style reveal: characters flicker through random glyphs, locking
// into the real text left-to-right, one every CHAR_LOCK_STAGGER ticks —
// renders as plain text with no background/color of its own, so it inherits
// whatever gradient/shimmer treatment the parent heading already applies via
// background-clip: text (Hero's .hero-name-shimmer, Contact's
// .gold-shimmer-text, etc.) — the glyphs it cycles through paint with that
// same clipped gradient too, rather than needing their own separate style.
// `start` is a trigger, not a toggle: once it goes true the reveal plays
// once and never re-runs, even if `start` later flips back to false and
// true again — matches every other one-shot entrance animation in this
// codebase (Hub's name, Contact's stagger-in, etc.).
export default function ScrambleText({ text, as: Tag = 'span', className, start = true, delay = 0 }) {
  const [display, setDisplay] = useState(text);
  const playedRef = useRef(false);

  useEffect(() => {
    if (!start || playedRef.current) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(text);
      return undefined;
    }
    playedRef.current = true;

    let tick = 0;
    let intervalId = null;

    function step() {
      tick += 1;
      const lockedUpTo = Math.min(text.length, Math.floor(tick / CHAR_LOCK_STAGGER));
      let out = '';
      for (let i = 0; i < text.length; i += 1) {
        if (text[i] === ' ') out += ' ';
        else if (i < lockedUpTo) out += text[i];
        else out += randomChar();
      }
      setDisplay(out);
      if (lockedUpTo >= text.length) clearInterval(intervalId);
    }

    const timeoutId = setTimeout(() => {
      intervalId = setInterval(step, TICK_MS);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [start, text, delay]);

  return <Tag className={className}>{display}</Tag>;
}
