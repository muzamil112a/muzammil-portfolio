import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { resolveResponse, CV_PDF_URL } from '../data/wardenKnowledge.js';
gsap.registerPlugin(ScrollTrigger);

const BOOT_LINES = [
  'loading muzammil data...',
  'qa test suite ............. sync',
  'seo index ................. bound',
  'noc uplink ................ ok',
  'narrator link ............. ready',
  'ready for user input',
];

const GREETING = "I am WARDEN.AI — the keeper of this estate. Type 'help' to begin.";

// WARDEN.AI's entire brain lives in src/data/wardenKnowledge.js — a purely
// local data store (commands + keyword-scored topics from Profile.pdf), no
// LLM, no network. This file only renders whatever resolveResponse returns;
// update the bot by editing the data module, never this component.
const CHAR_MS = 20;
const BOOT_CHAR_MS = 12;
const BOOT_LINE_GAP_MS = 180;
const THINKING_MIN_MS = 500;
const THINKING_MAX_MS = 1100;

// SPEC section 7: "leaning in to the machine" — background scales 1.0 to
// ~1.35 with transform-origin at the screen's center as the section scrolls
// into place, so the (deliberately tiny) screen text reads larger by the
// time the terminal is interactive. Origin matches .terminal-mount's
// left/top/width/height in index.css.
const CAMERA_MAX_SCALE = 1.35;
const SCREEN_ORIGIN = '54% 42%';

let lineId = 0;
const nextId = () => ++lineId;

