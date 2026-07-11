import { useEffect, useRef } from 'react';
import gsap from 'gsap';

// Distant lightning for the Hero: a rare, soft, cold-blue double-strobe in
// the sky band, followed a beat later by a synthesized thunder rumble
// (audio.playThunder) — the flash-then-delayed-sound gap is what sells
// "miles away". Self-scheduling on a random interval; skipped entirely
// under prefers-reduced-motion. `isHeroActive` (a ref-reading callback from
// Experience, not state) gates each strike so lightning never fires — flash
// or thunder — while the visitor is in a different section, without this
// component re-rendering on every section change.
const FIRST_STRIKE_MIN_MS = 12000; // past the intro narration before the first one
const FIRST_STRIKE_MAX_MS = 20000;
const STRIKE_GAP_MIN_MS = 16000;
const STRIKE_GAP_MAX_MS = 34000;
const THUNDER_DELAY_MIN_MS = 1200; // light first, sound later — distance
const THUNDER_DELAY_MAX_MS = 2600;

const rand = (min, max) => min + Math.random() * (max - min);

export default function LightningFlash({ audio, isHeroActive }) {
  const skyRef = useRef(null);
  const washRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let alive = true;
    let strikeTimeout = null;
    let thunderTimeout = null;
    let tl = null;

    function strike() {
      if (!alive) return;
      // Reschedule regardless; only actually flash while the Hero is the
      // visible layer (otherwise the strobe would glow through the
      // crossfade and the thunder would land in the wrong scene).
      if (isHeroActive?.() !== false && skyRef.current && washRef.current) {
        tl?.kill();
        tl = gsap.timeline();
        const els = [skyRef.current, washRef.current];
        // Real lightning reads as an uneven double-pulse, not one clean fade.
        tl.set(els, { opacity: 0 })
          .to(els, { opacity: 1, duration: 0.06, ease: 'power2.out' })
          .to(els, { opacity: 0.25, duration: 0.09, ease: 'power1.in' })
          .to(els, { opacity: 0.85, duration: 0.05, ease: 'power2.out' })
          .to(els, { opacity: 0, duration: 0.8, ease: 'power2.out' });

        thunderTimeout = setTimeout(() => {
          if (alive) audio?.playThunder();
        }, rand(THUNDER_DELAY_MIN_MS, THUNDER_DELAY_MAX_MS));
      }
      strikeTimeout = setTimeout(strike, rand(STRIKE_GAP_MIN_MS, STRIKE_GAP_MAX_MS));
    }

    strikeTimeout = setTimeout(strike, rand(FIRST_STRIKE_MIN_MS, FIRST_STRIKE_MAX_MS));

    return () => {
      alive = false;
      clearTimeout(strikeTimeout);
      clearTimeout(thunderTimeout);
      tl?.kill();
    };
    // `audio`/`isHeroActive` are stable-method closures per the established
    // pattern in Experience.jsx/Terminal.jsx.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Sky band: strongest at the top edge where the storm lives, gone by
          mid-frame. screen-blend so it brightens the video instead of
          sitting on it like a sheet. */}
      <div
        ref={skyRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[5] opacity-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(185,205,255,0.5) 0%, rgba(165,185,235,0.18) 30%, rgba(150,170,220,0) 60%)',
          mixBlendMode: 'screen',
          willChange: 'opacity',
        }}
      />
      {/* Faint full-frame wash so the street/figure catch a hint of the
          flash too — much weaker than the sky band. */}
      <div
        ref={washRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[5] opacity-0"
        style={{
          background: 'rgba(190,205,245,0.14)',
          mixBlendMode: 'screen',
          willChange: 'opacity',
        }}
      />
    </>
  );
}
