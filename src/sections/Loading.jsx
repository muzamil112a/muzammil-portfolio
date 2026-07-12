import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { preloadAssets } from '../utils/preloadAssets.js';
import { storeVideoBlob } from '../utils/videoCache.js';
import Flourish from '../components/Flourish.jsx';

const GATE_BAR_COUNT = 9;

// Deterministic scatter (left offset %, animation-delay s, duration s) so the
// embers don't all rise in lockstep — kept as a constant, not regenerated
// per render.
const EMBERS = [
  { left: '18%', delay: '0s', duration: '8s' },
  { left: '32%', delay: '2.2s', duration: '9.5s' },
  { left: '47%', delay: '4.5s', duration: '8.5s' },
  { left: '58%', delay: '1.2s', duration: '10s' },
  { left: '69%', delay: '3.6s', duration: '9s' },
  { left: '81%', delay: '5.8s', duration: '8.8s' },
];

// Deterministic scatter (angle, length, animation duration/delay) for the
// warp-speed streak background — same reasoning as EMBERS above, a fixed
// constant rather than Math.random() per render. Negative delays start each
// streak already mid-flight instead of every one launching from frame 0 in
// lockstep, which is what actually reads as "already at speed" rather than
// a single synchronized pulse.
const WARP_STREAK_COUNT = 26;
function makeWarpStreaks(count) {
  const list = [];
  for (let i = 0; i < count; i += 1) {
    list.push({
      angle: (360 / count) * i + (i % 3) * 6,
      length: 36 + (i % 5) * 16,
      duration: 1.3 + (i % 6) * 0.3,
      delay: -((i % 10) * 0.28),
    });
  }
  return list;
}
const WARP_STREAKS = makeWarpStreaks(WARP_STREAK_COUNT);

// SPEC point 5: "high-velocity glowing light streaks ... orange/gold tunnel
// warp acceleration look" for the pre-onboarding loading stage specifically
// (not shown once the visitor reaches the ENTER THE FOG choice screen).
// Each streak is two nested elements on purpose: the outer wrapper carries
// the fixed rotation (its own angle, never animated) and the inner span
// carries the animated translate/scale — combining both on one element
// would mean the keyframe animation's own `transform` overwrites the fixed
// rotation instead of building on it.
function WarpBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(232,150,60,0.2) 0%, rgba(120,70,20,0.06) 40%, rgba(5,7,10,0) 72%)',
        }}
      />
      {WARP_STREAKS.map((s, i) => (
        <span key={i} className="warp-streak-wrap" style={{ transform: `rotate(${s.angle}deg)` }}>
          <span
            className="warp-streak"
            style={{ height: `${s.length}px`, animationDuration: `${s.duration}s`, animationDelay: `${s.delay}s` }}
          />
        </span>
      ))}
    </div>
  );
}

// SPEC point 5: circular ring replaces the old linear bar for the loading
// stage specifically. stroke-dashoffset driven by the same real `progress`
// (0-1) already wired to preloadAssets — no separate progress tracking.
const RING_SIZE = 132;
const RING_STROKE = 3;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function LoadingRing({ progress }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: RING_SIZE, height: RING_SIZE }}>
      <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90">
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke="rgba(201,162,39,0.15)"
          strokeWidth={RING_STROKE}
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke="#e8a63c"
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
          style={{
            transition: 'stroke-dashoffset 150ms linear',
            filter: 'drop-shadow(0 0 8px rgba(232,150,60,0.6))',
          }}
        />
      </svg>
      <span className="absolute font-mono text-sm tracking-[0.25em] text-gold-dim">
        {String(Math.round(progress * 100)).padStart(3, '0')}%
      </span>
    </div>
  );
}

function GatePanel({ side, panelRef }) {
  return (
    <div
      ref={panelRef}
      className={`absolute top-0 h-full w-1/2 ${side === 'left' ? 'left-0 origin-right' : 'right-0 origin-left'}`}
      style={{
        background: 'linear-gradient(180deg, #0a0c10 0%, #05070a 60%, #030405 100%)',
        boxShadow: side === 'left' ? '8px 0 40px rgba(0,0,0,0.7)' : '-8px 0 40px rgba(0,0,0,0.7)',
      }}
    >
      <div className="flex h-full w-full items-stretch justify-evenly px-4">
        {Array.from({ length: GATE_BAR_COUNT }).map((_, i) => (
          <div
            key={i}
            className="h-full w-[2px]"
            style={{ background: 'linear-gradient(180deg, transparent, rgba(201,162,39,0.35), transparent)' }}
          />
        ))}
      </div>
      <div
        className={`absolute top-1/2 h-24 w-24 -translate-y-1/2 rounded-full border border-gold-dim ${
          side === 'left' ? 'right-0 translate-x-1/2' : 'left-0 -translate-x-1/2'
        }`}
        style={{ boxShadow: '0 0 24px rgba(201,162,39,0.25)' }}
      />
    </div>
  );
}