export default function Terminal({ audio }) {
  const [history, setHistory] = useState([]); // { id, text }
  const [typingText, setTypingText] = useState(null); // string being typed, or null when idle
  const [booted, setBooted] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputHistory, setInputHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [busy, setBusy] = useState(true);
  const [poweredOn, setPoweredOn] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const [thinking, setThinking] = useState(false);

  const sectionRef = useRef(null);
  const bgImgRef = useRef(null);
  const mountRef = useRef(null);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const hasBootedRef = useRef(false);
  const cancelledRef = useRef(false);

  useEffect(() => () => {
    cancelledRef.current = true;
  }, []);

  const typeLine = useCallback((text, charMs) => {
    return new Promise((resolve) => {
      let i = 0;
      setTypingText('');
      const step = () => {
        if (cancelledRef.current) return resolve();
        i += 1;
        setTypingText(text.slice(0, i));
        // Every other character, not every one — at CHAR_MS/BOOT_CHAR_MS
        // (12-20ms) a sound per character would be 50-80 plays/sec, enough
        // to glitch the audio graph. Skips whitespace too so words don't
        // read as one continuous buzz.
        if (i % 2 === 0 && text[i - 1] && text[i - 1] !== ' ') audio?.playTypingTick();
        if (i >= text.length) {
          resolve();
          return;
        }
        setTimeout(step, charMs);
      };
      setTimeout(step, charMs);
    });
    // `audio` is a fresh object identity every App render but its methods
    // are individually stable useCallbacks (see the boot effect below for
    // the same established pattern), so it's safe to read via closure here
    // without making this re-run on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const printLines = useCallback(
    async (lines, charMs, gapMs = 0) => {
      for (const line of lines) {
        // eslint-disable-next-line no-await-in-loop
        await typeLine(line, charMs);
        if (cancelledRef.current) return;
        const finished = line;
        setHistory((prev) => [...prev, { id: nextId(), text: finished }]);
        setTypingText(null);
        if (gapMs) {
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, gapMs));
        }
      }
    },
    [typeLine]
  );

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasBootedRef.current) {
            hasBootedRef.current = true;
            observer.disconnect();
            setPoweredOn(true);
            audio?.playTerminalBoot();
            (async () => {
              // CRT warm-up (the .crt-power-on flash/bloom) plays for ~650ms;
              // hold boot text until it's mostly resolved so the first line
              // doesn't type over a still-dark screen.
              await new Promise((r) => setTimeout(r, 550));
              if (cancelledRef.current) return;
              await printLines(BOOT_LINES, BOOT_CHAR_MS, BOOT_LINE_GAP_MS);
              if (cancelledRef.current) return;
              await printLines([GREETING], CHAR_MS);
              if (cancelledRef.current) return;
              setBooted(true);
              setBusy(false);
            })();
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // `audio` is a fresh object identity every App render (useAudioManager
    // returns a new object literal each call) but its methods are each
    // individually stable useCallbacks, so it's safe to read via closure
    // here without making this one-shot boot effect re-run on every parent
    // render — same pattern already used for `audio.playNarration` in
    // Experience.jsx.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printLines]);

  // Terminal is the actual page footer — the ambient tension bed (see
  // useAudioManager.js's applyModulation) should fade out once the visitor
  // is here rather than keep playing at whatever level it was frozen at
  // when they scrolled past Experience's canvas. A SEPARATE observer from
  // the boot one above on purpose: that one is intentionally one-shot
  // (disconnects itself after the first entry), but this needs to react
  // every time the visitor scrolls in or back out — e.g. scrolling up from
  // Terminal into Contact should bring the ambience back, not leave it
  // silenced forever after one visit to the footer.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          audio?.setFooterActive(entry.isIntersecting);
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "Leaning in to the machine": scales the background photo toward the
  // screen's center as the section scrolls into place. Purely visual —
  // doesn't touch Experience.jsx's master ScrollTrigger, this section lives
  // in normal document flow below the pinned canvas.
  //
  // The terminal-mount box is scaled by the exact same factor, around the
  // same origin, in lockstep — .terminal-mount's left/top/width/height in
  // index.css are calibrated against the photo at scale(1), so without this
  // the box would stay fixed-size while the photo (and the screen glass on
  // it) grows underneath it, making the box look progressively too small
  // for the glass the further the visitor scrolls in.
  useEffect(() => {
    const img = bgImgRef.current;
    const mount = mountRef.current;
    const section = sectionRef.current;
    if (!img || !mount || !section) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    // Desktop-only: below md the terminal is a flat, centered, full-width
    // panel (see .terminal-mount's base rule in index.css), NOT mapped onto
    // the photo's angled CRT glass — the spec (§7) calls for "no 3D
    // transform" there. Scaling that full-width panel by up to 1.35 around a
    // 54%/42% origin pushes its left edge off-screen, clipping the first
    // character of every line (reported on-device). There's no "screen" to
    // lean into in flat-panel mode anyway, so this effect is desktop-only.
    if (window.matchMedia('(max-width: 767px)').matches) return undefined;

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'top top',
      scrub: 1,
      onUpdate: (self) => {
        const scale = 1 + self.progress * (CAMERA_MAX_SCALE - 1);
        img.style.transform = `scale(${scale})`;
        mount.style.transform = `scale(${scale})`;
      },
    });
    return () => trigger.kill();
  }, []);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history, typingText]);

  useEffect(() => {
    // preventScroll: true — a plain .focus() call defaults to scrolling the
    // newly-focused element into view, and this effect can fire the instant
    // the terminal is merely 30%+ visible (see the boot IntersectionObserver
    // below), not from a direct click. Without this, an unrelated scroll
    // event landing Terminal just past that threshold could yank the page
    // the rest of the way down on its own — a real, code-confirmed way
    // scroll could get forced toward Terminal with no user input.
    if (booted && !busy) inputRef.current?.focus({ preventScroll: true });
  }, [booted, busy]);

  async function runCommand(raw) {
    const cmd = raw.trim();
    if (!cmd) return;

    setHistory((prev) => [...prev, { id: nextId(), text: `> ${cmd}`, isInput: true }]);
    setInputHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);

    const key = cmd.toLowerCase();
    if (key === 'clear') {
      setHistory([]);
      return;
    }

    setBusy(true);
    setThinking(true);
    const thinkMs = THINKING_MIN_MS + Math.random() * (THINKING_MAX_MS - THINKING_MIN_MS);
    await new Promise((r) => setTimeout(r, thinkMs));
    setThinking(false);
    if (cancelledRef.current) return;

    const { lines, action } = resolveResponse(key);
    await printLines(lines, CHAR_MS);
    // Side effects come as declarative action tags from the data module so
    // wardenKnowledge.js stays a pure data store with no DOM/window access.
    if (!cancelledRef.current && action === 'download-cv') {
      window.open(CV_PDF_URL, '_blank', 'noopener');
    }
    setBusy(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      if (busy) return;
      const value = inputValue;
      setInputValue('');
      runCommand(value);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (inputHistory.length === 0) return;
      const nextIndex = historyIndex === -1 ? inputHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInputValue(inputHistory[nextIndex]);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= inputHistory.length) {
        setHistoryIndex(-1);
        setInputValue('');
      } else {
        setHistoryIndex(nextIndex);
        setInputValue(inputHistory[nextIndex]);
      }
    }
  }

  function focusInput() {
    setInteracted(true);
    inputRef.current?.focus();
  }

  return (
    <section
      id="terminal"
      ref={sectionRef}
      className="viewport-full relative flex w-full items-center justify-center overflow-hidden bg-black px-4 sm:px-8"
    >
      {/* scene-5-terminal.png: gothic study desk with a CRT already sitting
          on it (front-facing, no camera angle), screen dark until "powered
          on". Full-bleed backdrop; dimmed + heavily vignetted on mobile
          (flat panel mode, see .terminal-bezel in index.css), shown at
          natural brightness on desktop where the terminal is mapped
          directly onto its screen glass. */}
      {/* scene-5-terminal-mobile.webp is a pre-shrunk (1200px-wide) variant
          — worth doing even though mobile shows it at 50% opacity (flat
          panel mode above), since the browser still has to download and
          decode the full desktop resolution otherwise. */}
      <picture>
        <source media="(max-width: 768px)" srcSet="/assets/images/scene-5-terminal-mobile.webp" />
        <img
          ref={bgImgRef}
          src="/assets/images/scene-5-terminal.webp"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-50 md:opacity-100"
          style={{ transformOrigin: SCREEN_ORIGIN, willChange: 'transform' }}
        />
      </picture>
      {/* Mobile gradient lightened from the previous near-opaque
          from-black/70 via-black/60 to-black — that (over the already
          opacity-50 image) drowned scene-5 entirely, but the spec (§7) wants
          it kept as a *dimmed, visible* background behind the flat panel.
          Bottom stays darker to ground the panel. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/80 md:from-black/25 md:via-black/5 md:to-black/35" />

      {/* transform-origin left at its CSS default (50% 50%, i.e. this box's
          own center) deliberately — SCREEN_ORIGIN above is kept equal to
          this box's center (left + width/2, top + height/2) precisely so
          that "this box's own center" and "the img's SCREEN_ORIGIN point"
          are the same physical point in the section, letting both scale
          in lockstep without needing to duplicate SCREEN_ORIGIN here
          (which would resolve against this element's own small box instead
          of the full section and scale around the wrong point). */}
      <div ref={mountRef} className="terminal-mount">
        <div className="terminal-bezel">
          <div
            className="relative overflow-hidden rounded-md md:flex md:h-full md:min-w-0 md:flex-1 md:flex-col md:justify-center md:rounded-none"
            style={{
              boxShadow:
                'inset 0 0 80px rgba(0,0,0,0.9), inset 0 0 30px rgba(201,162,39,0.06), inset 0 0 0 1px rgba(201,162,39,0.15)',
            }}
            onClick={focusInput}
          >
            {poweredOn && (
              <>
                {/* Phosphor bloom + faint light spill onto the desk edge —
                    screen-blended so it reads as light coming off dark
                    glass rather than a flat overlay. */}
                <div
                  aria-hidden="true"
                  className="crt-power-on pointer-events-none absolute inset-0 z-0 origin-center"
                  style={{
                    background:
                      'radial-gradient(ellipse at 35% 30%, rgba(232,182,76,0.22) 0%, rgba(232,182,76,0.05) 55%, rgba(232,182,76,0) 75%)',
                    mixBlendMode: 'screen',
                  }}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-6 z-0 opacity-60 blur-2xl md:-inset-3"
                  style={{
                    background: 'radial-gradient(ellipse at center, rgba(232,182,76,0.18) 0%, rgba(232,182,76,0) 70%)',
                    mixBlendMode: 'screen',
                  }}
                />

                <div
                  className="crt-flicker pointer-events-none absolute inset-0 z-20"
                  style={{
                    background:
                      'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 3px)',
                  }}
                />
                <div
                  className="pointer-events-none absolute inset-0 z-20"
                  style={{
                    background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.65) 100%)',
                  }}
                />

                <div className="relative z-10 flex shrink-0 items-center gap-2 overflow-hidden border-b border-gold-faint bg-black/60 px-4 py-2 md:min-w-0 md:gap-1.5 md:border-b-0 md:bg-transparent md:px-2 md:py-1">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-gold-dim md:h-[4px] md:w-[4px] md:bg-[#ffb020]" />
                  <span className="truncate font-mono text-xs tracking-widest text-gold-dim md:text-[10px] md:font-medium md:tracking-tight md:text-[#ffb020]">
                    MUZAMMIL://terminal — v1.0
                  </span>
                </div>

                <div
                  ref={bodyRef}
                  className="terminal-scroll relative z-10 h-[50vh] max-h-[420px] overflow-y-auto overflow-x-hidden break-words px-4 py-4 font-mono text-sm leading-relaxed text-[#d8caa0] md:h-auto md:max-h-[70%] md:min-w-0 md:flex-none md:px-2 md:py-1.5 md:text-[10px] md:font-medium md:leading-[1.4] md:text-[#ffb020]"
                >
                  {history.map((line) => (
                    <div
                      key={line.id}
                      className={line.isInput ? 'text-gold md:text-[#ffb020]' : 'whitespace-pre-wrap'}
                    >
                      {line.text}
                    </div>
                  ))}
                  {typingText !== null && <div className="whitespace-pre-wrap">{typingText}</div>}

                  {thinking && (
                    <div className="mt-1 flex items-center gap-1.5" aria-hidden="true">
                      <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-gold md:bg-[#ffb020]" />
                      <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-gold md:bg-[#ffb020]" />
                      <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-gold md:bg-[#ffb020]" />
                    </div>
                  )}

                  {booted && (
                    <div className="mt-1 flex items-center gap-2 md:min-w-0 md:gap-1.5">
                      <span className="shrink-0 text-gold md:text-[#ffb020]">&gt;</span>
                      <div className="relative min-w-0 flex-1 overflow-hidden">
                        <span className="whitespace-pre">{inputValue}</span>
                        <span className="terminal-cursor ml-0.5 inline-block h-4 w-[7px] translate-y-[2px] bg-gold align-middle md:h-[11px] md:w-[5px] md:translate-y-[2px] md:bg-[#ffb020]" />
                        <input
                          ref={inputRef}
                          value={inputValue}
                          disabled={busy}
                          onChange={(e) => {
                            setInputValue(e.target.value);
                            audio?.playTypingTick();
                          }}
                          onKeyDown={handleKeyDown}
                          spellCheck={false}
                          autoComplete="off"
                          aria-label="Terminal input"
                          className="absolute inset-0 h-full w-full bg-transparent text-transparent caret-transparent outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {booted && !interacted && (
                  <p className="terminal-hint pointer-events-none absolute inset-x-0 bottom-1 z-10 px-4 text-center font-mono text-[10px] italic text-gold-dim opacity-50 md:bottom-1 md:px-2 md:text-[10px] md:font-medium md:text-[#ffb020] md:opacity-50 md:[animation:none]">
                    click the screen to type
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
