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
// The cinematic auto-scroll only dwells in Hero for ~9-10s (HERO_WALK_MS +
// narration-1's own ~9.3s, whichever is longer, in Experience.jsx) before
// advancing to About. The first-strike window is anchored to 'gate-opened'
// (see below), not to this component's own mount — Hero/LightningFlash
// mount as soon as the app loads, well before the visitor has clicked
// through Loading's own gate stages (its own MIN_LOADING_MS floor, plus
// however long they take to click "ENTER THE FOG" then "PLAY CINEMATIC").
// Anchoring to mount meant the random window routinely elapsed while the
// Loading overlay still covered the screen — and often before audio.init()
// had even run (only called from Loading's handleEnter), so playThunder()
// silently no-op'd on a null AudioContext. By the time the visitor actually
// saw the walk, the schedule had already moved on to the next 14-28s gap,
// well past Hero's short dwell — reported as "there's no lightning effect"
// despite the system being wired up correctly.
const FIRST_STRIKE_MIN_MS = 3000;
const FIRST_STRIKE_MAX_MS = 6000;
const STRIKE_GAP_MIN_MS = 14000;
const STRIKE_GAP_MAX_MS = 28000;
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

    function startSchedule() {
      strikeTimeout = setTimeout(strike, rand(FIRST_STRIKE_MIN_MS, FIRST_STRIKE_MAX_MS));
    }

    // 'gate-opened' fires exactly once per visit, dispatched from Loading.jsx
    // partway through its gate timeline — by then audio.init() has already
    // been awaited (Loading's handleEnter), so the AudioContext exists the
    // moment this schedule's thunder call can fire. If the visitor has
    // prefers-reduced-motion this effect already returned above, so this
    // listener is never attached in that case.
    window.addEventListener('gate-opened', startSchedule, { once: true });

    return () => {
      alive = false;
      window.removeEventListener('gate-opened', startSchedule);
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