// Floor on the loading stage's total on-screen time — on a warm cache (esp.
// localhost) preloadAssets can resolve in under 300ms, which reads as the
// loading screen being skipped entirely rather than an atmospheric ramp.
// This never delays real completion on a slow connection (see the tick loop
// below): it only ever adds a minimum, never a ceiling faster than the
// genuine byte-progress from preloadAssets.
const MIN_LOADING_MS = 3000;

export default function Loading({ audio }) {
  const [stage, setStage] = useState('loading'); // loading -> choice -> ready -> gate -> done
  const [progress, setProgress] = useState(0);

  const leftGateRef = useRef(null);
  const rightGateRef = useRef(null);
  const fogSpikeRef = useRef(null);
  const titleRef = useRef(null);
  const enteringRef = useRef(false);
  const rawProgressRef = useRef(0);
  const realDoneRef = useRef(false);

  useEffect(() => {
    gsap.fromTo(
      titleRef.current,
      { opacity: 0, y: 16, letterSpacing: '0.2em' },
      { opacity: 1, y: 0, letterSpacing: '0.5em', duration: 1.4, ease: 'power2.out' }
    );
  }, []);

  useEffect(() => {
    document.body.classList.add('no-scroll');
    const startTime = performance.now();

    preloadAssets({
      onProgress: (pct) => {
        rawProgressRef.current = pct;
      },
      onAudioBuffer: (key, arrayBuffer) => {
        audio.storeRawBuffer(key, arrayBuffer);
      },
      onVideoBuffer: (key, arrayBuffer, mimeType) => {
        storeVideoBlob(key, arrayBuffer, mimeType);
      },
    }).then(() => {
      realDoneRef.current = true;
    });

    // Paces the displayed ring toward 100% over at least MIN_LOADING_MS,
    // without ever outrunning genuinely-not-yet-loaded assets: while the real
    // fetch is in flight, displayed progress is capped at min(rawProgress,
    // timeFloor) — the ceiling is always real bytes loaded, never faster.
    // Once preloadAssets has actually resolved, the floor (elapsed/MIN)
    // takes over so a fast/cached load still ramps up over the full
    // duration instead of snapping straight to 100%. setInterval rather than
    // requestAnimationFrame on purpose — rAF is throttled/suspended in a
    // backgrounded tab, which would otherwise stall this whole screen (and
    // the stage transition gated on it) if the visitor switches tabs while
    // the site loads.
    const intervalId = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const timeFloor = Math.min(1, elapsed / MIN_LOADING_MS);
      const displayed = realDoneRef.current
        ? Math.max(timeFloor, rawProgressRef.current)
        : Math.min(rawProgressRef.current, timeFloor);
      setProgress(displayed);

      if (displayed >= 1 && realDoneRef.current) {
        clearInterval(intervalId);
        setStage('choice');
      }
    }, 80);

    return () => {
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (stage !== 'done') return undefined;
    document.body.classList.remove('no-scroll');
    return undefined;
  }, [stage]);

  // Fired directly from the click handler (before any `await`) since Safari
  // in particular only honors a fullscreen request made synchronously within
  // a user-gesture call stack — awaiting anything first gets it silently
  // rejected. Failure (unsupported browser, iframe embedding, user declining
  // via browser UI) is expected and non-fatal, so this only logs, never
  // blocks entry into the site.
  function requestFullscreenSafely() {
    const el = document.documentElement;
    const request =
      el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
    if (!request) return;
    try {
      const result = request.call(el);
      if (result && typeof result.catch === 'function') {
        result.catch(() => {
          // Declined or unsupported in this context — the site works fine
          // windowed, so this is intentionally silent.
        });
      }
    } catch {
      // Some browsers throw synchronously instead of rejecting a promise.
    }
  }

  // "ENTER THE FOG" no longer starts the gate sequence directly — it reveals
  // a second "PLAY CINEMATIC" button first (SPEC: two-step intro). "enter
  // silently" is a deliberate bypass of that ceremony (its whole point is a
  // fast, quiet way in), so it still calls handleEnter directly, same as
  // before.
  function handleChoice(startMuted) {
    if (stage !== 'choice') return;
    if (startMuted) {
      handleEnter(true);
      return;
    }
    setStage('ready');
  }

  async function handleEnter(startMuted) {
    // `stage` is a closure read, not a lock — two clicks landing before
    // setStage('gate') commits would both pass this check and each spin up
    // their own gate timeline + 'gate-opened' dispatch, which is what caused
    // the reported "Section 2 sticking" (two competing GSAP auto-scroll
    // tweens fighting over the same window scroll position). enteringRef is
    // synchronous and set before anything else can run, so it closes that
    // gap regardless of which stage this was called from.
    if ((stage !== 'choice' && stage !== 'ready') || enteringRef.current) return;
    enteringRef.current = true;
    requestFullscreenSafely();
    setStage('gate');
    await audio.init(startMuted);
    audio.playGateCreak();

    const tl = gsap.timeline({
      // onComplete only unmounts this overlay — the cinematic itself
      // ('gate-opened' below) is already several seconds underway by then.
      onComplete: () => setStage('done'),
    });

    tl.to(fogSpikeRef.current, { opacity: 0.6, duration: 0.6, ease: 'power1.out' }, 0);
    tl.to(
      [leftGateRef.current, rightGateRef.current],
      { xPercent: (i) => (i === 0 ? -100 : 100), duration: 2.5, ease: 'power2.inOut' },
      0.1
    );
    // SPEC (layered cinematic timeline): narration, subtitles, doors, and
    // the character's walk all run CONCURRENTLY, not as a chain. 'gate-opened'
    // — which kicks off Experience.jsx's auto-scroll walk — fires at 0.7s so
    // the man is already mid-stride as the doors part; it does not need
    // narration-1 to have started first (Experience.jsx's waitForNarration
    // only listens for 'narration-end', so it's fine to attach that listener
    // before playback even begins).
    // Narration-1 itself starts later, at 1.0s: measuring the actual clips
    // showed the 0.7s position (previously shared with 'gate-opened') still
    // landed inside gate-creak.mp3's loud sustained span (it stays strong
    // through ~1.9s of its own 3s length, not just a brief opening
    // transient) — narration-1 has ZERO leading silence ("In every fog" is
    // its first word), so starting the voice there was still burying the
    // opening phrase (reported as "narrator starts mid-sentence"). Paired
    // with useAudioManager.js now ducking the creak the instant narration
    // starts, the extra 0.3s gives the duck ramp a moment to land before the
    // voice needs to be clearly heard.
    tl.call(() => window.dispatchEvent(new Event('gate-opened')), [], 0.7);
    tl.call(() => audio.playNarration(1), [], 1.0);
    tl.to(fogSpikeRef.current, { opacity: 0, duration: 0.9, ease: 'power1.in' }, 1.6);
  }

  if (stage === 'done') return null;

  return (
    <section className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-fog-900">
      <div
        aria-hidden="true"
        className="loading-ambient pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(120,130,145,0.16) 0%, rgba(5,7,10,0) 62%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      <div
        ref={fogSpikeRef}
        className="pointer-events-none absolute inset-0 z-30 opacity-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(90,100,115,0.5) 0%, rgba(10,12,16,0.85) 70%)',
        }}
      />

      {stage === 'loading' && <WarpBackground />}

      {stage !== 'gate' &&
        stage !== 'loading' &&
        EMBERS.map((ember, i) => (
          <div
            key={i}
            aria-hidden="true"
            className="loading-ember"
            style={{ left: ember.left, animationDelay: ember.delay, animationDuration: ember.duration }}
          />
        ))}

      {stage !== 'gate' && (
        <div className="relative flex flex-col items-center gap-10 px-6 text-center">
          <div className="flex flex-col items-center gap-5">
            <Flourish />
            <h1 ref={titleRef} className="font-display text-3xl text-gold sm:text-5xl">
              MUZAMMIL
            </h1>
            <Flourish />
          </div>

          {stage === 'loading' && (
            <div className="loading-fade-up flex flex-col items-center gap-4">
              <LoadingRing progress={progress} />
              <p className="font-mono text-[10px] tracking-[0.35em] text-gold-dim/70">GATHERING THE FOG</p>
            </div>
          )}

          {stage === 'choice' && (
            <div className="loading-fade-up flex flex-col items-center gap-6">
              <button
                type="button"
                onClick={() => handleChoice(false)}
                className="ornate-btn group rounded-sm px-12 py-4 font-display text-sm tracking-[0.4em] text-gold"
              >
                <span aria-hidden="true" className="ornate-corner ornate-corner-tl" />
                <span aria-hidden="true" className="ornate-corner ornate-corner-tr" />
                <span aria-hidden="true" className="ornate-corner ornate-corner-bl" />
                <span aria-hidden="true" className="ornate-corner ornate-corner-br" />
                <span aria-hidden="true" className="ornate-sheen rounded-sm" />
                <span className="relative z-10 inline-flex items-center gap-4">
                  <span aria-hidden="true" className="h-1 w-1 rotate-45 bg-gold-dim transition group-hover:bg-gold" />
                  ENTER THE FOG
                  <span aria-hidden="true" className="h-1 w-1 rotate-45 bg-gold-dim transition group-hover:bg-gold" />
                </span>
              </button>

              <div aria-hidden="true" className="flex items-center gap-3 text-gold-faint">
                <span className="h-px w-8 bg-current" />
                <span className="h-1 w-1 rotate-45 bg-current" />
                <span className="h-px w-8 bg-current" />
              </div>

              {/* py-3 (rather than sizing the text itself up) gives this a
                  real >=44px tap target without changing how the link reads
                  visually — "ENTER THE FOG" above already has plenty of
                  padding from its own px-12 py-4, this was the one
                  small-text-only tap target on this screen. */}
              <button
                type="button"
                onClick={() => handleChoice(true)}
                className="py-3 font-serif text-xs tracking-[0.2em] text-gold-dim underline-offset-4 transition hover:text-gold hover:underline"
              >
                enter silently
              </button>
              <p className="mt-1 font-serif text-xs italic tracking-wide text-white/40">
                Sound on. Best with the lights low.
              </p>
            </div>
          )}

          {stage === 'ready' && (
            <div className="loading-fade-up flex flex-col items-center gap-7">
              <p className="font-serif text-sm italic tracking-wide text-white/50">
                The gate is ready. Step through when you are.
              </p>
              <button
                type="button"
                onClick={() => handleEnter(false)}
                className="group flex flex-col items-center gap-6"
              >
                <span className="play-emblem">
                  <span aria-hidden="true" className="play-halo" />
                  <svg
                    aria-hidden="true"
                    className="play-ring-dashed absolute inset-0 h-full w-full"
                    viewBox="0 0 148 148"
                  >
                    <circle
                      cx="74"
                      cy="74"
                      r="70"
                      fill="none"
                      stroke="rgba(201,162,39,0.4)"
                      strokeWidth="1"
                      strokeDasharray="3 9"
                    />
                  </svg>
                  <svg
                    aria-hidden="true"
                    className="absolute inset-[14px] h-[calc(100%-28px)] w-[calc(100%-28px)] transition duration-500 group-hover:drop-shadow-[0_0_16px_rgba(201,162,39,0.45)]"
                    viewBox="0 0 120 120"
                  >
                    <circle
                      cx="60"
                      cy="60"
                      r="58"
                      fill="rgba(201,162,39,0.05)"
                      stroke="rgba(201,162,39,0.65)"
                      strokeWidth="1"
                    />
                  </svg>
                  <svg
                    aria-hidden="true"
                    width="32"
                    height="36"
                    viewBox="0 0 34 38"
                    className="relative ml-1.5 transition-transform duration-500 ease-out group-hover:scale-110"
                    style={{ filter: 'drop-shadow(0 0 10px rgba(232,166,60,0.55))' }}
                  >
                    <path
                      d="M3 3 L31 19 L3 35 Z"
                      fill="rgba(232,166,60,0.12)"
                      stroke="#e8a63c"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="flex flex-col items-center gap-2">
                  <span className="font-display text-sm tracking-[0.45em] text-gold transition group-hover:text-[#e8c35a] group-hover:drop-shadow-[0_0_10px_rgba(201,162,39,0.5)]">
                    PLAY CINEMATIC
                  </span>
                  <span className="h-px w-16 bg-gold-faint transition-all duration-500 group-hover:w-28 group-hover:bg-gold-dim" />
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {stage === 'gate' && (
        <div className="absolute inset-0 z-20">
          <GatePanel side="left" panelRef={leftGateRef} />
          <GatePanel side="right" panelRef={rightGateRef} />
        </div>
      )}
    </section>
  );
}
